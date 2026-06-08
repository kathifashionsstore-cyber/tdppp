import { useParams } from 'react-router-dom';
import PageHero from './PageHero';
import { useDoc } from '@/hooks/useFirestore';
import { useLanguage } from '@/hooks/useLanguage';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DetailPage = ({ collectionName, page }) => {
  const { id } = useParams();
  const { language } = useLanguage();
  const { data, isLoading, isError } = useDoc(collectionName, id);
  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <div className="container-page py-12">Content not found.</div>;
  const title = getLangField(data, 'title', language) || getLangField(data, 'name', language);
  const html = getLangField(data, 'description', language) || getLangField(data, 'content', language);
  return (
    <>
      <PageHero page={page} title={title} subtitle={data.category || ''} />
      <article className="container-page py-12">
        <img src={data.image || data.thumbnail || data.images?.[0] || '/og-image.svg'} alt={title} className="mb-8 max-h-[520px] w-full rounded-lg object-cover shadow-md" />
        <h1 className="text-3xl font-black text-gray-950">{title}</h1>
        <div className="prose-content mt-5 rounded-lg bg-white p-6 shadow-sm" dangerouslySetInnerHTML={sanitizeHtml(html)} />
      </article>
    </>
  );
};

export default DetailPage;
