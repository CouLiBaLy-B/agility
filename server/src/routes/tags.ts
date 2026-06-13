import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const tagsRouter = Router();
tagsRouter.use(requireAuth);

const TagSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

tagsRouter.get('/workspaces/:workspaceId/tags', async (req, res) => {
  return res.json(await dataStore.listTags(req.params.workspaceId));
});

tagsRouter.post('/workspaces/:workspaceId/tags', async (req, res) => {
  const body = TagSchema.parse(req.body);
  return res.status(201).json(await dataStore.createTag(req.params.workspaceId, body));
});

tagsRouter.patch('/tags/:tagId', async (req, res) => {
  const body = TagSchema.partial().parse(req.body);
  const tag = await dataStore.updateTag(req.params.tagId, body);
  if (!tag) return res.status(404).json({ error: 'tag_not_found' });
  return res.json(tag);
});

tagsRouter.delete('/tags/:tagId', async (req, res) => {
  return res.json(await dataStore.deleteTag(req.params.tagId));
});
