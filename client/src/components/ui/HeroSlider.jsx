import MlaHero from '@/components/ui/MlaHero';

const HeroSlider = ({ hero }) => <MlaHero slides={hero?.slides || []} />;

export default HeroSlider;
