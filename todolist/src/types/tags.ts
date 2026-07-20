export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  source?: string;       // 'obsidian' | 'manual'
  vault_path?: string;
}
export interface CreateTagParams {
  name: string;
  color?: string;
}
export interface EntityLink {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_text: string;
  created_at: string;
}
export interface CreateEntityLinkParams {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_text?: string;
}
