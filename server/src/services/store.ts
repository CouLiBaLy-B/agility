import { randomUUID } from 'node:crypto';
import { boards as seedBoards, users as seedUsers, notifications as seedNotifications } from '../../../src/data/boards';
import type { Board, Notification, Task, User } from '../../../src/data/boards';

type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ApiUser extends User {
  email: string;
  role: WorkspaceRole;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  currentUserRole: WorkspaceRole;
}

export interface UserPreferenceDto {
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toEmail(name: string) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
}

export class InMemoryStore {
  private readonly workspace: Workspace = {
    id: 'w1',
    name: 'WorkSpace',
    slug: 'workspace',
    currentUserRole: 'admin',
  };

  private users: ApiUser[] = seedUsers.map((user, index) => ({
    ...user,
    email: toEmail(user.name),
    role: index === 0 ? 'admin' : 'member',
  }));

  private boards: Board[] = clone(seedBoards);
  private notifications: Notification[] = clone(seedNotifications);
  private preferences: Record<string, UserPreferenceDto> = Object.fromEntries(
    this.users.map((user) => [
      user.id,
      { emailNotifications: true, pushNotifications: true, theme: 'system' as const },
    ]),
  );

  getCurrentUser(userId = 'u1') {
    return this.users.find((user) => user.id === userId) ?? this.users[0];
  }

  updateCurrentUser(userId: string, input: Partial<Pick<ApiUser, 'email' | 'name'>>) {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) return null;
    if (input.email) user.email = input.email;
    if (input.name) {
      user.name = input.name;
      user.initials = input.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return user;
  }

  findUserByEmail(email: string) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  listWorkspaces() {
    return [this.workspace];
  }

  getWorkspace(workspaceId: string) {
    return workspaceId === this.workspace.id ? this.workspace : null;
  }

  listMembers(workspaceId: string) {
    this.assertWorkspace(workspaceId);
    return this.users;
  }

  listBoards(workspaceId: string) {
    this.assertWorkspace(workspaceId);
    return this.boards;
  }

  getBoard(boardId: string) {
    return this.boards.find((board) => board.id === boardId) ?? null;
  }

  createBoard(workspaceId: string, input: Pick<Board, 'name'> & Partial<Pick<Board, 'icon' | 'color'>>) {
    this.assertWorkspace(workspaceId);
    const board: Board = {
      id: randomUUID(),
      name: input.name,
      icon: input.icon ?? 'folder',
      color: input.color ?? '#00C875',
      tasks: [],
    };
    this.boards.push(board);
    return board;
  }

  updateBoard(boardId: string, input: Partial<Pick<Board, 'name' | 'icon' | 'color'>>) {
    const board = this.getBoard(boardId);
    if (!board) return null;
    Object.assign(board, input);
    return board;
  }

  listTasks(boardId: string, filters: { q?: string; status?: Task['status']; priority?: Task['priority']; assigneeId?: string }) {
    const board = this.getBoard(boardId);
    if (!board) return null;
    const q = filters.q?.trim().toLowerCase();
    return board.tasks.filter((task) => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assigneeId && !task.assignees.includes(filters.assigneeId)) return false;
      if (q && !task.title.toLowerCase().includes(q) && !task.tags.some((tag) => tag.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  getTask(taskId: string) {
    for (const board of this.boards) {
      const task = board.tasks.find((candidate) => candidate.id === taskId);
      if (task) return task;
    }
    return null;
  }

  createTask(boardId: string, input: Partial<Task> & Pick<Task, 'title'>) {
    const board = this.getBoard(boardId);
    if (!board) return null;
    const today = new Date().toISOString().slice(0, 10);
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      status: input.status ?? 'not_started',
      priority: input.priority ?? 'medium',
      assignees: input.assignees ?? [this.getCurrentUser().id],
      dueDate: input.dueDate ?? today,
      startDate: input.startDate ?? today,
      tags: input.tags ?? [],
      description: input.description ?? '',
      subtasks: input.subtasks ?? [],
      comments: input.comments ?? [],
    };
    board.tasks.push(task);
    return task;
  }

  updateTask(taskId: string, input: Partial<Task>) {
    const task = this.getTask(taskId);
    if (!task) return null;
    Object.assign(task, input, { id: task.id });
    return task;
  }

  addComment(taskId: string, input: { userId: string; text: string }) {
    const task = this.getTask(taskId);
    if (!task) return null;
    const comment = {
      id: randomUUID(),
      userId: input.userId,
      text: input.text,
      date: new Date().toISOString().slice(0, 10),
    };
    task.comments.push(comment);
    return comment;
  }

  toggleSubtask(taskId: string, subtaskId: string, completed: boolean) {
    const task = this.getTask(taskId);
    if (!task) return null;
    const subtask = task.subtasks.find((candidate) => candidate.id === subtaskId);
    if (!subtask) return null;
    subtask.completed = completed;
    return subtask;
  }

  listNotifications(userId: string) {
    return this.notifications.filter((notification) => notification.userId === userId || userId === 'u1');
  }

  unreadCount(userId: string) {
    return this.listNotifications(userId).filter((notification) => !notification.isRead).length;
  }

  markNotificationRead(notificationId: string) {
    const notification = this.notifications.find((candidate) => candidate.id === notificationId);
    if (!notification) return null;
    notification.isRead = true;
    return notification;
  }

  markAllNotificationsRead(userId: string) {
    const notifications = this.listNotifications(userId);
    notifications.forEach((notification) => {
      notification.isRead = true;
    });
    return { updated: notifications.length };
  }

  getPreferences(userId: string) {
    return this.preferences[userId] ?? { emailNotifications: true, pushNotifications: true, theme: 'system' as const };
  }

  updatePreferences(userId: string, input: Partial<UserPreferenceDto>) {
    const current = this.getPreferences(userId);
    this.preferences[userId] = { ...current, ...input };
    return this.preferences[userId];
  }

  private assertWorkspace(workspaceId: string) {
    if (workspaceId !== this.workspace.id) {
      throw Object.assign(new Error('Workspace not found'), { status: 404 });
    }
  }
}

export const store = new InMemoryStore();
