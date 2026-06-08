import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { subscribeDocuments } from '@/services/firestoreService';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const Ticker = () => {
  const [items, setItems] = useState([]);
  const { language } = useLanguage();
  const { t } = useTranslation();
  useEffect(() => subscribeDocuments('tickerNews', { activeOnly: true, orderByField: 'order' }, setItems), []);
  if (!items.length) return null;
  return (
    <div className="overflow-hidden bg-tdp-navy text-white">
      <div className="container-page flex items-center gap-4 py-3">
        <span className="shrink-0 rounded bg-tdp-red px-3 py-1 text-xs font-black uppercase">{t('home.ticker')} ►</span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-[ticker_28s_linear_infinite] whitespace-nowrap">
            {items.map((item) => (
              <Link to={item.link || '/news'} key={item.id} className="mr-12 text-sm font-semibold hover:text-tdp-yellow">
                {getLangField(item, 'text', language)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{'@keyframes ticker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}'}</style>
    </div>
  );
};

export default Ticker;
