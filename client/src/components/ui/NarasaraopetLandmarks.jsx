import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, Share2, X } from 'lucide-react';

const STORAGE_KEY = 'tdp_nsr_landmarks';

const defaultLandmarks = [
  {
    id: 'railway_station',
    order: 1,
    nameTe: 'నరసరావుపేట రైల్వే స్టేషన్',
    nameEn: 'Narasaraopet Railway Station',
    location: 'Narasaraopet, Palnadu district',
    category: 'development',
    descTe: 'దక్షిణ మధ్య రైల్వే పరిధిలో ప్రజలకు ముఖ్యమైన ప్రయాణ కేంద్రం.',
    descEn: 'An important local rail hub serving commuters and visitors across the constituency.',
    historyFacts: ['Established rail connectivity for the town', 'Daily passenger movement and regional access'],
    devWorks: ['Passenger amenities improvements', 'Lighting and platform facility upgrades'],
    keyFacts: ['Rail hub|Yes', 'Platforms|3', 'Daily trains|45+'],
    mapsUrl: 'https://maps.google.com/?q=Narasaraopet+Railway+Station',
    image: '/mla/aravinda-babu.jpg',
    isActive: true
  },
  {
    id: 'kotappakonda',
    order: 2,
    nameTe: 'కోటప్పకొండ దేవస్థానం',
    nameEn: 'Kotappakonda Temple',
    location: 'Near Narasaraopet',
    category: 'religious',
    descTe: 'త్రికూట శిఖరాలతో ప్రసిద్ధి చెందిన శ్రీ త్రికోటేశ్వర స్వామి క్షేత్రం.',
    descEn: 'A famous hill shrine known for Sri Trikoteswara Swamy and the three-peak landscape.',
    historyFacts: ['Major Maha Shivaratri pilgrimage site', 'Known as Trikutadri'],
    devWorks: ['Road access and pilgrim amenities', 'Festival crowd management support'],
    keyFacts: ['Distance|13-20 km', 'Darshan|6 AM-8 PM', 'Festival|Maha Shivaratri'],
    mapsUrl: 'https://maps.google.com/?q=Kotappakonda+Temple',
    image: '/leaders/chandrababu-naidu.webp',
    isActive: true
  },
  {
    id: 'clock_tower',
    order: 3,
    nameTe: 'క్లాక్ టవర్ సెంటర్',
    nameEn: 'Clock Tower Centre',
    location: 'Narasaraopet town',
    category: 'market',
    descTe: 'పట్టణంలో వ్యాపారం, ప్రజా సమావేశాలు, స్థానిక రాకపోకలకు ప్రముఖ కేంద్రం.',
    descEn: 'A prominent town centre for trade, meetings, movement, and local identity.',
    historyFacts: ['Recognized town landmark', 'Busy commercial zone'],
    devWorks: ['Traffic and civic improvements', 'Market access improvements'],
    keyFacts: ['Type|Commercial', 'Access|Town center', 'Use|Public movement'],
    mapsUrl: 'https://maps.google.com/?q=Clock+Tower+Narasaraopet',
    image: '/leaders/nara-lokesh.webp',
    isActive: true
  }
];

const categoryLabel = {
  religious: 'Religious',
  development: 'Development',
  market: 'Market',
  historical: 'Historical',
  nature: 'Nature'
};

const NarasaraopetLandmarks = () => {
  const [landmarks, setLandmarks] = useState(defaultLandmarks);
  const [active, setActive] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const rows = Array.isArray(parsed) ? parsed : Object.values(parsed);
      if (rows.length) setLandmarks(rows);
    } catch {
      setLandmarks(defaultLandmarks);
    }
  }, []);

  const visible = useMemo(
    () => landmarks.filter((item) => item.isActive !== false).sort((a, b) => (a.order || 99) - (b.order || 99)),
    [landmarks]
  );

  return (
    <section id="narasaraopet" className="bg-white py-12 md:py-16">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Narasaraopet</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Landmarks, culture, and development</h2>
          <p className="mt-3 leading-7 text-slate-600">A bilingual local guide for important places, public amenities, history, and constituency development highlights.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {visible.map((item) => (
            <button key={item.id} type="button" onClick={() => setActive(item)} className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={item.imageBase64 || item.image || '/mla/aravinda-babu.jpg'} alt={item.nameEn} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-tdp-red shadow">{categoryLabel[item.category] || 'Place'}</span>
              </span>
              <span className="block p-4">
                <span className="block text-lg font-black text-slate-950">{item.nameTe || item.nameEn}</span>
                <span className="mt-1 block text-sm font-bold text-slate-500">{item.nameEn}</span>
                <span className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-tdp-red" />{item.location}</span>
                <span className="mt-3 line-clamp-3 block text-sm leading-6 text-slate-600">{item.descTe || item.descEn}</span>
                <span className="mt-4 inline-flex items-center font-black text-tdp-red">View details <ExternalLink size={14} className="ml-1" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && <LandmarkModal item={active} onClose={() => setActive(null)} />}
    </section>
  );
};

const LandmarkModal = ({ item, onClose }) => {
  const share = () => {
    const text = `${item.nameTe || item.nameEn}\n${item.descEn || ''}\n${item.mapsUrl || ''}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/76 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-56 bg-slate-100 md:h-72">
          <img src={item.imageBase64 || item.image || '/mla/aravinda-babu.jpg'} alt={item.nameEn} className="h-full w-full object-cover" />
          <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 shadow" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="max-h-[calc(88vh-14rem)] overflow-y-auto p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-tdp-red">{categoryLabel[item.category] || 'Place'}</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{item.nameTe || item.nameEn}</h3>
          <p className="font-bold text-slate-500">{item.nameEn}</p>
          <p className="mt-4 leading-7 text-slate-700">{item.descTe}</p>
          <p className="mt-2 leading-7 text-slate-600">{item.descEn}</p>

          <ModalList title="History and facts" items={item.historyFacts} />
          <ModalList title="Development works" items={item.devWorks} />
          {!!item.keyFacts?.length && (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {item.keyFacts.map((fact) => {
                const [label, value] = String(fact).split('|');
                return (
                  <div key={fact} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-black text-tdp-navy">{value}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-tdp-navy px-4 py-3 font-black text-white"><MapPin size={18} /> Open map</a>}
            <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 font-black text-slate-800"><Share2 size={18} /> Share</button>
          </div>
        </div>
      </article>
    </div>
  );
};

const ModalList = ({ title, items = [] }) => {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <h4 className="font-black text-slate-950">{title}</h4>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => <li key={item} className="rounded-lg bg-yellow-50 px-3 py-2 text-sm font-semibold text-slate-700">{item}</li>)}
      </ul>
    </div>
  );
};

export default NarasaraopetLandmarks;
