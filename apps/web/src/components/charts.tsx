'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Open: '#ef4444',
  Assigned: '#3b82f6',
  InProgress: '#f59e0b',
  Escalated: '#dc2626',
  Resolved: '#22c55e',
  Closed: '#6b7280',
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#6b7280',
};

const PIE_FALLBACK = ['#003366', '#FFD600', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MandalBarChart({
  data,
}: {
  data: { mandal: string; open: number; resolved: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="mandal" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="open" name="Open" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data,
}: {
  data: { date: string; created: number; resolved: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="cCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#003366" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#003366" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="created" name="Created" stroke="#003366" fill="url(#cCreated)" strokeWidth={2} />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" fill="url(#cResolved)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
