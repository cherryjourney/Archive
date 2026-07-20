export interface Contact {
  id: string; name: string; contact_info: string;
  relationship_type: string; custom_tags: string;
  met_date: string | null; important_dates: string;
  common_experiences: string; notes: string;
  created_at: string; updated_at: string;
}
export interface ContactLink {
  id: string; contact_id: string; entity_type: string;
  entity_id: string; label: string; created_at: string;
}
export interface GraphNode { id: string; name: string; relationship_type: string; custom_tags: string; }
export interface GraphEdge { source: string; target: string; label: string; edge_type: string; }
export interface ContactGraphData { nodes: GraphNode[]; edges: GraphEdge[]; }
export interface CreateContactParams {
  name: string; contact_info?: string; relationship_type?: string;
  custom_tags?: string; met_date?: string; important_dates?: string;
  common_experiences?: string; notes?: string;
}
export interface UpdateContactParams {
  name?: string; contact_info?: string; relationship_type?: string;
  custom_tags?: string; met_date?: string; important_dates?: string;
  common_experiences?: string; notes?: string;
}
export interface CreateContactLinkParams {
  contact_id: string; entity_type: string; entity_id: string; label?: string;
}
export interface CreateContactRelationParams {
  source_id: string; target_id: string; label?: string;
}
export interface DeleteContactRelationParams {
  source_id: string; target_id: string;
}
