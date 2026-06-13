import type { NextFunction, Request, Response } from 'express';
import { dataStore } from '../services/data-store';
import type { WorkspaceRole } from '../services/store';

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

function hasRequiredRole(actual: WorkspaceRole, required: WorkspaceRole) {
  return roleRank[actual] >= roleRank[required];
}

async function authorizeWorkspace(req: Request, res: Response, next: NextFunction, workspaceId: string, role: WorkspaceRole) {
  if (!req.user) return res.status(401).json({ error: 'missing_user' });
  const membership = await dataStore.getMembership(workspaceId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'workspace_access_denied' });
  if (!hasRequiredRole(membership.role, role)) return res.status(403).json({ error: 'insufficient_role' });
  return next();
}

export function requireWorkspaceRole(role: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    return authorizeWorkspace(req, res, next, String(req.params.workspaceId), role);
  };
}

export function requireBoardRole(role: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = await dataStore.getBoardWorkspaceId(String(req.params.boardId));
    if (!workspaceId) return res.status(404).json({ error: 'board_not_found' });
    return authorizeWorkspace(req, res, next, workspaceId, role);
  };
}

export function requireTaskRole(role: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = await dataStore.getTaskWorkspaceId(String(req.params.taskId));
    if (!workspaceId) return res.status(404).json({ error: 'task_not_found' });
    return authorizeWorkspace(req, res, next, workspaceId, role);
  };
}

export function requireTagRole(role: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = await dataStore.getTagWorkspaceId(String(req.params.tagId));
    if (!workspaceId) return res.status(404).json({ error: 'tag_not_found' });
    return authorizeWorkspace(req, res, next, workspaceId, role);
  };
}

export function requireAutomationRole(role: WorkspaceRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = await dataStore.getAutomationWorkspaceId(String(req.params.ruleId));
    if (!workspaceId) return res.status(404).json({ error: 'automation_not_found' });
    return authorizeWorkspace(req, res, next, workspaceId, role);
  };
}
