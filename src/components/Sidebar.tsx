import { useState } from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Table2,
  ChevronDown,
  ChevronRight,
  Star,
  Plus,
  Rocket,
  Code,
  Palette,
  FolderOpen,
  Users,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Board } from '../data/boards';

interface SidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  activeView: string;
  onBoardSelect: (boardId: string) => void;
  onViewSelect: (view: string) => void;
  onDashboardSelect: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddBoard: () => void;
}

const boardIcons: Record<string, React.ReactNode> = {
  rocket: <Rocket className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  palette: <Palette className="w-4 h-4" />,
};

export function Sidebar({
  boards,
  activeBoardId,
  activeView,
  onBoardSelect,
  onViewSelect,
  onDashboardSelect,
  collapsed,
  onToggleCollapse,
  onAddBoard,
}: SidebarProps) {
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set(['b1']));
  const [, setHoveredItem] = useState<string | null>(null);

  const toggleBoard = (boardId: string) => {
    setExpandedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) {
        next.delete(boardId);
      } else {
        next.add(boardId);
      }
      return next;
    });
  };

  const views = [
    { id: 'board', label: 'Main Table', icon: Table2 },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
    { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  ];

  if (collapsed) {
    return (
      <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg mb-6"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={onDashboardSelect}
          className={`w-10 h-10 flex items-center justify-center rounded-lg mb-2 transition-colors ${
            activeBoardId === null ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onBoardSelect(board.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg mb-1 transition-colors ${
              activeBoardId === board.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={board.name}
          >
            {boardIcons[board.icon] || <FolderOpen className="w-4 h-4" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">WorkSpace</p>
            <p className="text-xs text-gray-400">Product Team</p>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-90" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-1">
          <button
            onClick={onDashboardSelect}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeBoardId === null
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        <div className="px-3 mt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Favorites
            </span>
          </div>
          <button
            onClick={() => onBoardSelect('b1')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeBoardId === 'b1'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star className="w-4 h-4 text-yellow-400" />
            Product Launch Q2
          </button>
        </div>

        <div className="px-3 mt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Boards
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddBoard();
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          {boards.map((board) => (
            <div key={board.id}>
              <button
                onClick={() => {
                  onBoardSelect(board.id);
                  toggleBoard(board.id);
                }}
                onMouseEnter={() => setHoveredItem(board.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeBoardId === board.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span style={{ color: board.color }}>
                  {boardIcons[board.icon] || <FolderOpen className="w-4 h-4" />}
                </span>
                <span className="flex-1 text-left truncate">{board.name}</span>
                <motion.div
                  animate={{ rotate: expandedBoards.has(board.id) ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedBoards.has(board.id) && activeBoardId === board.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {views.map((view) => (
                      <button
                        key={view.id}
                        onClick={() => onViewSelect(view.id)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 pl-10 text-sm transition-colors ${
                          activeView === view.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <view.icon className="w-3.5 h-3.5" />
                        {view.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-100">
        <nav className="space-y-1">
          <button
            onClick={() => onViewSelect('people')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'people'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            People
          </button>
          <button
            onClick={() => onViewSelect('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'settings'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-xs font-semibold">
            SC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">Sarah Chen</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
