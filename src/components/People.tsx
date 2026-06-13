import { useMemo } from 'react';
import type { Board } from '../data/boards';
import { users } from '../data/boards';

interface PeopleProps {
  boards: Board[];
}

export function People({ boards }: PeopleProps) {
  const userStats = useMemo(() => {
    const stats: Record<string, { assigned: number; completed: number; overdue: number; upcoming: number }> = {};
    
    users.forEach((u) => {
      stats[u.id] = { assigned: 0, completed: 0, overdue: 0, upcoming: 0 };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    boards.forEach((board) => {
      board.tasks.forEach((task) => {
        if (task.assignees.some((id) => stats[id])) {
          task.assignees.forEach((userId) => {
            if (stats[userId]) {
              stats[userId].assigned++;
              if (task.status === 'done') {
                stats[userId].completed++;
              }
              const dueDate = new Date(task.dueDate);
              dueDate.setHours(0, 0, 0, 0);
              if (dueDate < today && task.status !== 'done') {
                stats[userId].overdue++;
              } else if (dueDate >= today && task.status !== 'done') {
                stats[userId].upcoming++;
              }
            }
          });
        }
      });
    });

    return users.map((user) => ({
      ...user,
      ...stats[user.id],
    }));
  }, [boards]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Team</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your team members and their workload</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userStats.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: user.color }}
              >
                {user.initials}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-400">{user.name.toLowerCase()}@company.com</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Assigned</span>
                <span className="font-semibold text-gray-700">{user.assigned} tasks</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-semibold text-green-600">{user.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Overdue</span>
                <span className="font-semibold text-red-600">{user.overdue}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Upcoming</span>
                <span className="font-semibold text-orange-600">{user.upcoming}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}