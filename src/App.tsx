import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, Board } from './data/boards';
import { boards as initialBoards, users as initialUsers } from './data/boards';
import { isApiEnabled } from './api/client';
import { getMe, login } from './api/auth';
import type { WorkspaceSummary } from './api/auth';
import { createBoard as createBoardApi, createTask as createTaskApi, listBoards, updateTask as updateTaskApi } from './api/boards';
import { unreadCount } from './api/notifications';
import { listWorkspaceMembers } from './api/workspaces';
import { AppDataProvider, type AppUser } from './context/AppDataContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardView } from './components/BoardView';
import { KanbanView } from './components/KanbanView';
import { TimelineView } from './components/TimelineView';
import { Dashboard } from './components/Dashboard';
import { TaskModal } from './components/TaskModal';
import { Inbox } from './components/Inbox';
import { Automations } from './components/Automations';
import { People } from './components/People';
import { Settings } from './components/Settings';
import { LoginScreen } from './components/LoginScreen';

const DEFAULT_WORKSPACE: WorkspaceSummary = {
  id: 'w1',
  name: 'WorkSpace',
  slug: 'workspace',
  currentUserRole: 'admin',
};

export default function App() {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<string | null>('b1');
  const [activeView, setActiveView] = useState('board');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [users, setUsers] = useState<AppUser[]>(
    initialUsers.map((user, index) => ({
      ...user,
      email: `${user.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      role: index === 0 ? 'admin' : 'member',
    })),
  );
  const [currentUser, setCurrentUser] = useState<AppUser>(() => ({
    ...initialUsers[0],
    email: `${initialUsers[0].name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    role: 'admin',
  }));
  const [workspace, setWorkspace] = useState<WorkspaceSummary>(DEFAULT_WORKSPACE);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>(
    () => (isApiEnabled() ? 'checking' : 'authenticated'),
  );
  const [authError, setAuthError] = useState<string | null>(null);

  const loadRemoteData = useCallback(async () => {
    const session = await getMe();
    const selectedWorkspace = session.workspaces[0] ?? DEFAULT_WORKSPACE;
    const [remoteBoards, unread, remoteMembers] = await Promise.all([
      listBoards(selectedWorkspace.id),
      unreadCount(),
      listWorkspaceMembers(selectedWorkspace.id),
    ]);
    setCurrentUser(session.user);
    setWorkspace(selectedWorkspace);
    setUsers(remoteMembers);
    setBoards(remoteBoards);
    setActiveBoardId(remoteBoards[0]?.id ?? null);
    setHasUnread(unread.count > 0);
  }, []);

  useEffect(() => {
    if (!isApiEnabled()) return;

    if (!localStorage.getItem('agility.accessToken')) {
      setAuthStatus('unauthenticated');
      return;
    }

    let cancelled = false;
    async function bootstrap() {
      try {
        await loadRemoteData();
        if (!cancelled) setAuthStatus('authenticated');
      } catch (error) {
        console.warn('Existing API session is not valid.', error);
        localStorage.removeItem('agility.accessToken');
        if (!cancelled) setAuthStatus('unauthenticated');
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadRemoteData]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthStatus('checking');
      setAuthError(null);
      try {
        await login(email, password);
        await loadRemoteData();
        setAuthStatus('authenticated');
      } catch (error) {
        console.warn('Login failed.', error);
        localStorage.removeItem('agility.accessToken');
        setAuthError('Unable to sign in. Check the API status and your credentials.');
        setAuthStatus('unauthenticated');
      }
    },
    [loadRemoteData],
  );

  const activeBoard = activeBoardId
    ? boards.find((b) => b.id === activeBoardId) || null
    : null;

  const handleBoardSelect = useCallback((boardId: string) => {
    setActiveBoardId(boardId);
    setActiveView('board');
  }, []);

  const handleViewSelect = useCallback((view: string) => {
    setActiveView(view);
  }, []);

  const handleDashboardSelect = useCallback(() => {
    setActiveBoardId(null);
  }, []);

  const handleCreateBoard = useCallback(() => {
    const fallbackBoard: Board = {
      id: `b${Date.now()}`,
      name: 'New Board',
      icon: 'folder',
      color: '#00C875',
      tasks: [],
    };

    async function createBoard() {
      const newBoard = isApiEnabled()
        ? await createBoardApi({ name: fallbackBoard.name, icon: fallbackBoard.icon, color: fallbackBoard.color })
        : fallbackBoard;
      setBoards((prev) => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
    }

    void createBoard().catch((error) => {
      console.warn('Board creation failed on API, using local fallback.', error);
      setBoards((prev) => [...prev, fallbackBoard]);
      setActiveBoardId(fallbackBoard.id);
    });
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        tasks: board.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
      }))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }

    if (isApiEnabled()) {
      void updateTaskApi(updatedTask).catch((error) => {
        console.warn('Task update failed on API; optimistic UI kept.', error);
      });
    }
  }, [selectedTask]);

  const handleAddTask = useCallback(() => {
    if (!activeBoard) return;
    const fallbackTask: Task = {
      id: `t${Date.now()}`,
      title: 'New Task',
      status: 'not_started',
      priority: 'medium',
      assignees: ['u1'],
      dueDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      tags: [],
      description: '',
      subtasks: [],
      comments: [],
    };

    async function addTask() {
      const newTask = isApiEnabled() ? await createTaskApi(activeBoard!.id, fallbackTask) : fallbackTask;
      setBoards((prev) =>
        prev.map((board) =>
          board.id === activeBoard!.id
            ? { ...board, tasks: [...board.tasks, newTask] }
            : board
        )
      );
      setSelectedTask(newTask);
    }

    void addTask().catch((error) => {
      console.warn('Task creation failed on API, using local fallback.', error);
      setBoards((prev) =>
        prev.map((board) =>
          board.id === activeBoard.id
            ? { ...board, tasks: [...board.tasks, fallbackTask] }
            : board
        )
      );
      setSelectedTask(fallbackTask);
    });
  }, [activeBoard]);

  const renderContent = () => {
    // Global views that don't require a board
    switch (activeView) {
      case 'dashboard':
        return <Dashboard boards={boards} />;
      case 'people':
        return <People boards={boards} />;
      case 'settings':
        return <Settings />;
      case 'automations':
        return activeBoard ? <Automations /> : <Dashboard boards={boards} />;
    }

    if (!activeBoard) {
      return <Dashboard boards={boards} />;
    }

    switch (activeView) {
      case 'board':
        return (
          <BoardView
            board={activeBoard}
            onTaskClick={setSelectedTask}
            onUpdateTask={handleUpdateTask}
            searchQuery={searchQuery}
          />
        );
      case 'kanban':
        return (
          <KanbanView
            board={activeBoard}
            onTaskClick={setSelectedTask}
            onUpdateTask={handleUpdateTask}
            searchQuery={searchQuery}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            board={activeBoard}
            onTaskClick={setSelectedTask}
            searchQuery={searchQuery}
          />
        );
      default:
        return (
          <BoardView
            board={activeBoard}
            onTaskClick={setSelectedTask}
            onUpdateTask={handleUpdateTask}
            searchQuery={searchQuery}
          />
        );
    }
  };

  const findTaskAndOpen = (taskId: string) => {
    const task = boards.flatMap(b => b.tasks).find(t => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  if (isApiEnabled() && authStatus !== 'authenticated') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoading={authStatus === 'checking'}
        error={authError}
      />
    );
  }

  return (
    <AppDataProvider value={{ users, currentUser, setCurrentUser, workspace }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        boards={boards}
        activeBoardId={activeBoardId}
        activeView={activeView}
        onBoardSelect={handleBoardSelect}
        onViewSelect={handleViewSelect}
        onDashboardSelect={handleDashboardSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAddBoard={handleCreateBoard}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          board={activeBoard}
          activeView={activeView}
          onViewChange={handleViewSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddTask={handleAddTask}
          onInboxToggle={() => setIsInboxOpen(!isInboxOpen)}
          hasUnread={hasUnread}
        />

        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeBoardId}-${activeView}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Inbox 
        isOpen={isInboxOpen} 
        onClose={() => setIsInboxOpen(false)} 
        onTaskClick={findTaskAndOpen}
      />

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
      </div>
    </AppDataProvider>
  );
}
