import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task, Board } from '../data/boards';
import { statusConfig } from '../data/boards';
import { AvatarGroup } from './Avatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfDay,
} from 'date-fns';

interface TimelineViewProps {
  board: Board;
  onTaskClick: (task: Task) => void;
  searchQuery: string;
}

export function TimelineView({ board, onTaskClick, searchQuery }: TimelineViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));

  const filteredTasks = board.tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTaskPosition = (task: Task) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.dueDate);
    const totalDays = days.length;

    const startIndex = Math.max(0, days.findIndex((d) => startOfDay(d) >= startOfDay(taskStart)));
    const endIndex = days.findIndex((d) => startOfDay(d) >= startOfDay(taskEnd));
    const effectiveEndIndex = endIndex === -1 ? totalDays - 1 : endIndex;

    const left = (startIndex / totalDays) * 100;
    const width = ((effectiveEndIndex - startIndex + 1) / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(2026, 3, 1))}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-64 shrink-0 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Task
              </div>
              <div className="flex-1 flex">
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`flex-1 text-center py-2 text-xs border-r border-gray-100 last:border-r-0 ${
                      isWeekend(day) ? 'bg-gray-100/50' : ''
                    }`}
                  >
                    <div className="text-gray-400">{format(day, 'EEE')}</div>
                    <div
                      className={`font-semibold mt-0.5 ${
                        isToday(day) ? 'text-blue-500' : 'text-gray-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex hover:bg-gray-50/50 transition-colors"
                >
                  <div
                    className="w-64 shrink-0 px-4 py-3 border-r border-gray-200 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <AvatarGroup userIds={task.assignees} max={2} size="sm" />
                    </div>
                  </div>
                  <div className="flex-1 relative py-2 px-1">
                    <div
                      className="absolute h-7 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2"
                      style={{
                        ...getTaskPosition(task),
                        backgroundColor: statusConfig[task.status].color + '30',
                        borderLeft: `3px solid ${statusConfig[task.status].color}`,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <span className="text-xs font-medium truncate" style={{ color: statusConfig[task.status].color }}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
