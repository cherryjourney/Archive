import { useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '@/types/contact';

// ── Types ──────────────────────────────────────────────────

interface Person {
  id: string;
  name: string;
  relationship_type: string;
  generation: number;
  meLabel: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  childrenIds: string[];
  // layout
  x: number;
  y: number;
  subtreeCenter: number;
  subtreeWidth: number;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// ── Visual constants ───────────────────────────────────────

const GEN_GAP = 160;        // vertical gap between generations
const NODE_W = 124;         // card width
const NODE_H = 58;          // card height
const H_GAP = 28;           // min horizontal gap between siblings
const SPOUSE_GAP = 12;      // gap between spouses
const GEN_LABEL_X = -260;   // x position of generation labels

const FAMILY_COLOR = '#C08497';
const ME_COLOR = '#D4A853';
const LINE_COLOR = '#C0849788';
const SPOUSE_LINE_COLOR = '#C0849755';
const GEN_STRIPE_ALPHA = 0.03;

// ── Helpers ────────────────────────────────────────────────

const GEN_LABELS: Record<string, string> = {
  '3': '曾祖辈',
  '2': '祖辈',
  '1': '父辈',
  '0': '我辈',
  '-1': '子辈',
  '-2': '孙辈',
};

function genLabel(gen: number): string {
  const key = String(gen);
  return GEN_LABELS[key] || `${gen > 0 ? '祖' : '孙'}辈`;
}

// ── Component ──────────────────────────────────────────────

export default function FamilyTree({ nodes, edges, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    people: Person[];
    panX: number;
    panY: number;
    scale: number;
    hoverId: string | null;
    dragId: string | null;
    animFrame: number;
    maxGen: number;
    minGen: number;
  } | null>(null);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const mouseRef = useRef({ lx: 0, ly: 0, dx: 0, dy: 0 });

  // ── Tree building ────────────────────────────────────────

  const buildPeople = useCallback((): Person[] => {
    const familyIds = new Set(
      nodes.filter(n => n.relationship_type === '亲情' || n.id === '__me__').map(n => n.id),
    );

    // First pass: expand familyIds to include people referenced in family edges.
    // This ensures parents/spouses show up even if their own relationship_type differs.
    for (const e of edges) {
      if (e.edge_type === 'family') {
        if (familyIds.has(e.source)) familyIds.add(e.target);
        if (familyIds.has(e.target)) familyIds.add(e.source);
      }
    }

    // Parse family links
    const fatherOf = new Map<string, string>();
    const motherOf = new Map<string, string>();
    const spouseOf = new Map<string, string>();
    const meLabelOf = new Map<string, string>();

    for (const e of edges) {
      if (e.edge_type === 'family' && familyIds.has(e.source) && familyIds.has(e.target)) {
        if (e.label === 'father') fatherOf.set(e.source, e.target);
        else if (e.label === 'mother') motherOf.set(e.source, e.target);
        else if (e.label === 'spouse') {
          spouseOf.set(e.source, e.target);
          spouseOf.set(e.target, e.source);
        }
      }
      if (e.edge_type === 'default' && e.source === '__me__' && familyIds.has(e.target)) {
        meLabelOf.set(e.target, e.label);
      }
    }

    // Build children map (both father and mother get the child)
    const childrenOf = new Map<string, string[]>();
    const addChild = (parentId: string, childId: string) => {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      const list = childrenOf.get(parentId)!;
      if (!list.includes(childId)) list.push(childId);
    };
    for (const [childId, fatherId] of fatherOf) addChild(fatherId, childId);
    for (const [childId, motherId] of motherOf) addChild(motherId, childId);

    // Assign generations: find roots (no parents), BFS downward
    const gen = new Map<string, number>();
    const queue: string[] = [];

    for (const id of familyIds) {
      if (!fatherOf.has(id) && !motherOf.has(id)) {
        gen.set(id, 2); // oldest = gen 2
        queue.push(id);
      }
    }
    if (queue.length === 0) {
      gen.set('__me__', 0);
      queue.push('__me__');
    }

    while (queue.length > 0) {
      const id = queue.shift()!;
      const myGen = gen.get(id)!;
      for (const kidId of childrenOf.get(id) || []) {
        if (!gen.has(kidId)) {
          gen.set(kidId, myGen - 1);
          queue.push(kidId);
        }
      }
      const sp = spouseOf.get(id);
      if (sp && !gen.has(sp)) {
        gen.set(sp, myGen);
        queue.push(sp);
      }
    }

    for (const id of familyIds) {
      if (!gen.has(id)) gen.set(id, 0);
    }

    // Normalize: make oldest known = highest positive gen, me = 0 ideally
    // Shift so "me" is at gen 0 if possible
    const meGen = gen.get('__me__') ?? 0;
    const offset = meGen;
    for (const [id, g] of gen) gen.set(id, g - offset);

    const people: Person[] = [];
    for (const n of nodes) {
      if (!familyIds.has(n.id)) continue;
      people.push({
        id: n.id,
        name: n.name,
        relationship_type: n.relationship_type,
        generation: gen.get(n.id) ?? 0,
        meLabel: meLabelOf.get(n.id) || '',
        fatherId: fatherOf.get(n.id),
        motherId: motherOf.get(n.id),
        spouseId: spouseOf.get(n.id),
        childrenIds: childrenOf.get(n.id) || [],
        x: 0, y: 0, subtreeCenter: 0, subtreeWidth: 0,
      });
    }

    return people;
  }, [nodes, edges]);

  // ── Layout ───────────────────────────────────────────────

  const layout = useCallback((people: Person[]) => {
    const byGen = new Map<number, Person[]>();
    for (const p of people) {
      const arr = byGen.get(p.generation) || [];
      arr.push(p);
      byGen.set(p.generation, arr);
    }

    const gens = Array.from(byGen.keys()).sort((a, b) => b - a);
    const maxGen = gens[0] ?? 0;
    const minGen = gens[gens.length - 1] ?? 0;

    // Build parent→children lookup and sort
    const personMap = new Map(people.map(p => [p.id, p]));

    // Compute subtree widths bottom-up (from youngest gen upward)
    for (const gen of gens) {
      const row = byGen.get(gen)!;
      for (const p of row) {
        const kids = p.childrenIds.map(kidId => personMap.get(kidId)).filter(Boolean) as Person[];
        if (kids.length === 0) {
          p.subtreeWidth = NODE_W;
          p.subtreeCenter = 0;
        } else {
          const leftmost = kids[0];
          const rightmost = kids[kids.length - 1];
          p.subtreeWidth = rightmost.subtreeCenter - leftmost.subtreeCenter + NODE_W;
          p.subtreeCenter = (leftmost.subtreeCenter + rightmost.subtreeCenter) / 2;
        }
        // If has spouse, combine widths
        if (p.spouseId) {
          const sp = personMap.get(p.spouseId);
          if (sp && sp.generation === p.generation && sp !== p) {
            const combinedWidth = Math.max(p.subtreeWidth, NODE_W) + SPOUSE_GAP + Math.max(sp.subtreeWidth, NODE_W);
            // Don't double-count; let the "left" spouse carry the combined width
            // For now, just mark and handle during placement
          }
        }
      }
    }

    // Place nodes top-down
    for (const gen of gens) {
      const row = byGen.get(gen)!;
      // Sort: group spouses together, then by subtree center
      const placed = new Set<string>();
      const ordered: Person[] = [];

      for (const p of row) {
        if (placed.has(p.id)) continue;
        const sp = p.spouseId ? personMap.get(p.spouseId) : null;
        if (sp && row.includes(sp) && !placed.has(sp.id)) {
          // Place spouse pair: p left, sp right (or by ID order)
          const [left, right] = p.id < sp.id ? [p, sp] : [sp, p];
          ordered.push(left, right);
          placed.add(left.id);
          placed.add(right.id);
        } else {
          ordered.push(p);
          placed.add(p.id);
        }
      }

      // Position each person in this generation
      let cursor = 0;
      // Center the row
      const totalW = ordered.reduce((sum, p, i) => {
        const prev = i > 0 ? ordered[i - 1] : null;
        const isSpouse = prev && (prev.spouseId === p.id || p.spouseId === prev.id);
        return sum + (isSpouse ? SPOUSE_GAP : H_GAP) + NODE_W;
      }, -H_GAP);

      cursor = -totalW / 2;

      for (let i = 0; i < ordered.length; i++) {
        const p = ordered[i];
        const prev = i > 0 ? ordered[i - 1] : null;
        const isSpouseOfPrev = prev && (prev.spouseId === p.id || p.spouseId === prev.id);

        if (isSpouseOfPrev) {
          cursor += SPOUSE_GAP;
        } else if (i > 0) {
          cursor += H_GAP;
        }

        p.x = cursor + NODE_W / 2;
        cursor += NODE_W;
      }

      row.forEach(p => { p.y = 0; }); // y set later
    }

    return { maxGen, minGen, gens };
  }, []);

  // ── Render ───────────────────────────────────────────────

  const render = useCallback(() => {
    const st = stateRef.current;
    const canvas = canvasRef.current;
    if (!st || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Read CSS variables (light/dark adaptive)
    // NOTE: --bg-root is a CSS radial-gradient() string — canvas fillStyle can't render CSS gradients.
    // Use --bg-sidebar (solid opaque color) as the canvas background instead.
    const cs = getComputedStyle(document.body);
    const bgPage = cs.getPropertyValue('--bg-page').trim() || cs.getPropertyValue('--bg-sidebar').trim() || '#F8FAFC';
    const bgCard = cs.getPropertyValue('--bg-card').trim() || 'rgba(255,255,255,0.72)';
    const textPrimary = cs.getPropertyValue('--text-primary').trim() || '#0F172A';
    const textMuted = cs.getPropertyValue('--text-muted').trim() || '#94A3B8';

    // Background
    ctx.fillStyle = bgPage;
    ctx.fillRect(0, 0, cw, ch);

    const { people, scale, panX, panY, maxGen, minGen } = st;
    const personMap = new Map(people.map(p => [p.id, p]));

    const sc = (tx: number, ty: number) => ({
      x: tx * scale + cw / 2 + panX,
      y: ty * scale + ch / 2 + panY,
    });

    const hoverId = st.hoverId;
    const currentSelected = selectedIdRef.current;

    // ── Generation bands ─────────────────────────────────
    for (let gen = maxGen; gen >= minGen; gen--) {
      const genPeople = people.filter(p => p.generation === gen);
      if (!genPeople.length) continue;
      const gy = genPeople[0].y;
      const { x: sx, y: sy } = sc(-400, gy - GEN_GAP / 2 + 12);
      const { x: ex, y: ey } = sc(400, gy + GEN_GAP / 2 - 12);

      // Subtle stripe
      ctx.fillStyle = gen % 2 === 0
        ? `${FAMILY_COLOR}${Math.round(GEN_STRIPE_ALPHA * 255).toString(16).padStart(2, '0')}`
        : 'transparent';
      ctx.fillRect(0, sy, cw, ey - sy);

      // Generation label
      const { x: lx, y: ly } = sc(GEN_LABEL_X, gy);
      ctx.fillStyle = textMuted;
      ctx.font = `400 ${Math.round(12 * scale)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(genLabel(gen), lx, ly);
    }

    // ── Lines (drawn first, below nodes) ──────────────────
    ctx.lineCap = 'round';

    for (const p of people) {
      const pp = sc(p.x, p.y);
      const halfH = (NODE_H * scale) / 2;

      // Parent→child lines
      for (const kidId of p.childrenIds) {
        const kid = personMap.get(kidId);
        if (!kid || kid.generation >= p.generation) continue; // only downward
        const kp = sc(kid.x, kid.y);

        const top = pp.y + halfH;
        const bottom = kp.y - halfH;
        if (bottom <= top) continue;

        const midY = (top + bottom) / 2;

        ctx.beginPath();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 1.3 * scale;
        ctx.moveTo(pp.x, top);
        ctx.lineTo(pp.x, midY);
        ctx.lineTo(kp.x, midY);
        ctx.lineTo(kp.x, bottom);
        ctx.stroke();
      }

      // Spouse line (draw once per pair: p.id < sp.id)
      if (p.spouseId && p.id < p.spouseId) {
        const sp = personMap.get(p.spouseId);
        if (sp && sp.generation === p.generation) {
          const spp = sc(sp.x, sp.y);
          const midY = pp.y;
          ctx.beginPath();
          ctx.strokeStyle = SPOUSE_LINE_COLOR;
          ctx.lineWidth = 1 * scale;
          ctx.setLineDash([4 * scale, 4 * scale]);
          ctx.moveTo(pp.x + (NODE_W * scale) / 2 + 2, midY);
          ctx.lineTo(spp.x - (NODE_W * scale) / 2 - 2, midY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // ── Node cards ───────────────────────────────────────
    for (const p of people) {
      const pp = sc(p.x, p.y);
      if (pp.x < -NODE_W || pp.x > cw + NODE_W || pp.y < -NODE_H || pp.y > ch + NODE_H) continue;

      const isMe = p.id === '__me__';
      const isHovered = hoverId === p.id;
      const isSelected = currentSelected === p.id;
      const color = isMe ? ME_COLOR : FAMILY_COLOR;

      const cardW = NODE_W * scale;
      const cardH = NODE_H * scale;
      const rx = 8 * scale;
      const x = pp.x - cardW / 2;
      const y = pp.y - cardH / 2;

      // Shadow on hover/select
      if (isHovered || isSelected) {
        ctx.shadowColor = `${color}44`;
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetY = 2 * scale;
      }

      // Card body
      ctx.beginPath();
      ctx.moveTo(x + rx, y);
      ctx.lineTo(x + cardW - rx, y);
      ctx.arcTo(x + cardW, y, x + cardW, y + rx, rx);
      ctx.lineTo(x + cardW, y + cardH - rx);
      ctx.arcTo(x + cardW, y + cardH, x + cardW - rx, y + cardH, rx);
      ctx.lineTo(x + rx, y + cardH);
      ctx.arcTo(x, y + cardH, x, y + cardH - rx, rx);
      ctx.lineTo(x, y + rx);
      ctx.arcTo(x, y, x + rx, y, rx);
      ctx.closePath();

      ctx.fillStyle = isSelected ? `${color}15` : bgCard;
      ctx.fill();
      ctx.strokeStyle = isSelected ? color : `${color}40`;
      ctx.lineWidth = isSelected ? 1.8 : 0.8;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Top accent stripe
      ctx.beginPath();
      ctx.moveTo(x + rx, y);
      ctx.lineTo(x + cardW - rx, y);
      ctx.arcTo(x + cardW, y, x + cardW, y + rx, rx);
      ctx.lineTo(x + cardW, y + 3 * scale);
      ctx.lineTo(x, y + 3 * scale);
      ctx.lineTo(x, y + rx);
      ctx.arcTo(x, y, x + rx, y, rx);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Name
      const nameSize = Math.round(isMe ? 14 : 12) * scale;
      ctx.fillStyle = textPrimary;
      ctx.font = `${isMe || isSelected ? '600' : '500'} ${nameSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayName = p.name.length > 5 ? p.name.slice(0, 4) + '…' : p.name;
      ctx.fillText(displayName, pp.x, pp.y - 2);

      // Me-label below name
      const subSize = Math.round(10) * scale;
      ctx.fillStyle = textMuted;
      ctx.font = `${subSize}px sans-serif`;
      ctx.fillText(p.meLabel || (isMe ? '我' : ''), pp.x, pp.y + 18 * scale);
    }

    // ── Hover: highlight spouse/parent/children lines ─────
    // (simplified — just redraw the lines for the hovered person)
    if (hoverId) {
      const hp = people.find(p => p.id === hoverId);
      if (hp) {
        const pp = sc(hp.x, hp.y);
        const halfH = (NODE_H * scale) / 2;

        // Highlight parent→me lines
        if (hp.fatherId) {
          const father = personMap.get(hp.fatherId);
          if (father && father.generation > hp.generation) {
            const fp = sc(father.x, father.y);
            const top = fp.y + halfH, bottom = pp.y - halfH;
            if (bottom > top) {
              const midY = (top + bottom) / 2;
              ctx.beginPath();
              ctx.strokeStyle = FAMILY_COLOR;
              ctx.lineWidth = 2.2 * scale;
              ctx.globalAlpha = 0.6;
              ctx.moveTo(fp.x, top);
              ctx.lineTo(fp.x, midY);
              ctx.lineTo(pp.x, midY);
              ctx.lineTo(pp.x, bottom);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    }
  }, []);

  // ── Animation loop ───────────────────────────────────────

  const loop = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    render();
    st.animFrame = requestAnimationFrame(loop);
  }, [render]);

  // ── Init / rebuild ───────────────────────────────────────

  useEffect(() => {
    const people = buildPeople();
    const { maxGen, minGen, gens } = layout(people);

    // Assign y based on generation
    const genY = new Map<number, number>();
    gens.forEach((gen, i) => {
      genY.set(gen, -(gens.length - 1) * GEN_GAP / 2 + i * GEN_GAP);
    });
    people.forEach(p => { p.y = genY.get(p.generation) ?? 0; });

    const existing = stateRef.current;
    if (existing) {
      existing.people = people;
      existing.maxGen = maxGen;
      existing.minGen = minGen;
    } else {
      stateRef.current = {
        people, maxGen, minGen,
        panX: 0, panY: 0,
        scale: 0.88,
        hoverId: null, dragId: null,
        animFrame: 0,
      };
    }

    cancelAnimationFrame(stateRef.current?.animFrame || 0);
    stateRef.current!.animFrame = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(stateRef.current?.animFrame || 0); };
  }, [buildPeople, layout, loop]);

  useEffect(() => { render(); }, [selectedId, render]);

  // ── Hit test ─────────────────────────────────────────────

  const hitTest = useCallback((sx: number, sy: number): Person | null => {
    const st = stateRef.current;
    const canvas = canvasRef.current;
    if (!st || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    for (const p of st.people) {
      const px = p.x * st.scale + cw / 2 + st.panX;
      const py = p.y * st.scale + ch / 2 + st.panY;
      const hw = (NODE_W * st.scale) / 2 + 8;
      const hh = (NODE_H * st.scale) / 2 + 8;
      if (sx > px - hw && sx < px + hw && sy > py - hh && sy < py + hh) return p;
    }
    return null;
  }, []);

  // ── Mouse handlers ───────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const st = stateRef.current; if (!st) return;
    mouseRef.current = { lx: e.clientX, ly: e.clientY, dx: e.clientX, dy: e.clientY };
    const rect = canvasRef.current!.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    st.dragId = hit ? hit.id : 'pan';
  }, [hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const st = stateRef.current; const canvas = canvasRef.current;
    if (!st || !canvas) return;
    const dx = e.clientX - mouseRef.current.lx;
    const dy = e.clientY - mouseRef.current.ly;
    mouseRef.current = { ...mouseRef.current, lx: e.clientX, ly: e.clientY };

    if (st.dragId === 'pan') { st.panX += dx; st.panY += dy; return; }
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    st.hoverId = hit ? hit.id : null;
    if (canvas) canvas.style.cursor = hit ? 'pointer' : 'grab';
  }, [hitTest]);

  const handleMouseUp = useCallback(() => {
    const st = stateRef.current; if (!st) return;
    const tdx = mouseRef.current.lx - mouseRef.current.dx;
    const tdy = mouseRef.current.ly - mouseRef.current.dy;
    const didMove = Math.abs(tdx) > 3 || Math.abs(tdy) > 3;
    if (st.dragId === 'pan') { if (!didMove) onSelectRef.current(null); }
    else if (st.dragId && !didMove) onSelectRef.current(st.dragId === '__me__' ? null : st.dragId);
    st.dragId = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const st = stateRef.current; if (!st) return;
    e.preventDefault();
    st.scale = Math.max(0.35, Math.min(2.2, st.scale * (e.deltaY < 0 ? 1.07 : 0.93)));
  }, []);

  // ── JSX ──────────────────────────────────────────────────

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
    />
  );
}
