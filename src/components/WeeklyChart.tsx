import { DayPoints } from '../types';

interface Props {
  data: DayPoints[];
  color?: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyChart({ data, color = '#6c5ce7' }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const maxPoints = Math.max(...data.map(d => d.points), 1);

  const getLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return DAY_LABELS[d.getDay()];
  };

  const chartHeight = 140;
  const barWidth = 32;
  const barGap = 12;
  const totalBars = data.length;
  const svgWidth = totalBars * (barWidth + barGap) + barGap;
  const labelHeight = 24;
  const svgHeight = chartHeight + labelHeight + 24;
  const gradientId = `bar-gradient-${color.replace('#', '')}`;
  const todayGradId = `bar-gradient-today-${color.replace('#', '')}`;

  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border">
      <div className="text-sm font-extrabold text-muted-foreground mb-3">Last 7 Days</div>
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={todayGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fd7043" stopOpacity="1" />
            <stop offset="100%" stopColor="#fdcb6e" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {data.map((day, i) => {
          const isToday = day.date === today;
          const barHeight = day.points === 0 ? 4 : Math.max(8, (day.points / maxPoints) * chartHeight);
          const x = barGap + i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const fill = isToday ? `url(#${todayGradId})` : `url(#${gradientId})`;

          return (
            <g key={day.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                ry="6"
                fill={fill}
                opacity={day.points === 0 ? 0.3 : 1}
              />

              {/* Today highlight ring */}
              {isToday && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={barHeight + 4}
                  rx="8"
                  ry="8"
                  fill="none"
                  stroke="#fd7043"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.7"
                />
              )}

              {/* Points label above bar */}
              {day.points > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={isToday ? '#fd7043' : color}
                  fontFamily="Nunito, sans-serif"
                >
                  {day.points}
                </text>
              )}

              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + labelHeight}
                textAnchor="middle"
                fontSize="12"
                fontWeight={isToday ? '900' : '700'}
                fill={isToday ? '#fd7043' : '#9b94c9'}
                fontFamily="Nunito, sans-serif"
              >
                {isToday ? 'Today' : getLabel(day.date)}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={barGap / 2}
          y1={chartHeight + 2}
          x2={svgWidth - barGap / 2}
          y2={chartHeight + 2}
          stroke="#ece9f8"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
