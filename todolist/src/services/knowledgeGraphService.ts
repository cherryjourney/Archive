import { invoke } from '@tauri-apps/api/core';
import type { KnowledgeGraphData, KnowledgeContext } from '@/types/knowledgeGraph';

export const knowledgeGraphService = {
  buildKnowledgeGraph: () =>
    invoke<KnowledgeGraphData>('build_knowledge_graph'),

  getTaskKnowledgeContext: (taskId: string) =>
    invoke<KnowledgeContext>('get_task_knowledge_context', { taskId }),
};
