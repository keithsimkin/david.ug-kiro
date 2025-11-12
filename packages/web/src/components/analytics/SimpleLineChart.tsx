import { DailyMetric } from '@shared/types/analytics';

interface SimpleLineChartProps {
  data: DailyMetric[];
  color?: string;
  height?: number;
}

export function SimpleLineChart({ data, color = '#3b82f6', height = 200 }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const width = 100;
  const padding = 10;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (d.count / maxValue) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Create area path
  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ];
  const areaD = `M ${areaPoints.join(' L ')} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${height}px` }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - ratio * (height - padding * 2) - padding;
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity="0.1" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((point, i) => {
          const [x, y] = point.split(',').map(Number);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill={color} />
              <title>
                {data[i].date}: {data[i].count}
              </title>
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground px-2">
        <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        {data.length > 2 && (
          <span>
            {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
        <span>
          {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
