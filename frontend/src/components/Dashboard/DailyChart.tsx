import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { daily: number[]; month: string; }

export default function DailyChart({ daily, month }: Props) {
  const data = daily.map((v, i) => ({
    day: `${i + 1}`,
    spend: v,
  }));

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between mb-16">
        <div>
          <div className="fw-700">การใช้จ่ายรายวัน · Daily Spending</div>
          <div className="text-xs text-3">{month}</div>
        </div>
        <div className="text-xs text-3">฿/day</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-3)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-2)' }}
            itemStyle={{ color: 'var(--mint)' }}
            formatter={(v: number) => [`฿${Math.round(v).toLocaleString()}`, 'ใช้จ่าย']}
            cursor={{ fill: 'rgba(52,211,153,0.08)' }}
          />
          <Bar dataKey="spend" fill="var(--mint)" radius={[3, 3, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
