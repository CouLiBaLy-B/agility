import { api, apiConfig } from './client';
import type { ApiUser, WorkspaceSummary } from './auth';

export function listWorkspaces() {
  return api<WorkspaceSummary[]>('/workspaces');
}

export function listWorkspaceMembers(workspaceId = apiConfig.workspaceId) {
  return api<ApiUser[]>(`/workspaces/${workspaceId}/members`);
}
