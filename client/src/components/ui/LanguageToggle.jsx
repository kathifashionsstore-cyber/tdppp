import { Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const options = [
    { key: 'te', label: 'తెలుగు' },
    { key: 'en', label: 'English' }
  ];
  return (
    <div className="inline-flex items-center gap-1 border border-red-100 bg-white p-1 shadow-sm">
      <Languages size={15} className="ml-1 text-tdp-red" />
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => setLanguage(option.key)}
          className={`px-2.5 py-1 text-xs font-black transition ${language === option.key ? 'bg-tdp-red text-white shadow-red' : 'text-gray-600 hover:bg-yellow-50 hover:text-tdp-red'}`}
          aria-pressed={language === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
