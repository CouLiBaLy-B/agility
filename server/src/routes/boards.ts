import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const boardsRouter = Router();
boardsRouter.use(requireAuth);

boardsRouter.get('/:boardId', async (req, res) => {
  const board = await dataStore.getBoard(req.params.boardId);
  if (!board) return res.status(404).json({ error: 'board_not_found' });
  return res.json(board);
});

boardsRouter.patch('/:boardId', async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).max(120).optional(),
      icon: z.string().min(1).max(40).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    })
    .parse(req.body);
  const board = await dataStore.updateBoard(req.params.boardId, body);
  if (!board) return res.status(404).json({ error: 'board_not_found' });
  return res.json(board);
});

boardsRouter.get('/:boardId/tasks', async (req, res) => {
  const tasks = await dataStore.listTasks(req.params.boardId, {
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as never) : undefined,
    priority: typeof req.query.priority === 'string' ? (req.query.priority as never) : undefined,
    assigneeId: typeof req.query.assigneeId === 'string' ? req.query.assigneeId : undefined,
  });
  if (!tasks) return res.status(404).json({ error: 'board_not_found' });
  return res.json(tasks);
});

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['done', 'working', 'stuck', 'not_started']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

boardsRouter.post('/:boardId/tasks', async (req, res) => {
  const body = TaskSchema.parse(req.body);
  const task = await dataStore.createTask(req.params.boardId, { ...body, subtasks: [], comments: [] });
  if (!task) return res.status(404).json({ error: 'board_not_found' });
  return res.status(201).json(task);
});
