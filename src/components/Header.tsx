import { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  Filter,
  Share2,
  MoreHorizontal,
  Table2,
  KanbanSquare,
  CalendarDays,
  Plus,
  Zap,
} from 'lucide-react';
import type { Board } from '../data/boards';

interface HeaderProps {
  board: Board | null;
  activeView: string;
  onViewChange: (view: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTask: () => void;
  onInboxToggle: () => void;
  hasUnread: boolean;
}

const views = [
  { id: 'board', label: 'Main Table', icon: Table2 },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'automations', label: 'Automations', icon: Zap },
];

export function Header({
  board,
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onAddTask,
  onInboxToggle,
  hasUnread,
}: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {board && (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: board.color }}
              >
                <span className="text-sm font-bold">
                  {board.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{board.name}</h1>
                <p className="text-xs text-gray-400">
                  {board.tasks.length} tasks
                </p>
              </div>
            </>
          )}
          {!board && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-400">Overview of all projects</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              isSearchFocused
                ? 'border-blue-400 ring-2 ring-blue-100 bg-white'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search tasks..."
              className="bg-transparent text-sm outline-none w-48 placeholder:text-gray-400"
            />
          </div>
          <button 
            onClick={onInboxToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {board && (
        <div className="px-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
