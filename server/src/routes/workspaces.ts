import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';
import { requireWorkspaceRole } from '../middleware/rbac';

export const workspacesRouter = Router();
workspacesRouter.use(requireAuth);

workspacesRouter.get('/', async (req, res) => res.json(await dataStore.listWorkspaces(req.user!.id)));

workspacesRouter.get('/:workspaceId', async (req, res) => {
  const workspace = await dataStore.getWorkspace(String(req.params.workspaceId), req.user!.id);
  if (!workspace) return res.status(404).json({ error: 'workspace_not_found' });
  return res.json(workspace);
});

workspacesRouter.get('/:workspaceId/members', requireWorkspaceRole('viewer'), async (req, res) => {
  return res.json(await dataStore.listMembers(String(req.params.workspaceId)));
});

workspacesRouter.post('/:workspaceId/invitations', requireWorkspaceRole('admin'), async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      name: z.string().min(1).max(160).optional(),
      role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
    })
    .parse(req.body);
  return res.status(201).json(await dataStore.inviteMember(String(req.params.workspaceId), body));
});

workspacesRouter.patch('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), async (req, res) => {
  const body = z.object({ role: z.enum(['owner', 'admin', 'member', 'viewer']) }).parse(req.body);
  const member = await dataStore.updateMemberRole(String(req.params.workspaceId), String(req.params.userId), body.role);
  if (!member) return res.status(404).json({ error: 'member_not_found' });
  return res.json(member);
});

workspacesRouter.delete('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), async (req, res) => {
  return res.json(await dataStore.removeMember(String(req.params.workspaceId), String(req.params.userId)));
});

workspacesRouter.get('/:workspaceId/boards', requireWorkspaceRole('viewer'), async (req, res) => {
  return res.json(await dataStore.listBoards(String(req.params.workspaceId)));
});

const CreateBoardSchema = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

workspacesRouter.post('/:workspaceId/boards', requireWorkspaceRole('member'), async (req, res) => {
  const body = CreateBoardSchema.parse(req.body);
  const board = await dataStore.createBoard(String(req.params.workspaceId), body);
  return res.status(201).json(board);
});
