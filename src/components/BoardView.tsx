import { useState } from 'react';
import { GripVertical, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task, Board } from '../data/boards';
// users import removed
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { AvatarGroup } from './Avatar';
import { format, parseISO, isPast, isToday } from 'date-fns';

interface BoardViewProps {
  board: Board;
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  searchQuery: string;
}

export function BoardView({ board, onTaskClick, onUpdateTask, searchQuery }: BoardViewProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filteredTasks = board.tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStatusChange = (task: Task, status: Task['status']) => {
    onUpdateTask({ ...task, status });
  };

  const handlePriorityChange = (task: Task, priority: Task['priority']) => {
    onUpdateTask({ ...task, priority });
  };

  const getDueDateStyle = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isToday(date)) return 'text-orange-500 font-medium';
    if (isPast(date) && !isToday(date)) return 'text-red-500 font-medium';
    return 'text-gray-600';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-8"></th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 min-w-[280px]">
              Task
            </th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[140px]">
              Status
            </th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[100px]">
              Priority
            </th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[140px]">
              Assignees
            </th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[140px]">
              Due Date
            </th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[180px]">
              Tags
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task, index) => (
            <motion.tr
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`border-b border-gray-100 group cursor-pointer transition-colors ${
                hoveredRow === task.id ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
              }`}
              onMouseEnter={() => setHoveredRow(task.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onTaskClick(task)}
            >
              <td className="px-4 py-3">
                <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{task.title}</span>
                  {task.subtasks.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <StatusBadge
                  status={task.status}
                  onChange={(status) => handleStatusChange(task, status)}
                />
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <PriorityBadge
                  priority={task.priority}
                  onChange={(priority) => handlePriorityChange(task, priority)}
                />
              </td>
              <td className="px-4 py-3">
                <AvatarGroup userIds={task.assignees} max={3} size="sm" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className={`text-xs ${getDueDateStyle(task.dueDate)}`}>
                    {format(parseISO(task.dueDate), 'MMM d')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No tasks found matching your search.</p>
        </div>
      )}
    </div>
  );
}
