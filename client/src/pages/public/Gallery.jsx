import { useState } from 'react';
import { X } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import GalleryGrid from '@/components/ui/GalleryGrid';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const Gallery = () => {
  const [selected, setSelected] = useState(null);
  const { language } = useLanguage();
  const { data = [], isLoading } = useCollection('gallery', { publishedOnly: true, orderByField: 'order', orderDirection: 'asc' });
  return (
    <>
      <PageHero page="gallery" title="Gallery" subtitle="Photos and videos of constituency work" />
      <section className="container-page py-12">
        {isLoading ? <SkeletonGrid /> : <GalleryGrid items={data} onSelect={setSelected} />}
      </section>
      {selected && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full bg-tdp-red text-white"><X size={18} /></button>
            {selected.type === 'video' ? <VideoPlayer url={selected.url} title={getLangField(selected, 'title', language)} /> : <img src={selected.url || selected.images?.[0] || selected.thumbnail} alt={getLangField(selected, 'title', language)} className="max-h-[76vh] w-full rounded-xl object-contain" />}
            <div className="px-2 pb-2">
              <h3 className="mt-3 text-lg font-black text-slate-950">{getLangField(selected, 'title', language)}</h3>
              <div className="prose-content mt-2 text-sm leading-6 text-slate-600" dangerouslySetInnerHTML={sanitizeHtml(getLangField(selected, 'description', language) || getLangField(selected, 'content', language))} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
