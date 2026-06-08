import { Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  const nextLabel = language === 'en' ? '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41' : 'English';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-black text-tdp-red shadow-sm transition hover:bg-yellow-50"
      aria-label={`Switch language to ${nextLabel}`}
    >
      <Languages size={15} />
      <span>{nextLabel}</span>
    </button>
  );
};

export default LanguageToggle;
