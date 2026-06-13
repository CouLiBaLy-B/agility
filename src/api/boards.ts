import { api, apiConfig } from './client';
import type { Board, Task } from '../data/boards';

export function listBoards(workspaceId = apiConfig.workspaceId) {
  return api<Board[]>(`/workspaces/${workspaceId}/boards`);
}

export function createBoard(input: Pick<Board, 'name'> & Partial<Pick<Board, 'icon' | 'color'>>, workspaceId = apiConfig.workspaceId) {
  return api<Board>(`/workspaces/${workspaceId}/boards`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(task: Task) {
  return api<Task>(`/tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify(task),
  });
}

export function createTask(boardId: string, task: Task) {
  return api<Task>(`/boards/${boardId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}
