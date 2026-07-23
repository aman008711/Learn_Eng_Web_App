
interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  className?: string;
}

export default function ProgressRing({ radius, stroke, progress, className }: ProgressRingProps) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className={className}>
      {/* Background Track Ring */}
      <circle
        stroke="rgba(255, 255, 255, 0.05)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Front Active Progress Ring */}
      <circle
        stroke="url(#progressGradient)"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        strokeLinecap="round"
        transform={`rotate(-90 ${radius} ${radius})`} // Starts from the top (12 o'clock)
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
