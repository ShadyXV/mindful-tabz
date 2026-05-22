interface ProgressBarProps {
  value: number
  max: number
  color: 'indigo' | 'emerald'
  size?: 'sm' | 'lg'
}

export function ProgressBar({ value, max, color, size = 'sm' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const barColor = color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'
  const glow =
    color === 'indigo'
      ? '0 0 15px rgba(99,102,241,0.5)'
      : '0 0 15px rgba(16,185,129,0.5)'

  if (size === 'lg') {
    return (
      <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000`}
          style={{ width: `${pct}%`, boxShadow: glow }}
        />
      </div>
    )
  }

  return (
    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor} transition-all duration-1000`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
