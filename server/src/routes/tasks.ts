import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';
import { requireTaskRole } from '../middleware/rbac';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['done', 'working', 'stuck', 'not_started']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  subtasks: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() })).optional(),
  comments: z
    .array(z.object({ id: z.string(), userId: z.string(), text: z.string(), date: z.string() }))
    .optional(),
});

tasksRouter.get('/:taskId', requireTaskRole('viewer'), async (req, res) => {
  const task = await dataStore.getTask(String(req.params.taskId));
  if (!task) return res.status(404).json({ error: 'task_not_found' });
  return res.json(task);
});

tasksRouter.patch('/:taskId', requireTaskRole('member'), async (req, res) => {
  const body = UpdateTaskSchema.parse(req.body);
  const task = await dataStore.updateTask(String(req.params.taskId), body);
  if (!task) return res.status(404).json({ error: 'task_not_found' });
  return res.json(task);
});

tasksRouter.patch('/:taskId/status', requireTaskRole('member'), async (req, res) => {
  const body = z.object({ status: z.enum(['done', 'working', 'stuck', 'not_started']) }).parse(req.body);
  const task = await dataStore.updateTask(String(req.params.taskId), body);
  if (!task) return res.status(404).json({ error: 'task_not_found' });
  return res.json(task);
});

tasksRouter.patch('/:taskId/priority', requireTaskRole('member'), async (req, res) => {
  const body = z.object({ priority: z.enum(['high', 'medium', 'low']) }).parse(req.body);
  const task = await dataStore.updateTask(String(req.params.taskId), body);
  if (!task) return res.status(404).json({ error: 'task_not_found' });
  return res.json(task);
});

tasksRouter.post('/:taskId/comments', requireTaskRole('member'), async (req, res) => {
  const body = z.object({ text: z.string().min(1).max(5000) }).parse(req.body);
  const comment = await dataStore.addComment(String(req.params.taskId), { userId: req.user!.id, text: body.text });
  if (!comment) return res.status(404).json({ error: 'task_not_found' });
  return res.status(201).json(comment);
});

tasksRouter.patch('/:taskId/subtasks/:subtaskId', requireTaskRole('member'), async (req, res) => {
  const body = z.object({ completed: z.boolean() }).parse(req.body);
  const subtask = await dataStore.toggleSubtask(String(req.params.taskId), String(req.params.subtaskId), body.completed);
  if (!subtask) return res.status(404).json({ error: 'subtask_not_found' });
  return res.json(subtask);
});
