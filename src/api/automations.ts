import { api } from './client';

export interface AutomationRule {
  id: string;
  boardId: string;
  name: string;
  active: boolean;
  trigger: unknown;
  conditions?: unknown;
  actions: unknown;
}

export function listAutomations(boardId: string) {
  return api<AutomationRule[]>(`/boards/${boardId}/automations`);
}

export function createAutomation(boardId: string, input: Omit<AutomationRule, 'id' | 'boardId'>) {
  return api<AutomationRule>(`/boards/${boardId}/automations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAutomation(ruleId: string, input: Partial<Omit<AutomationRule, 'id' | 'boardId'>>) {
  return api<AutomationRule>(`/automations/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAutomation(ruleId: string) {
  return api<{ deleted: boolean }>(`/automations/${ruleId}`, { method: 'DELETE' });
}
