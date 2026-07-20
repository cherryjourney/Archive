import { invoke } from '@tauri-apps/api/core';
import type { Contact, ContactLink, ContactGraphData, CreateContactParams, UpdateContactParams, CreateContactLinkParams, CreateContactRelationParams, DeleteContactRelationParams } from '@/types/contact';
export const contactService = {
  list: () => invoke<Contact[]>('list_contacts'),
  get: (id: string) => invoke<Contact>('get_contact', { id }),
  create: (id: string, params: CreateContactParams) => invoke<void>('create_contact', { id, params }),
  update: (id: string, params: UpdateContactParams) => invoke<void>('update_contact', { id, params }),
  delete: (id: string) => invoke<void>('delete_contact', { id }),
  createLink: (id: string, params: CreateContactLinkParams) => invoke<void>('create_contact_link', { id, params }),
  deleteLink: (id: string) => invoke<void>('delete_contact_link', { id }),
  getLinks: (contactId: string) => invoke<ContactLink[]>('get_contact_links', { contactId }),
  getGraph: () => invoke<ContactGraphData>('get_contact_graph'),
  createRelation: (params: CreateContactRelationParams) => invoke<void>('create_contact_relation', { params }),
  deleteRelation: (params: DeleteContactRelationParams) => invoke<void>('delete_contact_relation', { params }),
  setFamilyLink: (contactId: string, relationType: string, targetId: string | null) =>
    invoke<void>('set_family_link', { contactId, relationType, targetId }),
};
