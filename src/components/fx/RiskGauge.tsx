import { clsx } from 'clsx';

interface RiskGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function RiskGauge({ score, size = 'md', showLabel = true, className }: RiskGaugeProps) {
  const radius = size === 'sm' ? 28 : size === 'md' ? 40 : 56;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 5 : 7;
  const svgSize = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75;
  const offset = arc - arc * Math.min(score, 1);
  const rotation = 135;

  const color = score >= 0.8 ? '#FF3B30' : score >= 0.6 ? '#F59E0B' : score >= 0.4 ? '#F59E0B' : score >= 0.2 ? '#00A8FF' : '#22C55E';
  const label = score >= 0.8 ? 'CRITICAL' : score >= 0.6 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : score >= 0.2 ? 'LOW' : 'SAFE';

  const fontSize = size === 'sm' ? 10 : size === 'md' ? 13 : 18;

  return (
    <div className={clsx('flex flex-col items-center gap-1', className)}>
      <svg width={svgSize} height={svgSize} style={{ transform: `rotate(${rotation}deg)` }}>
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circumference - arc}`}
          strokeLinecap="round"
        />
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${arc - offset} ${circumference - (arc - offset)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          style={{ transform: `rotate(-${rotation}deg)`, transformOrigin: 'center', fontSize, fontFamily: 'JetBrains Mono, monospace', fill: color, fontWeight: 600 }}
        >
          {Math.round(score * 100)}
        </text>
      </svg>
      {showLabel && (
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
