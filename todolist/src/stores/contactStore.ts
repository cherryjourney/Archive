import { create } from 'zustand';
import { contactService } from '@/services/contactService';
import type { Contact, ContactLink, ContactGraphData, CreateContactParams, UpdateContactParams, CreateContactLinkParams, CreateContactRelationParams, DeleteContactRelationParams } from '@/types/contact';

interface ContactState {
  contacts: Contact[]; graph: ContactGraphData | null;
  selectedId: string | null; links: ContactLink[]; loading: boolean;
  filterType: string | null;
  setFilterType: (t: string | null) => void;
  fetchAll: () => Promise<void>;
  selectContact: (id: string | null) => Promise<void>;
  create: (params: CreateContactParams) => Promise<void>;
  update: (id: string, params: UpdateContactParams) => Promise<void>;
  remove: (id: string) => Promise<void>;
  createLink: (params: CreateContactLinkParams) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  createRelation: (params: CreateContactRelationParams) => Promise<void>;
  deleteRelation: (params: DeleteContactRelationParams) => Promise<void>;
  fetchGraph: () => Promise<void>;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [], graph: null, selectedId: null, links: [], loading: false,
  filterType: null,
  setFilterType: (t) => set({ filterType: t }),
  fetchAll: async () => {
    set({ loading: true });
    try {
      const contacts = await contactService.list();
      const graph = await contactService.getGraph();
      set({ contacts, graph, loading: false });
    } catch { set({ loading: false }); }
  },
  selectContact: async (id) => {
    if (!id) { set({ selectedId: null, links: [] }); return; }
    set({ selectedId: id });
    try { const links = await contactService.getLinks(id); set({ links }); } catch {}
  },
  create: async (params) => {
    const id = crypto.randomUUID(); await contactService.create(id, params); await get().fetchAll();
  },
  update: async (id, params) => { await contactService.update(id, params); await get().fetchAll(); },
  remove: async (id) => {
    await contactService.delete(id);
    if (get().selectedId === id) set({ selectedId: null, links: [] });
    await get().fetchAll();
  },
  createLink: async (params) => {
    const id = crypto.randomUUID(); await contactService.createLink(id, params);
    if (get().selectedId) await get().selectContact(get().selectedId!);
    await get().fetchGraph();
  },
  deleteLink: async (id) => {
    await contactService.deleteLink(id);
    if (get().selectedId) await get().selectContact(get().selectedId!);
  },
  createRelation: async (params) => { await contactService.createRelation(params); await get().fetchGraph(); },
  deleteRelation: async (params) => { await contactService.deleteRelation(params); await get().fetchGraph(); },
  fetchGraph: async () => { try { const g = await contactService.getGraph(); set({ graph: g }); } catch {} },
}));
