import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, Board } from './data/boards';
import { boards as initialBoards } from './data/boards';
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

export default function App() {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<string | null>('b1');
  const [activeView, setActiveView] = useState('board');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);


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
    const newBoard: Board = {
      id: `b${Date.now()}`,
      name: 'New Board',
      icon: 'folder',
      color: '#00C875',
      tasks: []
    };
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
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
  }, [selectedTask]);

  const handleAddTask = useCallback(() => {
    if (!activeBoard) return;
    const newTask: Task = {
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
    setBoards((prev) =>
      prev.map((board) =>
        board.id === activeBoard.id
          ? { ...board, tasks: [...board.tasks, newTask] }
          : board
      )
    );
    setSelectedTask(newTask);
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

  return (
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
          hasUnread={true}
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
  );
}
