interface ProgressBarProps {
  step: number
  totalSteps?: number
}

const stepLabels = ['Start', 'Hooper', 'Wellness', 'RPE']

export default function ProgressBar({ step, totalSteps = 4 }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className="text-xs font-medium transition-colors duration-300"
            style={{ color: i + 1 <= step ? '#8b5cf6' : 'var(--muted)' }}
          >
            {label}
          </span>
        ))}
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--card2)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(step / totalSteps) * 100}%`,
            backgroundColor: '#7c3aed',
          }}
        />
      </div>
    </div>
  )
}
