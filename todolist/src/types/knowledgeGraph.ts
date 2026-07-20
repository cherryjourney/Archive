import type { VaultNote } from './vault';

/** Full knowledge graph of an Obsidian vault */
export interface KnowledgeGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

/** A single note node in the knowledge graph */
export interface GraphNodeData {
  path: string;
  title: string;
  tags: string[];
  degree: number;
  inlink_count: number;
  outlink_count: number;
}

/** A directed link between two notes */
export interface GraphEdgeData {
  source: string;
  target: string;
  weight: number;
  link_text: string;
}

/** Combined context for a task: tag-matched notes + graph neighbors */
export interface KnowledgeContext {
  task_id: string;
  direct_notes: VaultNote[];
  graph_neighbors: GraphNodeData[];
  suggested_reading: string[];
}
