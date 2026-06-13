import { useMemo, useState } from 'react';
import type { Board } from '../data/boards';
import { useAppData } from '../context/AppDataContext';
import { isApiEnabled } from '../api/client';
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '../api/workspaces';
import type { ApiUser } from '../api/auth';

interface PeopleProps {
  boards: Board[];
}

const roles: ApiUser['role'][] = ['viewer', 'member', 'admin', 'owner'];

export function People({ boards }: PeopleProps) {
  const { users, setUsers, workspace, currentUser } = useAppData();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<ApiUser['role']>('member');
  const [status, setStatus] = useState<string | null>(null);

  const userStats = useMemo(() => {
    const stats: Record<string, { assigned: number; completed: number; overdue: number; upcoming: number }> = {};

    users.forEach((u) => {
      stats[u.id] = { assigned: 0, completed: 0, overdue: 0, upcoming: 0 };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    boards.forEach((board) => {
      board.tasks.forEach((task) => {
        task.assignees.forEach((userId) => {
          if (stats[userId]) {
            stats[userId].assigned++;
            if (task.status === 'done') stats[userId].completed++;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today && task.status !== 'done') stats[userId].overdue++;
            else if (dueDate >= today && task.status !== 'done') stats[userId].upcoming++;
          }
        });
      });
    });

    return users.map((user) => ({ ...user, ...stats[user.id] }));
  }, [boards, users]);

  const inviteMember = () => {
    if (!inviteEmail.trim()) return;
    setStatus(null);
    const fallback = {
      id: crypto.randomUUID(),
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: '',
      initials: (inviteName || inviteEmail).slice(0, 2).toUpperCase(),
      color: '#579BFC',
    };

    if (!isApiEnabled() || !workspace) {
      setUsers?.((prev) => [...prev, fallback]);
      setInviteEmail('');
      setInviteName('');
      setStatus('Member added locally.');
      return;
    }

    void inviteWorkspaceMember({ email: inviteEmail, name: inviteName || undefined, role: inviteRole }, workspace.id)
      .then((member) => {
        setUsers?.((prev) => (prev.some((user) => user.id === member.id) ? prev : [...prev, member]));
        setInviteEmail('');
        setInviteName('');
        setStatus('Invitation sent.');
      })
      .catch((error) => {
        console.warn('Unable to invite member.', error);
        setStatus('Unable to invite member.');
      });
  };

  const changeRole = (userId: string, role: ApiUser['role']) => {
    setUsers?.((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    if (isApiEnabled() && workspace) {
      void updateWorkspaceMemberRole(userId, role, workspace.id).catch((error) => {
        console.warn('Unable to update member role.', error);
        setStatus('Unable to update role.');
      });
    }
  };

  const removeMember = (userId: string) => {
    if (userId === currentUser.id) {
      setStatus('You cannot remove yourself.');
      return;
    }
    setUsers?.((prev) => prev.filter((user) => user.id !== userId));
    if (isApiEnabled() && workspace) {
      void removeWorkspaceMember(userId, workspace.id).catch((error) => {
        console.warn('Unable to remove member.', error);
        setStatus('Unable to remove member.');
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your team members and their workload</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3">Invite member</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder="Name"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="Email"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as ApiUser['role'])}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button
            onClick={inviteMember}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
          >
            Invite
          </button>
        </div>
        {status && <p className="text-xs text-gray-500 mt-2">{status}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userStats.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: user.color }}
              >
                {user.initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800 truncate">{user.name}</h3>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <select
                value={user.role ?? 'member'}
                onChange={(event) => changeRole(user.id, event.target.value as ApiUser['role'])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
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
              <button
                onClick={() => removeMember(user.id)}
                className="w-full px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg"
              >
                Remove member
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
