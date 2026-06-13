import { api } from './client';

export interface TaskComment {
  id: string;
  userId: string;
  text: string;
  date: string;
}

export function addTaskComment(taskId: string, text: string) {
  return api<TaskComment>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
