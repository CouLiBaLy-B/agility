import { statusConfig } from '../data/boards';

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
  onChange?: (status: keyof typeof statusConfig) => void;
}

export function StatusBadge({ status, onChange }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (onChange) {
    return (
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as keyof typeof statusConfig)}
        className="text-xs font-semibold px-3 py-1.5 rounded-md border-0 cursor-pointer outline-none transition-all hover:opacity-80"
        style={{
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {Object.entries(statusConfig).map(([key, cfg]) => (
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
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
