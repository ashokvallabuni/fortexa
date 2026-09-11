import { apiGet, getActiveDatasetId } from './api';
import type { GraphNode, GraphEdge } from '@/types';

export const graphService = {
  async getGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    return apiGet<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/api/graph', { datasetId: getActiveDatasetId() });
  },

  async getNodeDetails(nodeId: string): Promise<GraphNode | null> {
    const { nodes } = await graphService.getGraph();
    return nodes.find(n => n.id === nodeId) ?? null;
  },
};
