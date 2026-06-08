import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { CATEGORIES } from '@/utils/constants';
import { getLangField, normalizeSearch } from '@/utils/helpers';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';
import WorkCard from '@/components/ui/WorkCard';
import NewsCard from '@/components/ui/NewsCard';
import GalleryGrid from '@/components/ui/GalleryGrid';

const PublicCollectionPage = ({ collectionName, page, title, subtitle, cardType = 'work' }) => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const { data = [], isLoading, isError, refetch } = useCollection(collectionName, { publishedOnly: true, orderByField: collectionName === 'news' ? 'publishedAt' : 'createdAt', orderDirection: 'desc' });
  const categories = CATEGORIES[collectionName] || [];
  const filtered = useMemo(() => data.filter((item) => {
    const okCategory = category === 'all' || item.category === category || item.type === category;
    const haystack = normalizeSearch(`${getLangField(item, 'title', 'te')} ${getLangField(item, 'title', 'en')} ${getLangField(item, 'location', 'te')} ${getLangField(item, 'location', 'en')}`);
    return okCategory && (!search || haystack.includes(normalizeSearch(search)));
  }), [category, data, search]);
  const renderCard = (item) => {
    if (cardType === 'news') return <NewsCard key={item.id} item={item} />;
    if (cardType === 'gallery') return null;
    return <WorkCard key={item.id} item={item} />;
  };
  return (
    <>
      <PageHero page={page} title={title} subtitle={subtitle} />
      <section className="container-page py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-tdp-red text-white' : 'bg-white text-gray-700'}`}>{t('common.all')}</button>
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${category === item ? 'bg-tdp-red text-white' : 'bg-white text-gray-700'}`}>{item}</button>)}
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('common.search')} className="min-h-11 rounded-full border border-gray-200 bg-white px-4 outline-none focus:border-tdp-yellow" />
        </div>
        {isLoading && <SkeletonGrid />}
        {isError && <div className="rounded-lg bg-red-50 p-6 text-red-700">{t('common.error')} <button onClick={() => refetch()} className="font-bold underline">{t('common.retry')}</button></div>}
        {!isLoading && !isError && !filtered.length && <div className="rounded-lg bg-white p-10 text-center text-gray-500">{t('common.empty')}</div>}
        {cardType === 'gallery' ? <GalleryGrid items={filtered} /> : <div className="grid gap-5 md:grid-cols-3">{filtered.map(renderCard)}</div>}
      </section>
    </>
  );
};

export default PublicCollectionPage;
