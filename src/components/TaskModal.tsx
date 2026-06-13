import { useState } from 'react';
import { X, MessageSquare, CheckSquare, Calendar, Tag, User, Flag, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../data/boards';
import { statusConfig, priorityConfig } from '../data/boards';
import { useCurrentUser, useUsers } from '../context/AppDataContext';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import { format, parseISO } from 'date-fns';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  const [localTask, setLocalTask] = useState<Task | null>(task);
  const [newComment, setNewComment] = useState('');
  const users = useUsers();
  const currentUser = useCurrentUser();

  if (!task || !localTask) return null;

  const handleStatusChange = (status: keyof typeof statusConfig) => {
    const updated = { ...localTask, status };
    setLocalTask(updated);
    onUpdate(updated);
  };

  const handlePriorityChange = (priority: keyof typeof priorityConfig) => {
    const updated = { ...localTask, priority };
    setLocalTask(updated);
    onUpdate(updated);
  };

  const toggleSubtask = (subtaskId: string) => {
    const updated = {
      ...localTask,
      subtasks: localTask.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    };
    setLocalTask(updated);
    onUpdate(updated);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const updated = {
      ...localTask,
      comments: [
        ...localTask.comments,
        {
          id: `c${Date.now()}`,
          userId: currentUser.id,
          text: newComment,
          date: format(new Date(), 'yyyy-MM-dd'),
        },
      ],
    };
    setLocalTask(updated);
    onUpdate(updated);
    setNewComment('');
  };

  const completedSubtasks = localTask.subtasks.filter((st) => st.completed).length;
  const subtaskProgress = localTask.subtasks.length > 0
    ? Math.round((completedSubtasks / localTask.subtasks.length) * 100)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <StatusBadge status={localTask.status} onChange={handleStatusChange} />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{localTask.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                {localTask.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Assignees</p>
                  <div className="flex items-center gap-1 mt-1">
                    {localTask.assignees.map((id) => (
                      <Avatar key={id} userId={id} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Priority</p>
                  <PriorityBadge priority={localTask.priority} onChange={handlePriorityChange} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Timeline</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {format(parseISO(localTask.startDate), 'MMM d')} - {format(parseISO(localTask.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Tags</p>
                  <p className="text-sm text-gray-700 mt-0.5">{localTask.tags.join(', ')}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlignLeft className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">
                {localTask.description}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Subtasks</h3>
                <span className="text-xs text-gray-400 ml-auto">
                  {completedSubtasks}/{localTask.subtasks.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
              <div className="space-y-2">
                {localTask.subtasks.map((subtask) => (
                  <label
                    key={subtask.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                    >
                      {subtask.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Comments</h3>
              </div>
              <div className="space-y-3 mb-4">
                {localTask.comments.map((comment) => {
                  const user = users.find((u) => u.id === comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar userId={comment.userId} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {user?.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(parseISO(comment.date), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Avatar userId={currentUser.id} size="sm" />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="Write a comment..."
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addComment}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
