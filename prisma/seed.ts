import { PrismaClient, type TaskPriority, type TaskStatus, type WorkspaceRole, type NotificationType } from '@prisma/client';
import { boards, notifications, users } from '../src/data/boards';
import { hashPassword } from '../server/src/services/passwords';

const prisma = new PrismaClient();
const WORKSPACE_ID = 'w1';

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
}

function splitName(name: string) {
  const [firstName, ...rest] = name.split(' ');
  return { firstName, lastName: rest.join(' ') || firstName };
}

function asDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.board.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  await prisma.workspace.create({
    data: {
      id: WORKSPACE_ID,
      name: 'WorkSpace',
      slug: 'workspace',
    },
  });

  for (const [index, user] of users.entries()) {
    const { firstName, lastName } = splitName(user.name);
    const role: WorkspaceRole = index === 0 ? 'admin' : 'member';
    await prisma.user.create({
      data: {
        id: user.id,
        email: emailFor(user.name),
        firstName,
        lastName,
        displayName: user.name,
        avatarUrl: user.avatar || null,
        initials: user.initials,
        color: user.color,
        passwordHash: hashPassword('demo-password'),
        memberships: {
          create: {
            workspaceId: WORKSPACE_ID,
            role,
          },
        },
        preferences: {
          create: {
            emailNotifications: true,
            pushNotifications: true,
            theme: 'system',
          },
        },
      },
    });
  }

  const tagIds = new Map<string, string>();
  for (const board of boards) {
    for (const task of board.tasks) {
      for (const tagName of task.tags) {
        if (!tagIds.has(tagName)) {
          const tag = await prisma.tag.create({
            data: {
              workspaceId: WORKSPACE_ID,
              name: tagName,
            },
          });
          tagIds.set(tagName, tag.id);
        }
      }
    }
  }

  for (const [boardIndex, board] of boards.entries()) {
    await prisma.board.create({
      data: {
        id: board.id,
        workspaceId: WORKSPACE_ID,
        name: board.name,
        icon: board.icon,
        color: board.color,
        position: boardIndex,
      },
    });

    for (const [taskIndex, task] of board.tasks.entries()) {
      await prisma.task.create({
        data: {
          id: task.id,
          boardId: board.id,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          startDate: asDate(task.startDate),
          dueDate: asDate(task.dueDate),
          position: taskIndex,
          assignees: {
            create: task.assignees.map((userId) => ({ userId })),
          },
          subtasks: {
            create: task.subtasks.map((subtask, subtaskIndex) => ({
              id: subtask.id,
              title: subtask.title,
              completed: subtask.completed,
              position: subtaskIndex,
            })),
          },
          comments: {
            create: task.comments.map((comment) => ({
              id: comment.id,
              userId: comment.userId,
              text: comment.text,
              createdAt: asDate(comment.date),
            })),
          },
          tags: {
            create: task.tags.map((tagName) => ({
              tagId: tagIds.get(tagName)!,
            })),
          },
        },
      });
    }
  }

  for (const notification of notifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        taskId: notification.taskId,
        text: notification.text,
        type: notification.type as NotificationType,
        readAt: notification.isRead ? asDate(notification.date) : null,
        createdAt: asDate(notification.date),
      },
    });
  }

  await prisma.automationRule.createMany({
    data: [
      {
        boardId: 'b1',
        name: 'When status changes to Done, notify assignees',
        active: true,
        trigger: { event: 'task.status.changed', to: 'done' },
        actions: { type: 'notification.send', target: 'assignees' },
      },
      {
        boardId: 'b1',
        name: 'When deadline is approaching, notify owner',
        active: true,
        trigger: { event: 'task.deadline.approaching', daysBefore: 1 },
        actions: { type: 'notification.send', target: 'assignees' },
      },
    ],
  });

  console.log('Database seeded with demo workspace, users, boards, tasks and notifications.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
