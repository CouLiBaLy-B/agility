import { useUsers } from '../context/AppDataContext';

interface AvatarProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ userId, size = 'md' }: AvatarProps) {
  const users = useUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: user.color }}
      title={user.name}
      aria-label={user.name}
    >
      {user.initials}
    </div>
  );
}

interface AvatarGroupProps {
  userIds: string[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ userIds, max = 3, size = 'md' }: AvatarGroupProps) {
  const visible = userIds.slice(0, max);
  const remaining = userIds.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((id) => (
        <div key={id} className="ring-2 ring-white rounded-full">
          <Avatar userId={id} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'} rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-semibold ring-2 ring-white`}
          aria-label={`${remaining} more assignees`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
