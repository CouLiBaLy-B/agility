import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const workspacesRouter = Router();
workspacesRouter.use(requireAuth);

workspacesRouter.get('/', async (_req, res) => res.json(await dataStore.listWorkspaces()));

workspacesRouter.get('/:workspaceId', async (req, res) => {
  const workspace = await dataStore.getWorkspace(req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: 'workspace_not_found' });
  return res.json(workspace);
});

workspacesRouter.get('/:workspaceId/members', async (req, res) => {
  return res.json(await dataStore.listMembers(req.params.workspaceId));
});

workspacesRouter.get('/:workspaceId/boards', async (req, res) => {
  return res.json(await dataStore.listBoards(req.params.workspaceId));
});

const CreateBoardSchema = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

workspacesRouter.post('/:workspaceId/boards', async (req, res) => {
  const body = CreateBoardSchema.parse(req.body);
  const board = await dataStore.createBoard(req.params.workspaceId, body);
  return res.status(201).json(board);
});
