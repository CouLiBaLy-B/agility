import { api, apiConfig } from './client';
import type { ApiUser, WorkspaceSummary } from './auth';

export function listWorkspaces() {
  return api<WorkspaceSummary[]>('/workspaces');
}

export function listWorkspaceMembers(workspaceId = apiConfig.workspaceId) {
  return api<ApiUser[]>(`/workspaces/${workspaceId}/members`);
}

export function inviteWorkspaceMember(
  input: { email: string; name?: string; role?: ApiUser['role'] },
  workspaceId = apiConfig.workspaceId,
) {
  return api<ApiUser>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWorkspaceMemberRole(userId: string, role: ApiUser['role'], workspaceId = apiConfig.workspaceId) {
  return api<ApiUser>(`/workspaces/${workspaceId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function removeWorkspaceMember(userId: string, workspaceId = apiConfig.workspaceId) {
  return api<{ deleted: boolean }>(`/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  });
}
