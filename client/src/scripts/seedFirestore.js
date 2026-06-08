import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBp6dyQHsP05ptxyEIo0R71fpxvYbfHa8c',
  authDomain: 'tdpnrt.firebaseapp.com',
  projectId: 'tdpnrt',
  storageBucket: 'tdpnrt.firebasestorage.app',
  messagingSenderId: '538558202448',
  appId: '1:538558202448:web:8f6361480f96ea76cbc755',
  measurementId: 'G-MDXPP8PBGP'
};

const db = getFirestore(initializeApp(firebaseConfig));
const heroImage = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80';

await setDoc(doc(db, 'siteConfig', 'general'), {
  siteName_te: 'నరసారావుపేట TDP',
  siteName_en: 'Narasaraopet TDP',
  mlaName_te: 'డా. చదలవాడ అరవింద బాబు',
  mlaName_en: 'Dr. Chadalavada Aravinda Babu',
  constituency_te: 'నరసారావుపేట నియోజకవర్గం, పల్నాడు జిల్లా',
  constituency_en: 'Narasaraopet Constituency, Palnadu District, Andhra Pradesh',
  designation_te: 'ఎమ్మెల్యే - నరసారావుపేట',
  designation_en: 'MLA - Narasaraopet',
  party: 'Telugu Desam Party (TDP)',
  electedYear: '2024',
  margin: '19,705',
  totalVotes: '1,03,167',
  updatedAt: serverTimestamp()
}, { merge: true });

await setDoc(doc(db, 'siteConfig', 'stats'), {
  items: [
    { number: '2024', label_te: 'MLA ఎన్నికైన సంవత్సరం', label_en: 'Year Elected as MLA' },
    { number: '19,705', label_te: 'ఓట్ల ఆధిక్యం', label_en: 'Vote Margin' },
    { number: '100+', label_te: 'అభివృద్ధి ప్రాజెక్టులు', label_en: 'Development Projects' },
    { number: '25+', label_te: 'ఆరోగ్య శిబిరాలు', label_en: 'Health Camps' }
  ]
}, { merge: true });

await setDoc(doc(db, 'heroSections', 'home'), {
  slides: [
    ['నరసారావుపేట అభివృద్ధికి అంకితమైన నాయకుడు', "A Leader Dedicated to Narasaraopet's Development", 'మన MLA', 'Our MLA'],
    ['ప్రతి ఇంటికి — ప్రతి గ్రామానికి', 'To Every Home — To Every Village', 'అభివృద్ధి', 'Development'],
    ['కొటప్పకొండ అభివృద్ధి — ఆధ్యాత్మిక పర్యాటకం', 'Kotappakonda Development — Spiritual Tourism', 'ఆధ్యాత్మికం', 'Spiritual'],
    ['ఆరోగ్య శిబిరాలు — ప్రజా సేవ', 'Health Camps — Public Service', 'ఆరోగ్యం', 'Health'],
    ['2024 విజయం — 19,705 ఓట్ల ఆధిక్యం', '2024 Victory — 19,705 Vote Margin', 'విజయం', 'Victory']
  ].map(([title_te, title_en, tag_te, tag_en], index) => ({
    id: `seed_${index + 1}`,
    title_te,
    title_en,
    subtitle_te: 'నరసారావుపేట ప్రజల కోసం నిరంతర సేవ',
    subtitle_en: 'Continuous public service for Narasaraopet',
    tag_te,
    tag_en,
    image: heroImage,
    ctaText_te: 'మరింత చూడండి',
    ctaText_en: 'Explore More',
    ctaLink: '/daily-work'
  })),
  updatedAt: serverTimestamp()
}, { merge: true });

const ticker = [
  ['MLA డా. అరవింద బాబు నరసారావుపేట నగరంలో మురుగు నీటి పైపులైన్ పనులు సమీక్షించారు', 'MLA reviewed drainage pipeline works in Narasaraopet town'],
  ['కొటప్పకొండ ఆలయం అభివృద్ధికి ₹2 కోటి నిధులు విడుదల', 'Funds released for Kotappakonda temple development'],
  ['నరసారావుపేట నియోజకవర్గంలో 25 ఆరోగ్య శిబిరాలు నిర్వహించారు', '25 health camps conducted in Narasaraopet constituency'],
  ['TDP హైబ్రిడ్ మోడ్‌లో మహానాడు!', 'TDP Mahanadu in hybrid mode']
];
for (let i = 0; i < ticker.length; i += 1) {
  await addDoc(collection(db, 'tickerNews'), { text_te: ticker[i][0], text_en: ticker[i][1], link: '/news', isActive: true, order: i + 1 });
}

const towns = [
  ['నరసారావుపేట', 'Narasaraopet', 'town'],
  ['సత్తెనపల్లి', 'Sattenapalli', 'mandal'],
  ['బెల్లంకొండ', 'Bellamkonda', 'mandal'],
  ['గురాజాల', 'Gurazala', 'mandal'],
  ['దాచేపల్లి', 'Dachepalli', 'mandal'],
  ['మాచర్ల', 'Macherla', 'mandal'],
  ['రెంటచింతల', 'Rentachintala', 'mandal'],
  ['కారెంపూడి', 'Karempudi', 'mandal'],
  ['పిడుగురాళ్ళ', 'Piduguralla', 'mandal'],
  ['కొటప్పకొండ', 'Kotappakonda', 'village']
];
for (let i = 0; i < towns.length; i += 1) {
  await addDoc(collection(db, 'towns'), {
    name_te: towns[i][0],
    name_en: towns[i][1],
    type: towns[i][2],
    population: '',
    description_te: `${towns[i][0]} ప్రాంత అభివృద్ధి వివరాలు అడ్మిన్ ప్యానెల్ ద్వారా నవీకరించవచ్చు.`,
    description_en: `${towns[i][1]} development details can be updated from the admin panel.`,
    developments: [],
    image: heroImage,
    isPublished: true,
    order: i + 1,
    createdAt: serverTimestamp()
  });
}

console.log('Seed data written to Firestore.');
