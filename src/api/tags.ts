import { api, apiConfig } from './client';

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export function listTags(workspaceId = apiConfig.workspaceId) {
  return api<Tag[]>(`/workspaces/${workspaceId}/tags`);
}

export function createTag(input: { name: string; color?: string }, workspaceId = apiConfig.workspaceId) {
  return api<Tag>(`/workspaces/${workspaceId}/tags`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTag(tagId: string, input: { name?: string; color?: string }) {
  return api<Tag>(`/tags/${tagId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTag(tagId: string) {
  return api<{ deleted: boolean }>(`/tags/${tagId}`, { method: 'DELETE' });
}
