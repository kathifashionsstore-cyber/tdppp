import MlaHero from '@/components/ui/MlaHero';
import { useHeroImages } from '@/hooks/useHeroImages';

const HeroSlideshow = ({ pageName }) => {
  const { images, isLoading } = useHeroImages(pageName);

  if (isLoading) {
    return (
      <section className="relative h-[42vh] overflow-hidden bg-slate-200 md:h-[55vh] lg:h-[70vh]" aria-label="Loading hero images">
        <div className="skeleton absolute inset-0" />
      </section>
    );
  }

  return <MlaHero slides={images} />;
};

export default HeroSlideshow;
