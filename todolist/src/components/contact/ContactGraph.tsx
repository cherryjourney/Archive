import { useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '@/types/contact';

interface SimNode {
  id: string;
  x: number; y: number;
  vx: number; vy: number;
  pinned: boolean;
  name: string;
  relationship_type: string;
  degree: number;  // number of connected edges
}

interface SimEdge {
  source: string;
  target: string;
  label: string;
  edge_type: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  filterType: string | null;
  onSelect: (id: string | null) => void;
  nodeSizeMult?: number;
  repulsionMult?: number;
  attractionMult?: number;
  labelSizeMult?: number;
}

// Obsidian-inspired palette — muted, low saturation
const REL_COLORS: Record<string, string> = {
  'self':      '#D4A853',
  '亲情':       '#C08497',
  '友情':       '#7B9EC7',
  '爱情':       '#CF8B9B',
  '同学':       '#8EA876',
  '学术合作':   '#9B8EC4',
  '职业发展':   '#6DA7B5',
  '日常服务':   '#AA9887',
};

// Family relationship edge colors — bold, distinct
const FAMILY_EDGE_COLORS: Record<string, { color: string; label: string }> = {
  'spouse':  { color: '#E03131', label: '夫妻' },
  'father':  { color: '#3B82F6', label: '父' },
  'mother':  { color: '#EC4899', label: '母' },
};
const FAMILY_EDGE_DEFAULT = { color: '#8B5CF6', label: '亲属' };
const DEFAULT_COLOR = '#8C8CAA';
const NODE_R = 10;
const ME_R = 18;
const BASE_REST_LEN = 120;    // base rest length for edges
const REPULSION = 28000;      // strong repulsion → organic spread, no uniform ring
const ATTRACTION = 0.003;     // gentler attraction → looser clusters
const DAMPING = 0.65;         // lower damping → longer settling → natural web
const CENTER_GRAVITY = 0.00003; // very weak center pull (prevents drift, doesn't form rings)
const MAX_TICKS = 500;        // more ticks to reach organic equilibrium
const ENERGY_THRESHOLD = 0.35;

function getColor(type: string): string {
  return REL_COLORS[type] || DEFAULT_COLOR;
}

function isHidden(node: SimNode, filterType: string | null): boolean {
  if (!filterType) return false;
  if (node.id === '__me__') return false;
  return node.relationship_type !== filterType;
}

/** Compute node display radius from its degree (connection count) */
function getNodeRadius(node: SimNode, sizeMult: number): number {
  const isMe = node.id === '__me__';
  const base = isMe ? ME_R : NODE_R;
  const perEdge = isMe ? 0.8 : 2.0;
  const cap = isMe ? ME_R * 2.5 : NODE_R * 2.6;
  return Math.max(base, Math.min(cap, base + node.degree * perEdge)) * sizeMult;
}

export default function ContactGraph({
  nodes, edges, selectedId, filterType, onSelect,
  nodeSizeMult = 1.0, repulsionMult = 1.0, attractionMult = 1.0,
  labelSizeMult = 1.0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<{
    nodes: SimNode[];
    edges: SimEdge[];
    panX: number; panY: number;
    scale: number;
    running: boolean;
    tickCount: number;
    hoverId: string | null;
    dragId: string | null;
    animFrame: number;
  } | null>(null);

  // Refs to avoid stale closures in rAF loop — synced every render
  const filterTypeRef = useRef(filterType);
  filterTypeRef.current = filterType;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const nodeSizeMultRef = useRef(nodeSizeMult);
  nodeSizeMultRef.current = nodeSizeMult;
  const repulsionMultRef = useRef(repulsionMult);
  repulsionMultRef.current = repulsionMult;
  const attractionMultRef = useRef(attractionMult);
  attractionMultRef.current = attractionMult;
  const labelSizeMultRef = useRef(labelSizeMult);
  labelSizeMultRef.current = labelSizeMult;
  // Manual mouse tracking
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  // Build simulation — random initial scatter (NOT circular, to avoid ring bias)
  const buildSim = useCallback(() => {
    const nodeMap = new Map<string, SimNode>();
    const count = nodes.length + 1; // +1 for __me__
    const spread = Math.max(200, count * 35); // larger spread for more nodes
    for (const n of nodes) {
      nodeMap.set(n.id, {
        id: n.id,
        x: (Math.random() - 0.5) * spread * 2,
        y: (Math.random() - 0.5) * spread * 2,
        vx: 0, vy: 0,
        pinned: false,
        name: n.name,
        relationship_type: n.relationship_type,
        degree: 0,
      });
    }
    if (!nodeMap.has('__me__')) {
      nodeMap.set('__me__', {
        id: '__me__', name: '我', relationship_type: 'self',
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
        vx: 0, vy: 0, pinned: false,
        degree: 0,
      });
    }
    const simEdges: SimEdge[] = edges.map(e => ({
      source: e.source, target: e.target,
      label: e.label, edge_type: e.edge_type,
    }));
    // Count degrees for each node
    for (const e of simEdges) {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src) src.degree++;
      if (tgt) tgt.degree++;
    }
    return { nodes: nodeMap, edges: simEdges };
  }, [nodes, edges]);

  // Physics tick — reads from refs (always current)
  const tick = useCallback(() => {
    const s = simRef.current;
    if (!s) return;
    const simNodes = s.nodes;
    const simEdges = s.edges;
    const currentFilter = filterTypeRef.current;
    const repMult = repulsionMultRef.current;
    const attMult = attractionMultRef.current;
    const hiddenSet = new Set(
      simNodes.filter(n => isHidden(n, currentFilter)).map(n => n.id)
    );

    // Repulsion: visible node pairs
    const effRepulsion = REPULSION * repMult;
    for (let i = 0; i < simNodes.length; i++) {
      if (hiddenSet.has(simNodes[i].id)) continue;
      for (let j = i + 1; j < simNodes.length; j++) {
        if (hiddenSet.has(simNodes[j].id)) continue;
        const a = simNodes[i], b = simNodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const minDist = 1;
        if (distSq < minDist * minDist) {
          dx = Math.random() - 0.5; dy = Math.random() - 0.5;
        }
        const dist = Math.sqrt(Math.max(distSq, minDist * minDist));
        const force = effRepulsion / (distSq + 10);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.pinned) { a.vx += fx; a.vy += fy; }
        if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
      }
    }

    // Attraction: only edges with both ends visible
    // Dynamic rest length: high-degree nodes sit slightly further from neighbors
    const effAttraction = ATTRACTION * attMult;
    for (const e of simEdges) {
      if (hiddenSet.has(e.source) || hiddenSet.has(e.target)) continue;
      const a = simNodes.find(n => n.id === e.source);
      const b = simNodes.find(n => n.id === e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Highly connected nodes get longer rest length → natural hub-spoke layout
      const avgDeg = (a.degree + b.degree) / 2;
      const restLen = BASE_REST_LEN + Math.min(avgDeg * 3, 60);
      const force = effAttraction * (dist - restLen);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!a.pinned) { a.vx += fx; a.vy += fy; }
      if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
    }

    // Center gravity + damping
    let totalKE = 0;
    for (const n of simNodes) {
      if (hiddenSet.has(n.id)) { n.vx = 0; n.vy = 0; continue; }
      if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
      n.vx -= n.x * CENTER_GRAVITY;
      n.vy -= n.y * CENTER_GRAVITY;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      totalKE += n.vx * n.vx + n.vy * n.vy;
    }

    s.tickCount++;
    if (totalKE < ENERGY_THRESHOLD || s.tickCount >= MAX_TICKS) {
      s.running = false;
    }
  }, []);

  // Render — reads from refs
  const render = useCallback(() => {
    const s = simRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const toScreen = (wx: number, wy: number) => ({
      x: (wx + s.panX) * s.scale + w / 2,
      y: (wy + s.panY) * s.scale + h / 2,
    });

    const currentFilter = filterTypeRef.current;
    const currentSelected = selectedIdRef.current;
    const sizeMult = nodeSizeMultRef.current;
    const hoverId = s.hoverId;
    const hiddenSet = new Set(
      s.nodes.filter(n => isHidden(n, currentFilter)).map(n => n.id)
    );

    // Draw edges — hovered node's edges are highlighted, others dimmed
    for (const e of s.edges) {
      if (hiddenSet.has(e.source) || hiddenSet.has(e.target)) continue;
      const src = s.nodes.find(n => n.id === e.source);
      const tgt = s.nodes.find(n => n.id === e.target);
      if (!src || !tgt) continue;

      const p1 = toScreen(src.x, src.y);
      const p2 = toScreen(tgt.x, tgt.y);
      if (p1.x < -50 && p2.x < -50) continue;
      if (p1.x > w + 50 && p2.x > w + 50) continue;
      if (p1.y < -50 && p2.y < -50) continue;
      if (p1.y > h + 50 && p2.y > h + 50) continue;

      const isHoverRelevant = !hoverId || e.source === hoverId || e.target === hoverId;
      const isHighlighted = hoverId === e.source || hoverId === e.target
        || currentSelected === e.source || currentSelected === e.target;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (e.edge_type === 'family') {
        // Family edges get relationship-specific colors
        const fam = FAMILY_EDGE_COLORS[e.label] || FAMILY_EDGE_DEFAULT;
        ctx.strokeStyle = fam.color;
        ctx.lineWidth = isHighlighted ? 3.0 : 1.8;
        ctx.setLineDash([]);
      } else if (e.edge_type === 'direct') {
        ctx.strokeStyle = isHighlighted ? '#6B8EC7' : '#8A8AB0';
        ctx.lineWidth = isHighlighted ? 2.2 : 1.3;
        ctx.setLineDash([]);
      } else if (e.edge_type === 'shared') {
        ctx.strokeStyle = isHighlighted ? '#A0A0C0' : '#C0C0D4';
        ctx.lineWidth = isHighlighted ? 1.4 : 0.7;
        ctx.setLineDash([6, 6]);
      } else {
        ctx.strokeStyle = isHighlighted ? '#A8A8C0' : '#C8C8DC';
        ctx.lineWidth = isHighlighted ? 1.4 : 0.8;
        ctx.setLineDash([]);
      }

      if (isHighlighted) {
        ctx.globalAlpha = 0.95;
      } else if (!isHoverRelevant) {
        ctx.globalAlpha = 0.06;
      } else {
        ctx.globalAlpha = e.edge_type === 'family' ? 0.88 : 0.72;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Draw family edge label at midpoint
      if (e.edge_type === 'family') {
        const fam = FAMILY_EDGE_COLORS[e.label] || FAMILY_EDGE_DEFAULT;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const labelFontSize = Math.round(10 * labelSizeMultRef.current);
        // Background pill behind label
        ctx.font = `${labelFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(fam.label).width;
        const pillW = textWidth + 10;
        const pillH = labelFontSize + 6;
        ctx.fillStyle = 'var(--bg-card, rgba(255,255,255,0.9))';
        ctx.beginPath();
        ctx.roundRect(mx - pillW / 2, my - pillH / 2, pillW, pillH, 4);
        ctx.fill();
        ctx.fillStyle = fam.color;
        ctx.fillText(fam.label, mx, my);
      }
    }

    // Draw nodes — radius proportional to degree
    for (const n of s.nodes) {
      if (hiddenSet.has(n.id)) continue;
      const p = toScreen(n.x, n.y);
      if (p.x < -60 || p.x > w + 60 || p.y < -60 || p.y > h + 60) continue;

      const isMe = n.id === '__me__';
      const r = getNodeRadius(n, sizeMult);
      const color = getColor(n.relationship_type);
      const isHovered = s.hoverId === n.id;
      const isSelected = currentSelected === n.id;
      const drawR = isHovered ? r * 1.35 : r;

      // Glow on hover/select
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR + 10, 0, Math.PI * 2);
        ctx.fillStyle = `${color}22`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR + 5, 0, Math.PI * 2);
        ctx.fillStyle = `${color}30`;
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle border
      ctx.strokeStyle = isMe ? 'rgba(180,140,60,0.3)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Selected ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // "我" label — size independent from node radius
      if (isMe) {
        const meFontSize = Math.round(14 * labelSizeMultRef.current);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${meFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('我', p.x, p.y);
      }

      // Name label — ONLY uses labelSizeMult, truly independent from node size
      const labelMult = labelSizeMultRef.current;
      const fontSize = Math.round((isMe ? 12 : 11) * labelMult);
      ctx.fillStyle = getComputedStyle(canvas).color || '#666';
      ctx.font = `${isHovered ? '600' : '400'} ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = n.name.length > 6 ? n.name.slice(0, 5) + '…' : n.name;
      ctx.fillText(label, p.x, p.y + drawR + 4);
    }
  }, []);

  // Animation loop
  const loop = useCallback(() => {
    const s = simRef.current;
    if (!s) return;
    if (s.running) tick();
    render();
    s.animFrame = requestAnimationFrame(loop);
  }, [tick, render]);

  // Init simulation on mount / when node count changes
  useEffect(() => {
    const existing = simRef.current;
    const { nodes: nodeMap, edges: simEdges } = buildSim();

    if (existing) {
      for (const n of existing.nodes) {
        const kept = nodeMap.get(n.id);
        if (kept) { kept.x = n.x; kept.y = n.y; kept.vx = n.vx; kept.vy = n.vy; }
      }
      existing.nodes = Array.from(nodeMap.values());
      existing.edges = simEdges;
    } else {
      simRef.current = {
        nodes: Array.from(nodeMap.values()),
        edges: simEdges,
        panX: 0, panY: 0, scale: 1,
        running: true, tickCount: 0,
        hoverId: null, dragId: null, animFrame: 0,
      };
    }

    if (simRef.current) {
      simRef.current.running = true;
      simRef.current.tickCount = 0;
    }
    cancelAnimationFrame(simRef.current?.animFrame || 0);
    simRef.current!.animFrame = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(simRef.current?.animFrame || 0); };
  }, [nodes.length, edges.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart simulation on filter or multiplier change
  useEffect(() => {
    if (simRef.current) {
      simRef.current.running = true;
      simRef.current.tickCount = 0;
    }
  }, [filterType, nodeSizeMult, repulsionMult, attractionMult]);

  // Re-render on selection change
  useEffect(() => { render(); }, [selectedId, render]);

  // Hit test — uses degree-based radius
  const hitTest = useCallback((sx: number, sy: number): SimNode | null => {
    const s = simRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const wp = {
      x: (sx - w / 2) / s.scale - s.panX,
      y: (sy - h / 2) / s.scale - s.panY,
    };
    const currentFilter = filterTypeRef.current;
    const sizeMult = nodeSizeMultRef.current;
    for (const n of s.nodes) {
      if (isHidden(n, currentFilter)) continue;
      const r = getNodeRadius(n, sizeMult);
      const dx = n.x - wp.x, dy = n.y - wp.y;
      if (dx * dx + dy * dy < (r * 1.8) ** 2) return n;
    }
    return null;
  }, []);

  // ── Mouse handlers ───────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const s = simRef.current;
    if (!s) return;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    const rect = canvasRef.current!.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) {
      s.dragId = hit.id;
      hit.pinned = true;
      s.running = true;
      // defer onSelect to mouseup — need to distinguish click vs drag
    } else {
      s.dragId = 'pan';
    }
  }, [hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const s = simRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (s.dragId === 'pan') {
      s.panX += dx / s.scale;
      s.panY += dy / s.scale;
      s.running = true; s.tickCount = 0;
      return;
    }
    if (s.dragId) {
      const node = s.nodes.find(n => n.id === s.dragId);
      if (node) { node.x += dx / s.scale; node.y += dy / s.scale; node.vx = 0; node.vy = 0; }
      s.running = true; s.tickCount = 0;
      return;
    }
    const hit = hitTest(sx, sy);
    s.hoverId = hit ? hit.id : null;
    if (canvas) canvas.style.cursor = hit ? 'pointer' : 'default';
  }, [hitTest]);

  const handleMouseUp = useCallback(() => {
    const s = simRef.current;
    if (!s) return;
    const totalDx = lastMouseRef.current.x - mouseDownPosRef.current.x;
    const totalDy = lastMouseRef.current.y - mouseDownPosRef.current.y;
    const didMove = Math.abs(totalDx) > 4 || Math.abs(totalDy) > 4;
    if (s.dragId === 'pan') {
      // Click on blank (not a pan) → deselect
      if (!didMove) onSelectRef.current(null);
    } else if (s.dragId) {
      const node = s.nodes.find(n => n.id === s.dragId);
      if (node) {
        node.pinned = false;
        // Click (not drag) → open detail modal
        if (!didMove) onSelectRef.current(node.id === '__me__' ? null : node.id);
      }
    }
    s.dragId = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const s = simRef.current;
    if (!s) return;
    e.preventDefault();
    s.scale = Math.max(0.2, Math.min(4, s.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: '100%', height: '100%', display: 'block',
        background: 'var(--bg-graph, var(--bg-page))',
      }}
    />
  );
}
