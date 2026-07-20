import { invoke } from '@tauri-apps/api/core';
import type { Tag, CreateTagParams, EntityLink, CreateEntityLinkParams } from '@/types/tags';

export const tagService = {
  createTag: (params: CreateTagParams) => invoke<Tag>('create_tag', { params }),
  deleteTag: (tagId: string) => invoke<void>('delete_tag', { tagId }),
  listTags: () => invoke<Tag[]>('list_tags'),
  addTagToEntity: (tagId: string, entityType: string, entityId: string) =>
    invoke<void>('add_tag_to_entity', { tagId, entityType, entityId }),
  removeTagFromEntity: (tagId: string, entityType: string, entityId: string) =>
    invoke<void>('remove_tag_from_entity', { tagId, entityType, entityId }),
  getTagsForEntity: (entityType: string, entityId: string) =>
    invoke<Tag[]>('get_tags_for_entity', { entityType, entityId }),
  getEntitiesByTag: (tagId: string) =>
    invoke<[string, string][]>('get_entities_by_tag', { tagId }),
  createEntityLink: (params: CreateEntityLinkParams) =>
    invoke<EntityLink>('create_entity_link', { params }),
  deleteEntityLink: (linkId: string) => invoke<void>('delete_entity_link', { linkId }),
  getBacklinks: (targetType: string, targetId: string) =>
    invoke<EntityLink[]>('get_backlinks', { targetType, targetId }),
};
