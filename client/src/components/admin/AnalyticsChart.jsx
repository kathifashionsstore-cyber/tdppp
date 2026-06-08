import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const LineAnalytics = ({ data = [], dataKey = 'totalVisits' }) => (
  <ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey={dataKey} stroke="#CC0000" strokeWidth={3} /></LineChart></ResponsiveContainer>
);

export const BarAnalytics = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={260}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#F5A623" /></BarChart></ResponsiveContainer>
);

export const PieAnalytics = ({ data = [] }) => {
  const colors = ['#FFD700', '#CC0000', '#1a1a2e', '#228B22'];
  return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
};
