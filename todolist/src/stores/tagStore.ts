import { create } from 'zustand';
import type { Tag, CreateTagParams, EntityLink, CreateEntityLinkParams } from '@/types/tags';
import { tagService } from '@/services/tagService';

interface TagState {
  tags: Tag[];
  entityTags: Record<string, Tag[]>; // key: `${entity_type}:${entity_id}`
  backlinks: Record<string, EntityLink[]>;
  loading: boolean;
  fetchTags: () => Promise<void>;
  createTag: (params: CreateTagParams) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  fetchTagsForEntity: (entityType: string, entityId: string) => Promise<void>;
  addTagToEntity: (tagId: string, entityType: string, entityId: string) => Promise<void>;
  removeTagFromEntity: (tagId: string, entityType: string, entityId: string) => Promise<void>;
  fetchBacklinks: (targetType: string, targetId: string) => Promise<void>;
  createLink: (params: CreateEntityLinkParams) => Promise<void>;
  deleteLink: (linkId: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  entityTags: {},
  backlinks: {},
  loading: false,

  fetchTags: async () => {
    const tags = await tagService.listTags();
    set({ tags });
  },

  createTag: async (params) => {
    const tag = await tagService.createTag(params);
    set((s) => ({ tags: [...s.tags, tag] }));
    return tag;
  },

  deleteTag: async (id) => {
    await tagService.deleteTag(id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },

  fetchTagsForEntity: async (entityType, entityId) => {
    const tags = await tagService.getTagsForEntity(entityType, entityId);
    set((s) => ({
      entityTags: { ...s.entityTags, [`${entityType}:${entityId}`]: tags },
    }));
  },

  addTagToEntity: async (tagId, entityType, entityId) => {
    await tagService.addTagToEntity(tagId, entityType, entityId);
    get().fetchTagsForEntity(entityType, entityId);
  },

  removeTagFromEntity: async (tagId, entityType, entityId) => {
    await tagService.removeTagFromEntity(tagId, entityType, entityId);
    get().fetchTagsForEntity(entityType, entityId);
  },

  fetchBacklinks: async (targetType, targetId) => {
    const links = await tagService.getBacklinks(targetType, targetId);
    set((s) => ({
      backlinks: { ...s.backlinks, [`${targetType}:${targetId}`]: links },
    }));
  },

  createLink: async (params) => {
    await tagService.createEntityLink(params);
    get().fetchBacklinks(params.target_type, params.target_id);
  },

  deleteLink: async (linkId) => {
    await tagService.deleteEntityLink(linkId);
    // refresh isn't perfect without knowing the target, but ok for now
  },
}));
