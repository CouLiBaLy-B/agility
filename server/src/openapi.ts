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
    '/health': { get: { security: [], responses: { '200': { description: 'API health' } } } },
    '/auth/login': { post: { security: [], responses: { '200': { description: 'JWT session' } } } },
    '/auth/me': { get: { responses: { '200': { description: 'Current user and workspaces' } } } },
    '/workspaces': { get: { responses: { '200': { description: 'Accessible workspaces' } } } },
    '/workspaces/{workspaceId}': { get: { responses: { '200': { description: 'Workspace detail' } } } },
    '/workspaces/{workspaceId}/members': { get: { responses: { '200': { description: 'Workspace members' } } } },
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
    '/users/me': { patch: { responses: { '200': { description: 'Updated current user profile' } } } },
    '/users/me/preferences': {
      get: { responses: { '200': { description: 'Current user preferences' } } },
      patch: { responses: { '200': { description: 'Updated user preferences' } } },
    },
  },
};
