import { randomBytes, randomUUID } from 'node:crypto';
import { boards as seedBoards, users as seedUsers, notifications as seedNotifications } from '../../../src/data/boards';
import type { Board, Notification, Task, User } from '../../../src/data/boards';
import { hashPassword, verifyPassword } from './passwords';

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

export interface TagDto {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface AuthResultDto {
  user: ApiUser;
  accessTokenUserId: string;
}

export interface PasswordResetDto {
  resetToken: string;
  expiresAt: string;
}

export interface AutomationRuleDto {
  id: string;
  boardId: string;
  name: string;
  active: boolean;
  trigger: unknown;
  conditions?: unknown;
  actions: unknown;
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
  private passwordHashes: Record<string, string> = Object.fromEntries(
    this.users.map((user) => [user.id, hashPassword('demo-password')]),
  );
  private resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

  private boards: Board[] = clone(seedBoards);
  private notifications: Notification[] = clone(seedNotifications);
  private tags: TagDto[] = Array.from(
    new Set(seedBoards.flatMap((board) => board.tasks.flatMap((task) => task.tags))),
  ).map((name) => ({ id: randomUUID(), workspaceId: this.workspace.id, name, color: '#C4C4C4' }));
  private automations: AutomationRuleDto[] = [
    {
      id: randomUUID(),
      boardId: 'b1',
      name: 'When status changes to Done, notify assignees',
      active: true,
      trigger: { event: 'task.status.changed', to: 'done' },
      actions: { type: 'notification.send', target: 'assignees' },
    },
    {
      id: randomUUID(),
      boardId: 'b1',
      name: 'When deadline is approaching, notify owner',
      active: true,
      trigger: { event: 'task.deadline.approaching', daysBefore: 1 },
      actions: { type: 'notification.send', target: 'assignees' },
    },
  ];
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

  validateCredentials(email: string, password: string) {
    const user = this.findUserByEmail(email);
    if (!user || !verifyPassword(password, this.passwordHashes[user.id])) return null;
    return user;
  }

  register(input: { name: string; email: string; password: string; workspaceName?: string }) {
    const existing = this.findUserByEmail(input.email);
    if (existing) return null;
    const user: ApiUser = {
      id: randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      avatar: '',
      initials: input.name
        .split(/[.\s_-]+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: '#579BFC',
      role: 'admin',
    };
    this.users.push(user);
    this.passwordHashes[user.id] = hashPassword(input.password);
    this.preferences[user.id] = { emailNotifications: true, pushNotifications: true, theme: 'system' };
    return user;
  }

  createPasswordResetToken(email: string) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    this.resetTokens.set(resetToken, { userId: user.id, expiresAt });
    return { resetToken, expiresAt: expiresAt.toISOString() };
  }

  resetPassword(input: { token: string; password: string }) {
    const entry = this.resetTokens.get(input.token);
    if (!entry || entry.expiresAt.getTime() < Date.now()) return null;
    const user = this.users.find((candidate) => candidate.id === entry.userId);
    if (!user) return null;
    this.passwordHashes[user.id] = hashPassword(input.password);
    this.resetTokens.delete(input.token);
    return user;
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

  inviteMember(workspaceId: string, input: { email: string; name?: string; role?: WorkspaceRole }) {
    this.assertWorkspace(workspaceId);
    const existing = this.findUserByEmail(input.email);
    if (existing) return existing;
    const name = input.name || input.email.split('@')[0];
    const user: ApiUser = {
      id: randomUUID(),
      name,
      email: input.email.toLowerCase(),
      avatar: '',
      initials: name
        .split(/[.\s_-]+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: '#579BFC',
      role: input.role ?? 'member',
    };
    this.users.push(user);
    this.passwordHashes[user.id] = hashPassword('demo-password');
    this.preferences[user.id] = { emailNotifications: true, pushNotifications: true, theme: 'system' };
    return user;
  }

  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    this.assertWorkspace(workspaceId);
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) return null;
    user.role = role;
    return user;
  }

  removeMember(workspaceId: string, userId: string) {
    this.assertWorkspace(workspaceId);
    const before = this.users.length;
    this.users = this.users.filter((user) => user.id !== userId);
    return { deleted: before !== this.users.length };
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

  listTags(workspaceId: string) {
    this.assertWorkspace(workspaceId);
    return this.tags.filter((tag) => tag.workspaceId === workspaceId);
  }

  createTag(workspaceId: string, input: { name: string; color?: string }) {
    this.assertWorkspace(workspaceId);
    const existing = this.tags.find(
      (tag) => tag.workspaceId === workspaceId && tag.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (existing) return existing;
    const tag = { id: randomUUID(), workspaceId, name: input.name, color: input.color ?? '#C4C4C4' };
    this.tags.push(tag);
    return tag;
  }

  updateTag(tagId: string, input: { name?: string; color?: string }) {
    const tag = this.tags.find((candidate) => candidate.id === tagId);
    if (!tag) return null;
    Object.assign(tag, input);
    return tag;
  }

  deleteTag(tagId: string) {
    const tag = this.tags.find((candidate) => candidate.id === tagId);
    if (!tag) return { deleted: false };
    this.tags = this.tags.filter((candidate) => candidate.id !== tagId);
    this.boards.forEach((board) => {
      board.tasks.forEach((task) => {
        task.tags = task.tags.filter((tagName) => tagName !== tag.name);
      });
    });
    return { deleted: true };
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

  listAutomations(boardId: string) {
    return this.automations.filter((automation) => automation.boardId === boardId);
  }

  createAutomation(boardId: string, input: Omit<AutomationRuleDto, 'id' | 'boardId'>) {
    if (!this.getBoard(boardId)) return null;
    const automation = { id: randomUUID(), boardId, ...input };
    this.automations.push(automation);
    return automation;
  }

  updateAutomation(ruleId: string, input: Partial<Omit<AutomationRuleDto, 'id' | 'boardId'>>) {
    const automation = this.automations.find((candidate) => candidate.id === ruleId);
    if (!automation) return null;
    Object.assign(automation, input);
    return automation;
  }

  deleteAutomation(ruleId: string) {
    const before = this.automations.length;
    this.automations = this.automations.filter((automation) => automation.id !== ruleId);
    return { deleted: before !== this.automations.length };
  }

  private assertWorkspace(workspaceId: string) {
    if (workspaceId !== this.workspace.id) {
      throw Object.assign(new Error('Workspace not found'), { status: 404 });
    }
  }
}

export const store = new InMemoryStore();
