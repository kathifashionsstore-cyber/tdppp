import { motion } from 'framer-motion';
import { Bus, Clock3, Mountain, Route, Sparkles, TrainFront } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const content = {
  te: {
    eyebrow: 'నరసరావుపేట గురించి',
    title: 'కోటప్పకొండ శ్రీ త్రికోటేశ్వర స్వామి దేవస్థానం',
    intro: 'పల్నాడు జిల్లాలోని ప్రసిద్ధ హిందూ పుణ్యక్షేత్రం కోటప్పకొండ. నరసరావుపేటకు సుమారు 13 నుంచి 20 కిలోమీటర్ల దూరంలో ఉండే ఈ కొండ మూడు శిఖరాలతో ప్రత్యేక గుర్తింపు పొందింది.',
    facts: [
      ['త్రికూటాద్రి', 'బ్రహ్మ, విష్ణు, రుద్ర శిఖరాలుగా కనిపించే మూడు కొండలు.'],
      ['ప్రధాన దైవం', 'బ్రహ్మ శిఖరంపై శివలింగ రూపంలో శ్రీ త్రికోటేశ్వర స్వామి.'],
      ['మహా శివరాత్రి', 'విద్యుత్ దీపాలతో అలంకరించిన భారీ ప్రభలతో లక్షలాది భక్తుల ఉత్సవం.'],
      ['మేధా దక్షిణామూర్తి', 'కొండ మధ్య భాగంలో ఉన్న అరుదైన ధ్యాన స్వరూప శివాలయం.']
    ],
    timings: 'దర్శనం: ఉదయం 6:00 నుంచి మధ్యాహ్నం 1:00 వరకు, సాయంత్రం 3:00 నుంచి రాత్రి 8:00 వరకు.',
    road: 'నరసరావుపేట నుంచి రోడ్డు మార్గంలో 15-30 నిమిషాల్లో చేరుకోవచ్చు.',
    bus: 'APSRTC మరియు స్థానిక బస్సులు నరసరావుపేట బస్టాండ్ నుంచి అందుబాటులో ఉంటాయి.',
    rail: 'సమీప రైల్వే కేంద్రం నరసరావుపేట రైల్వే స్టేషన్.'
  },
  en: {
    eyebrow: 'About Narasaraopet',
    title: 'Kotappakonda Sri Trikoteswara Swamy Temple',
    intro: 'Kotappakonda is a major Hindu pilgrimage landmark in Palnadu district, about 13 to 20 kilometres from Narasaraopet depending on the route. The hill is known for its unique three-peak form.',
    facts: [
      ['Trikutadri Peaks', 'Three peaks associated with Brahma, Vishnu, and Rudra.'],
      ['Main Deity', 'Lord Shiva is worshipped as Sri Trikoteswara Swamy on Brahma peak.'],
      ['Maha Shivaratri', 'A massive celebration with tall decorated Prabhalu and lakhs of devotees.'],
      ['Medha Dakshinamurthy', 'A rare shrine showing Lord Shiva in a meditative celibate form.']
    ],
    timings: 'Darshan: 6:00 AM to 1:00 PM and 3:00 PM to 8:00 PM.',
    road: 'Reach by road from Narasaraopet in about 15-30 minutes.',
    bus: 'APSRTC and local buses operate from Narasaraopet bus stand.',
    rail: 'The nearest rail hub is Narasaraopet Railway Station.'
  }
};

const NarasaraopetHighlight = () => {
  const { language } = useLanguage();
  const text = content[language] || content.en;
  return (
    <section className="overflow-hidden bg-white py-12 md:py-16">
      <div className="container-page grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }}>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">{text.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-gray-950 md:text-5xl">{text.title}</h2>
          <p className="mt-4 text-base leading-7 text-gray-600">{text.intro}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {text.facts.map(([title, body], index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="border-l-4 border-tdp-yellow bg-yellow-50 p-4 shadow-sm">
                <p className="font-black text-tdp-navy">{title}</p>
                <p className="mt-1 text-sm leading-5 text-gray-600">{body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} className="relative">
          <div className="relative min-h-[430px] overflow-hidden bg-tdp-navy shadow-2xl">
            <img src="/mla/aravinda-babu.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-72" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 bg-white px-3 py-2 text-sm font-black text-tdp-red shadow-lg">
              <Mountain size={18} />
              Kotappakonda
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="mb-4 inline-flex items-center gap-2 border border-white/25 bg-black/25 px-3 py-2 text-sm font-bold backdrop-blur">
                <Clock3 size={16} className="text-tdp-yellow" />
                {text.timings}
              </div>
              <div className="grid gap-3">
                <InfoLine icon={Route} text={text.road} />
                <InfoLine icon={Bus} text={text.bus} />
                <InfoLine icon={TrainFront} text={text.rail} />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-5 hidden border border-red-200 bg-tdp-red px-5 py-4 text-white shadow-xl md:block">
            <Sparkles className="mb-2 text-tdp-yellow" />
            <p className="text-sm font-black">Pilgrimage, culture, connectivity</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const InfoLine = ({ icon: Icon, text }) => (
  <div className="flex items-start gap-3 bg-white/10 p-3 backdrop-blur">
    <Icon size={18} className="mt-0.5 shrink-0 text-tdp-yellow" />
    <p className="text-sm leading-5 text-white/88">{text}</p>
  </div>
);

export default NarasaraopetHighlight;
