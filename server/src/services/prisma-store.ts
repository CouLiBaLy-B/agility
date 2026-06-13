import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient, type Prisma, type TaskPriority, type TaskStatus } from '@prisma/client';
import type { Board, Notification, Task } from '../../../src/data/boards';
import type { ApiUser, AutomationRuleDto, TagDto, UserPreferenceDto, Workspace } from './store';
import { prisma as defaultPrisma } from './prisma-client';
import { hashPassword, verifyPassword } from './passwords';

const taskInclude = {
  assignees: true,
  subtasks: { orderBy: { position: 'asc' as const } },
  comments: { orderBy: { createdAt: 'asc' as const } },
  tags: { include: { tag: true } },
};

const boardInclude = {
  tasks: {
    orderBy: { position: 'asc' as const },
    include: taskInclude,
  },
};

type PrismaTask = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function toDateString(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toApiUser(user: {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  color: string;
  email: string;
  memberships?: { role: string }[];
}): ApiUser {
  return {
    id: user.id,
    name: user.displayName,
    avatar: user.avatarUrl ?? '',
    initials: user.initials,
    color: user.color,
    email: user.email,
    role: (user.memberships?.[0]?.role ?? 'member') as ApiUser['role'],
  };
}

function toTask(task: NonNullable<PrismaTask>): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignees: task.assignees.map((assignee) => assignee.userId),
    dueDate: toDateString(task.dueDate),
    startDate: toDateString(task.startDate),
    tags: task.tags.map((tagLink) => tagLink.tag.name),
    description: task.description,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
    })),
    comments: task.comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      text: comment.text,
      date: toDateString(comment.createdAt),
    })),
  };
}

export class PrismaStore {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async getCurrentUser(userId = 'u1') {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { memberships: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return toApiUser(user);
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { memberships: true },
    });
    return user ? toApiUser(user) : undefined;
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { memberships: true },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return toApiUser(user);
  }

  async register(input: { name: string; email: string; password: string; workspaceName?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) return null;
    const [firstName = input.name, ...rest] = input.name.split(' ');
    const workspaceSlug = (input.workspaceName || `${input.name}'s Workspace`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        firstName,
        lastName: rest.join(' ') || firstName,
        displayName: input.name,
        initials: input.name
          .split(/[.\s_-]+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: '#579BFC',
        passwordHash: hashPassword(input.password),
        preferences: { create: { emailNotifications: true, pushNotifications: true, theme: 'system' } },
        memberships: {
          create: {
            role: 'admin',
            workspace: {
              create: {
                name: input.workspaceName || `${input.name}'s Workspace`,
                slug: `${workspaceSlug || 'workspace'}-${randomBytes(3).toString('hex')}`,
              },
            },
          },
        },
      },
      include: { memberships: true },
    });
    return toApiUser(user);
  }

  async createPasswordResetToken(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(resetToken), expiresAt },
    });
    return { resetToken, expiresAt: expiresAt.toISOString() };
  }

  async resetPassword(input: { token: string; password: string }) {
    const tokenHash = hashToken(input.token);
    const entry = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { memberships: true } } },
    });
    if (!entry || entry.usedAt || entry.expiresAt.getTime() < Date.now()) return null;
    const user = await this.prisma.user.update({
      where: { id: entry.userId },
      data: {
        passwordHash: hashPassword(input.password),
        resetTokens: { update: { where: { id: entry.id }, data: { usedAt: new Date() } } },
      },
      include: { memberships: true },
    });
    return toApiUser(user);
  }

  async updateCurrentUser(userId: string, input: Partial<Pick<ApiUser, 'email' | 'name'>>) {
    const displayName = input.name?.trim();
    const [firstName = '', ...rest] = displayName?.split(' ') ?? [];
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.email ? { email: input.email.toLowerCase() } : {}),
          ...(displayName
            ? {
                displayName,
                firstName,
                lastName: rest.join(' ') || firstName,
                initials: displayName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
              }
            : {}),
        },
        include: { memberships: true },
      });
      return toApiUser(user);
    } catch {
      return null;
    }
  }

  async listWorkspaces(userId?: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: userId ? { members: { some: { userId } } } : {},
      include: userId ? { members: { where: { userId } } } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return workspaces.map((workspace): Workspace => {
      const membership = (workspace as { members?: { role: Workspace['currentUserRole'] }[] }).members?.[0];
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        currentUserRole: (membership?.role ?? 'admin') as Workspace['currentUserRole'],
      };
    });
  }

  async getWorkspace(workspaceId: string, userId?: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, ...(userId ? { members: { some: { userId } } } : {}) },
      include: userId ? { members: { where: { userId } } } : undefined,
    });
    if (!workspace) return null;
    const membership = (workspace as { members?: { role: Workspace['currentUserRole'] }[] }).members?.[0];
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      currentUserRole: (membership?.role ?? 'admin') as Workspace['currentUserRole'],
    };
  }

  async getMembership(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { userId: true, workspaceId: true, role: true },
    });
  }

  async getBoardWorkspaceId(boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
    return board?.workspaceId ?? null;
  }

  async getTaskWorkspaceId(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { board: { select: { workspaceId: true } } },
    });
    return task?.board.workspaceId ?? null;
  }

  async getTagWorkspaceId(tagId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId }, select: { workspaceId: true } });
    return tag?.workspaceId ?? null;
  }

  async getAutomationWorkspaceId(ruleId: string) {
    const automation = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      select: { board: { select: { workspaceId: true } } },
    });
    return automation?.board.workspaceId ?? null;
  }

  async listMembers(workspaceId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((membership) => toApiUser({ ...membership.user, memberships: [membership] }));
  }

  async inviteMember(workspaceId: string, input: { email: string; name?: string; role?: ApiUser['role'] }) {
    const displayName = input.name?.trim() || input.email.split('@')[0];
    const [firstName = displayName, ...rest] = displayName.split(' ');
    const user = await this.prisma.user.upsert({
      where: { email: input.email.toLowerCase() },
      update: {},
      create: {
        email: input.email.toLowerCase(),
        firstName,
        lastName: rest.join(' ') || firstName,
        displayName,
        initials: displayName
          .split(/[.\s_-]+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: '#579BFC',
        preferences: { create: { emailNotifications: true, pushNotifications: true, theme: 'system' } },
      },
    });
    const membership = await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      update: { role: input.role ?? 'member' },
      create: { workspaceId, userId: user.id, role: input.role ?? 'member' },
      include: { user: true },
    });
    return toApiUser({ ...membership.user, memberships: [membership] });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: ApiUser['role']) {
    try {
      const membership = await this.prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role },
        include: { user: true },
      });
      return toApiUser({ ...membership.user, memberships: [membership] });
    } catch {
      return null;
    }
  }

  async removeMember(workspaceId: string, userId: string) {
    const result = await this.prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
    return { deleted: result.count > 0 };
  }

  async listBoards(workspaceId: string) {
    const boards = await this.prisma.board.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { position: 'asc' },
      include: boardInclude,
    });
    return boards.map((board): Board => ({
      id: board.id,
      name: board.name,
      icon: board.icon,
      color: board.color,
      tasks: board.tasks.map(toTask),
    }));
  }

  async getBoard(boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId }, include: boardInclude });
    if (!board) return null;
    return {
      id: board.id,
      name: board.name,
      icon: board.icon,
      color: board.color,
      tasks: board.tasks.map(toTask),
    };
  }

  async createBoard(workspaceId: string, input: Pick<Board, 'name'> & Partial<Pick<Board, 'icon' | 'color'>>) {
    const maxPosition = await this.prisma.board.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });
    const board = await this.prisma.board.create({
      data: {
        workspaceId,
        name: input.name,
        icon: input.icon ?? 'folder',
        color: input.color ?? '#00C875',
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: boardInclude,
    });
    return { id: board.id, name: board.name, icon: board.icon, color: board.color, tasks: [] } satisfies Board;
  }

  async updateBoard(boardId: string, input: Partial<Pick<Board, 'name' | 'icon' | 'color'>>) {
    try {
      const board = await this.prisma.board.update({ where: { id: boardId }, data: input, include: boardInclude });
      return { id: board.id, name: board.name, icon: board.icon, color: board.color, tasks: board.tasks.map(toTask) };
    } catch {
      return null;
    }
  }

  async listTags(workspaceId: string): Promise<TagDto[]> {
    return this.prisma.tag.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } });
  }

  async createTag(workspaceId: string, input: { name: string; color?: string }) {
    const tag = await this.prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId, name: input.name } },
      update: { color: input.color ?? undefined },
      create: { workspaceId, name: input.name, color: input.color ?? '#C4C4C4' },
    });
    return tag;
  }

  async updateTag(tagId: string, input: { name?: string; color?: string }) {
    try {
      return await this.prisma.tag.update({ where: { id: tagId }, data: input });
    } catch {
      return null;
    }
  }

  async deleteTag(tagId: string) {
    const result = await this.prisma.tag.deleteMany({ where: { id: tagId } });
    return { deleted: result.count > 0 };
  }

  async listTasks(boardId: string, filters: { q?: string; status?: Task['status']; priority?: Task['priority']; assigneeId?: string }) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) return null;
    const tasks = await this.prisma.task.findMany({
      where: {
        boardId,
        archivedAt: null,
        ...(filters.status ? { status: filters.status as TaskStatus } : {}),
        ...(filters.priority ? { priority: filters.priority as TaskPriority } : {}),
        ...(filters.assigneeId ? { assignees: { some: { userId: filters.assigneeId } } } : {}),
        ...(filters.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { tags: { some: { tag: { name: { contains: filters.q, mode: 'insensitive' } } } } },
              ],
            }
          : {}),
      },
      orderBy: { position: 'asc' },
      include: taskInclude,
    });
    return tasks.map(toTask);
  }

  private async getPrismaTask(taskId: string) {
    return this.prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
  }

  async getTask(taskId: string) {
    const task = await this.getPrismaTask(taskId);
    return task ? toTask(task) : null;
  }

  async createTask(boardId: string, input: Partial<Task> & Pick<Task, 'title'>) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return null;
    const maxPosition = await this.prisma.task.aggregate({ where: { boardId }, _max: { position: true } });
    const task = await this.prisma.task.create({
      data: {
        boardId,
        title: input.title,
        status: (input.status ?? 'not_started') as TaskStatus,
        priority: (input.priority ?? 'medium') as TaskPriority,
        description: input.description ?? '',
        startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : new Date(),
        dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : new Date(),
        position: (maxPosition._max.position ?? -1) + 1,
        assignees: { create: (input.assignees ?? ['u1']).map((userId) => ({ userId })) },
      },
      include: taskInclude,
    });
    return toTask(task);
  }

  async updateTask(taskId: string, input: Partial<Task>) {
    const existing = await this.prisma.task.findUnique({ where: { id: taskId }, include: { board: true } });
    if (!existing) return null;

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status as TaskStatus } : {}),
          ...(input.priority !== undefined ? { priority: input.priority as TaskPriority } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(`${input.startDate}T00:00:00.000Z`) } : {}),
          ...(input.dueDate !== undefined ? { dueDate: new Date(`${input.dueDate}T00:00:00.000Z`) } : {}),
        },
      });

      if (input.assignees) {
        await tx.taskAssignee.deleteMany({ where: { taskId } });
        await tx.taskAssignee.createMany({ data: input.assignees.map((userId) => ({ taskId, userId })), skipDuplicates: true });
      }

      if (input.subtasks) {
        await tx.subtask.deleteMany({ where: { taskId } });
        await tx.subtask.createMany({
          data: input.subtasks.map((subtask, index) => ({
            id: subtask.id,
            taskId,
            title: subtask.title,
            completed: subtask.completed,
            position: index,
          })),
          skipDuplicates: true,
        });
      }

      if (input.tags) {
        await tx.taskTag.deleteMany({ where: { taskId } });
        for (const tagName of input.tags) {
          const tag = await tx.tag.upsert({
            where: { workspaceId_name: { workspaceId: existing.board.workspaceId, name: tagName } },
            update: {},
            create: { workspaceId: existing.board.workspaceId, name: tagName },
          });
          await tx.taskTag.create({ data: { taskId, tagId: tag.id } });
        }
      }
    });

    const task = await this.getPrismaTask(taskId);
    return task ? toTask(task) : null;
  }

  async addComment(taskId: string, input: { userId: string; text: string }) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
    if (!task) return null;
    const comment = await this.prisma.comment.create({
      data: { taskId, userId: input.userId, text: input.text },
    });
    return { id: comment.id, userId: comment.userId, text: comment.text, date: toDateString(comment.createdAt) };
  }

  async toggleSubtask(taskId: string, subtaskId: string, completed: boolean) {
    try {
      const subtask = await this.prisma.subtask.update({
        where: { id: subtaskId, taskId },
        data: { completed },
      });
      return { id: subtask.id, title: subtask.title, completed: subtask.completed };
    } catch {
      return null;
    }
  }

  async listNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map((notification): Notification => ({
      id: notification.id,
      userId: notification.userId,
      taskId: notification.taskId ?? '',
      text: notification.text,
      type: notification.type,
      isRead: Boolean(notification.readAt),
      date: toDateString(notification.createdAt),
    }));
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markNotificationRead(notificationId: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
      return {
        id: notification.id,
        userId: notification.userId,
        taskId: notification.taskId ?? '',
        text: notification.text,
        type: notification.type,
        isRead: true,
        date: toDateString(notification.createdAt),
      } satisfies Notification;
    } catch {
      return null;
    }
  }

  async markAllNotificationsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async getPreferences(userId: string): Promise<UserPreferenceDto> {
    const preferences = await this.prisma.userPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return {
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      theme: preferences.theme as UserPreferenceDto['theme'],
    };
  }

  async updatePreferences(userId: string, input: Partial<UserPreferenceDto>) {
    const preferences = await this.prisma.userPreference.upsert({
      where: { userId },
      update: input,
      create: {
        userId,
        emailNotifications: input.emailNotifications ?? true,
        pushNotifications: input.pushNotifications ?? true,
        theme: input.theme ?? 'system',
      },
    });
    return {
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      theme: preferences.theme as UserPreferenceDto['theme'],
    };
  }

  async listAutomations(boardId: string): Promise<AutomationRuleDto[]> {
    return this.prisma.automationRule.findMany({ where: { boardId }, orderBy: { createdAt: 'asc' } });
  }

  async createAutomation(boardId: string, input: Omit<AutomationRuleDto, 'id' | 'boardId'>) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) return null;
    return this.prisma.automationRule.create({
      data: {
        boardId,
        name: input.name,
        active: input.active,
        trigger: input.trigger as Prisma.InputJsonValue,
        conditions: input.conditions as Prisma.InputJsonValue | undefined,
        actions: input.actions as Prisma.InputJsonValue,
      },
    });
  }

  async updateAutomation(ruleId: string, input: Partial<Omit<AutomationRuleDto, 'id' | 'boardId'>>) {
    try {
      return await this.prisma.automationRule.update({
        where: { id: ruleId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
          ...(input.trigger !== undefined ? { trigger: input.trigger as Prisma.InputJsonValue } : {}),
          ...(input.conditions !== undefined ? { conditions: input.conditions as Prisma.InputJsonValue } : {}),
          ...(input.actions !== undefined ? { actions: input.actions as Prisma.InputJsonValue } : {}),
        },
      });
    } catch {
      return null;
    }
  }

  async deleteAutomation(ruleId: string) {
    const result = await this.prisma.automationRule.deleteMany({ where: { id: ruleId } });
    return { deleted: result.count > 0 };
  }
}
