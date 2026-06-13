import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task, Board } from '../data/boards';
import { statusConfig } from '../data/boards';
import { AvatarGroup } from './Avatar';
import { Calendar, MessageSquare, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface KanbanViewProps {
  board: Board;
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  searchQuery: string;
}

const columns: (keyof typeof statusConfig)[] = ['not_started', 'working', 'stuck', 'done'];

export function KanbanView({ board, onTaskClick, onUpdateTask, searchQuery }: KanbanViewProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const filteredTasks = board.tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = board.tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) {
      onUpdateTask({ ...task, status });
    }
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const tasks = filteredTasks.filter((t) => t.status === column);
        const config = statusConfig[column];

        return (
          <div
            key={column}
            className={`min-w-[280px] flex-1 rounded-xl transition-colors ${
              dragOverColumn === column ? 'bg-blue-50/50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-sm font-semibold text-gray-700">{config.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                  onClick={() => onTaskClick(task)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <h4 className="text-sm font-medium text-gray-800 mb-2">{task.title}</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <AvatarGroup userIds={task.assignees} max={2} size="sm" />
                    <div className="flex items-center gap-2 text-gray-400">
                      {task.subtasks.length > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <CheckSquare className="w-3 h-3" />
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </span>
                      )}
                      {task.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments.length}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(task.dueDate), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
