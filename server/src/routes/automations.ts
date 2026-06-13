import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const automationsRouter = Router();
automationsRouter.use(requireAuth);

const AutomationSchema = z.object({
  name: z.string().min(1).max(160),
  active: z.boolean().default(false),
  trigger: z.unknown().default({ event: 'manual' }),
  conditions: z.unknown().optional(),
  actions: z.unknown().default({ type: 'noop' }),
});

automationsRouter.get('/boards/:boardId/automations', async (req, res) => {
  return res.json(await dataStore.listAutomations(req.params.boardId));
});

automationsRouter.post('/boards/:boardId/automations', async (req, res) => {
  const body = AutomationSchema.parse(req.body);
  const automation = await dataStore.createAutomation(req.params.boardId, body);
  if (!automation) return res.status(404).json({ error: 'board_not_found' });
  return res.status(201).json(automation);
});

automationsRouter.patch('/automations/:ruleId', async (req, res) => {
  const body = AutomationSchema.partial().parse(req.body);
  const automation = await dataStore.updateAutomation(req.params.ruleId, body);
  if (!automation) return res.status(404).json({ error: 'automation_not_found' });
  return res.json(automation);
});

automationsRouter.delete('/automations/:ruleId', async (req, res) => {
  return res.json(await dataStore.deleteAutomation(req.params.ruleId));
});

automationsRouter.post('/automations/:ruleId/test', async (req, res) => {
  const automation = await dataStore.updateAutomation(req.params.ruleId, {});
  if (!automation) return res.status(404).json({ error: 'automation_not_found' });
  return res.json({ ok: true, ruleId: req.params.ruleId, simulated: true });
});
