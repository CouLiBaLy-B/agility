import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Board } from '../data/boards';
import { statusConfig, priorityConfig } from '../data/boards';
import { useUsers } from '../context/AppDataContext';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  TrendingUp,
  Users,
  BarChart3,
  Target,
} from 'lucide-react';

interface DashboardProps {
  boards: Board[];
}

export function Dashboard({ boards }: DashboardProps) {
  const users = useUsers();
  const allTasks = boards.flatMap((b) => b.tasks);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === 'done').length;
    const working = allTasks.filter((t) => t.status === 'working').length;
    const stuck = allTasks.filter((t) => t.status === 'stuck').length;
    const notStarted = allTasks.filter((t) => t.status === 'not_started').length;
    const highPriority = allTasks.filter((t) => t.priority === 'high').length;

    return { total, done, working, stuck, notStarted, highPriority };
  }, [allTasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const userWorkload = useMemo(() => {
    const workload: Record<string, number> = {};
    allTasks.forEach((task) => {
      task.assignees.forEach((userId) => {
        workload[userId] = (workload[userId] || 0) + 1;
      });
    });
    return Object.entries(workload)
      .map(([userId, count]) => ({
        user: users.find((u) => u.id === userId)!,
        count,
      }))
      .filter((item) => Boolean(item.user))
      .sort((a, b) => b.count - a.count);
  }, [allTasks, users]);

  const statusData = [
    { label: 'Done', count: stats.done, color: statusConfig.done.color, icon: CheckCircle2 },
    { label: 'Working', count: stats.working, color: statusConfig.working.color, icon: Clock },
    { label: 'Stuck', count: stats.stuck, color: statusConfig.stuck.color, icon: AlertTriangle },
    { label: 'Not Started', count: stats.notStarted, color: statusConfig.not_started.color, icon: Circle },
  ];

  const priorityData = [
    { label: 'High', count: allTasks.filter((t) => t.priority === 'high').length, color: priorityConfig.high.color },
    { label: 'Medium', count: allTasks.filter((t) => t.priority === 'medium').length, color: priorityConfig.medium.color },
    { label: 'Low', count: allTasks.filter((t) => t.priority === 'low').length, color: priorityConfig.low.color },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{item.count}</p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.color + '15' }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Task Overview</h3>
          </div>
          <div className="space-y-4">
            {statusData.map((item) => {
              const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {item.count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Completion Rate</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#00C875"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 264' }}
                  animate={{ strokeDasharray: `${(completionRate / 100) * 264} 264` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{completionRate}%</span>
                <span className="text-xs text-gray-400 mt-0.5">Completed</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{stats.done}</span> of{' '}
                <span className="font-semibold text-gray-800">{stats.total}</span> tasks completed
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Priority Distribution</h3>
          </div>
          <div className="space-y-3">
            {priorityData.map((item) => {
              const total = priorityData.reduce((sum, p) => sum + p.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600">{item.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full flex items-center justify-end px-2"
                      style={{ backgroundColor: item.color + '25' }}
                    >
                      <span className="text-xs font-medium" style={{ color: item.color }}>
                        {item.count}
                      </span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Team Workload</h3>
          </div>
          <div className="space-y-3">
            {userWorkload.map((item) => {
              const maxCount = Math.max(...userWorkload.map((u) => u.count));
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.user.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ backgroundColor: item.user.color }}
                  >
                    {item.user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {item.user.name}
                      </span>
                      <span className="text-xs text-gray-400">{item.count} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full"
                        style={{ backgroundColor: item.user.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
