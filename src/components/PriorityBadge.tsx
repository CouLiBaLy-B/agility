import { priorityConfig } from '../data/boards';

interface PriorityBadgeProps {
  priority: keyof typeof priorityConfig;
  onChange?: (priority: keyof typeof priorityConfig) => void;
}

export function PriorityBadge({ priority, onChange }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  if (onChange) {
    return (
      <select
        value={priority}
        onChange={(e) => onChange(e.target.value as keyof typeof priorityConfig)}
        className="text-xs font-semibold px-3 py-1.5 rounded-md border-0 cursor-pointer outline-none transition-all hover:opacity-80 bg-transparent"
        style={{ color: config.color }}
      >
        {Object.entries(priorityConfig).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md"
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  );
}
