import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import NewsCard from '@/components/ui/NewsCard';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';
import { CATEGORIES } from '@/utils/constants';
import { getLangField, normalizeSearch } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const News = () => {
  const { language } = useLanguage();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { data = [], isLoading, isError, refetch } = useCollection('news', { publishedOnly: true, orderByField: 'publishedAt', orderDirection: 'desc' });

  const filtered = useMemo(() => data.filter((item) => {
    const okCategory = category === 'all' || item.category === category;
    const haystack = normalizeSearch(`${getLangField(item, 'title', language)} ${getLangField(item, 'content', language)} ${item.category || ''}`);
    return okCategory && (!search || haystack.includes(normalizeSearch(search)));
  }), [category, data, language, search]);

  return (
    <>
      <PageHero page="news" title="News" subtitle="Latest updates, announcements, and videos" />
      <section className="container-page py-10">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-tdp-red text-white' : 'bg-slate-100 text-slate-700'}`}>All</button>
              {CATEGORIES.news.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${category === item ? 'bg-tdp-red text-white' : 'bg-slate-100 text-slate-700'}`}>{item}</button>)}
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4">
              <Search size={17} className="text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search news" className="bg-transparent text-sm font-semibold outline-none" />
            </label>
          </div>
        </div>

        {isLoading && <SkeletonGrid />}
        {isError && <div className="rounded-lg bg-red-50 p-6 text-red-700">Unable to load news. <button onClick={() => refetch()} className="font-bold underline">Retry</button></div>}
        {!isLoading && !isError && !filtered.length && <div className="rounded-lg bg-white p-10 text-center text-gray-500">No news found.</div>}

        {!isLoading && !isError && (
          <div>
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Updates</p>
              <h2 className="text-2xl font-black text-slate-950">Latest News & Videos</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <NewsCard key={item.id} item={item} />)}</div>
          </div>
        )}
      </section>
    </>
  );
};

export default News;
