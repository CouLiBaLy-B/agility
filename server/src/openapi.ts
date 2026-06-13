export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Agility API',
    version: '0.1.0',
    description: 'MVP REST API for Agility project management.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { security: [], responses: { '200': { description: 'API liveness' } } } },
    '/health/ready': { get: { security: [], responses: { '200': { description: 'API readiness' }, '503': { description: 'API not ready' } } } },
    '/auth/login': { post: { security: [], responses: { '200': { description: 'JWT session' } } } },
    '/auth/register': { post: { security: [], responses: { '201': { description: 'Created account and JWT session' } } } },
    '/auth/forgot-password': { post: { security: [], responses: { '200': { description: 'Password reset request accepted' } } } },
    '/auth/reset-password': { post: { security: [], responses: { '200': { description: 'Password reset and JWT session' } } } },
    '/auth/me': { get: { responses: { '200': { description: 'Current user and workspaces' } } } },
    '/workspaces': { get: { responses: { '200': { description: 'Accessible workspaces' } } } },
    '/workspaces/{workspaceId}': { get: { responses: { '200': { description: 'Workspace detail' } } } },
    '/workspaces/{workspaceId}/members': {
      get: { responses: { '200': { description: 'Workspace members' } } },
    },
    '/workspaces/{workspaceId}/invitations': { post: { responses: { '201': { description: 'Invited member' } } } },
    '/workspaces/{workspaceId}/members/{userId}': {
      patch: { responses: { '200': { description: 'Updated member role' } } },
      delete: { responses: { '200': { description: 'Removed member' } } },
    },
    '/workspaces/{workspaceId}/boards': {
      get: { responses: { '200': { description: 'Workspace boards with tasks' } } },
      post: { responses: { '201': { description: 'Created board' } } },
    },
    '/boards/{boardId}': {
      get: { responses: { '200': { description: 'Board detail' } } },
      patch: { responses: { '200': { description: 'Updated board' } } },
    },
    '/boards/{boardId}/tasks': {
      get: { responses: { '200': { description: 'Board tasks' } } },
      post: { responses: { '201': { description: 'Created task' } } },
    },
    '/tasks/{taskId}': {
      get: { responses: { '200': { description: 'Task detail' } } },
      patch: { responses: { '200': { description: 'Updated task' } } },
    },
    '/tasks/{taskId}/status': { patch: { responses: { '200': { description: 'Updated task status' } } } },
    '/tasks/{taskId}/priority': { patch: { responses: { '200': { description: 'Updated task priority' } } } },
    '/tasks/{taskId}/comments': { post: { responses: { '201': { description: 'Created comment' } } } },
    '/tasks/{taskId}/subtasks/{subtaskId}': { patch: { responses: { '200': { description: 'Updated subtask' } } } },
    '/notifications': { get: { responses: { '200': { description: 'User notifications' } } } },
    '/notifications/unread-count': { get: { responses: { '200': { description: 'Unread notifications count' } } } },
    '/notifications/read-all': { patch: { responses: { '200': { description: 'All notifications marked as read' } } } },
    '/notifications/{notificationId}/read': { patch: { responses: { '200': { description: 'Notification marked as read' } } } },
    '/workspaces/{workspaceId}/tags': {
      get: { responses: { '200': { description: 'Workspace tags' } } },
      post: { responses: { '201': { description: 'Created tag' } } },
    },
    '/tags/{tagId}': {
      patch: { responses: { '200': { description: 'Updated tag' } } },
      delete: { responses: { '200': { description: 'Deleted tag' } } },
    },
    '/boards/{boardId}/automations': {
      get: { responses: { '200': { description: 'Board automations' } } },
      post: { responses: { '201': { description: 'Created automation' } } },
    },
    '/automations/{ruleId}': {
      patch: { responses: { '200': { description: 'Updated automation' } } },
      delete: { responses: { '200': { description: 'Deleted automation' } } },
    },
    '/automations/{ruleId}/test': { post: { responses: { '200': { description: 'Automation test result' } } } },
    '/users/me': { patch: { responses: { '200': { description: 'Updated current user profile' } } } },
    '/users/me/preferences': {
      get: { responses: { '200': { description: 'Current user preferences' } } },
      patch: { responses: { '200': { description: 'Updated user preferences' } } },
    },
  },
};
