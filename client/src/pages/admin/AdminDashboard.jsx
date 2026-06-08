import { useCollection } from '@/hooks/useFirestore';
import { BarAnalytics, LineAnalytics, PieAnalytics } from '@/components/admin/AnalyticsChart';

const AdminDashboard = () => {
  const analytics = useCollection('analytics', { orderByField: 'date', orderDirection: 'desc', limitCount: 30 });
  const work = useCollection('dailyWork');
  const news = useCollection('news');
  const gallery = useCollection('gallery');
  const data = (analytics.data || []).slice().reverse();
  const counts = [{ name: 'Work', value: work.data?.length || 0 }, { name: 'News', value: news.data?.length || 0 }, { name: 'Gallery', value: gallery.data?.length || 0 }];
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black text-gray-950">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-4">{[{ label: 'Total Visits', value: data.reduce((sum, item) => sum + (item.totalVisits || 0), 0) }, { label: 'Work Items', value: work.data?.length || 0 }, { label: 'News Items', value: news.data?.length || 0 }, { label: 'Gallery Items', value: gallery.data?.length || 0 }].map((item) => <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{item.label}</p><p className="text-3xl font-black text-tdp-red">{item.value}</p></div>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Weekly Visits</h2>{data.length ? <LineAnalytics data={data} /> : <p>No data yet</p>}</div>
        <div className="rounded-lg bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Content Counts</h2><BarAnalytics data={counts} /></div>
        <div className="rounded-lg bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Visitor Activity</h2><PieAnalytics data={[{ name: 'Page views', value: data.reduce((s, i) => s + (i.totalVisits || 0), 0) }, { name: 'Chat queries', value: data.reduce((s, i) => s + (i.chatbotQueries || 0), 0) }]} /></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
