import { appendChatbotKnowledge } from './firestoreService';
import { stripHtml } from '@/utils/helpers';

export const QUICK_QUESTIONS = {
  en: [
    { label: 'About MLA', query: 'Tell me about the MLA' },
    { label: 'Super 6 Schemes', query: 'What are Super 6 schemes?' },
    { label: 'Contact Office', query: 'How can I contact the office?' },
    { label: 'Narasaraopet Info', query: 'Tell me about Narasaraopet' },
    { label: 'Latest News', query: 'Show me latest news' }
  ],
  te: [
    { label: 'MLA గురించి', query: 'MLA గురించి చెప్పండి' },
    { label: 'సూపర్ 6 పథకాలు', query: 'సూపర్ 6 పథకాలు ఏమిటి?' },
    { label: 'ఆఫీస్ సంప్రదింపు', query: 'ఆఫీస్‌ను ఎలా సంప్రదించాలి?' },
    { label: 'నరసరావుపేట సమాచారం', query: 'నరసరావుపేట గురించి చెప్పండి' },
    { label: 'తాజా వార్తలు', query: 'తాజా వార్తలు చూపించండి' }
  ]
};

const responses = {
  en: {
    super6: {
      text: 'Super 6 are the flagship welfare schemes promoted by TDP for the people of Andhra Pradesh. Open the page below for the complete list and videos.',
      link: { label: 'View Super 6 Schemes', url: '/super6' }
    },
    schemes: {
      text: 'You can review government and welfare schemes on the Schemes page.',
      link: { label: 'View All Schemes', url: '/schemes' }
    },
    mla: {
      text: 'Dr. Chadalavada Aravinda Babu is the MLA of Narasaraopet from TDP. He won the 2024 election with 103,167 votes.',
      link: { label: 'Read More About MLA', url: '/leaders' }
    },
    contact: {
      text: 'You can reach the office by phone or through the Contact page.',
      link: { label: 'Call 9398724704', url: 'tel:9398724704' }
    },
    narasaraopet: {
      text: 'Narasaraopet is in Palnadu district, Andhra Pradesh, and is closely associated with Kotappakonda temple and regional public-service activity.',
      link: { label: 'Explore Narasaraopet', url: '/narasaraopet' }
    },
    kotappakonda: {
      text: 'Kotappakonda is a sacred hill temple dedicated to Sri Trikoteswara Swamy near Narasaraopet.',
      link: { label: 'View Kotappakonda Info', url: '/narasaraopet#kotappakonda' }
    },
    news: {
      text: 'Latest news, public updates, and videos are available on the News page.',
      link: { label: 'View Latest News', url: '/news' }
    },
    gallery: {
      text: 'The Gallery page has photos and videos from events, visits, and constituency work.',
      link: { label: 'Open Gallery', url: '/gallery' }
    },
    default: {
      text: 'I can help with Super 6 schemes, MLA information, office contact details, Narasaraopet, Kotappakonda, news, and gallery updates.',
      link: null
    },
    welcome: {
      text: 'Namaste! Welcome. How can I help you today?',
      link: null
    }
  },
  te: {
    super6: {
      text: 'సూపర్ 6 పథకాలు ఆంధ్రప్రదేశ్ ప్రజల కోసం TDP ప్రోత్సహిస్తున్న ముఖ్య సంక్షేమ పథకాలు. పూర్తి వివరాలు మరియు వీడియోలు చూడండి.',
      link: { label: 'సూపర్ 6 పథకాలు చూడండి', url: '/super6' }
    },
    schemes: {
      text: 'ప్రభుత్వ మరియు సంక్షేమ పథకాల వివరాలు పథకాలు పేజీలో చూడవచ్చు.',
      link: { label: 'అన్ని పథకాలు చూడండి', url: '/schemes' }
    },
    mla: {
      text: 'డా. చదలవాడ అరవింద బాబు నరసరావుపేట TDP ఎమ్మెల్యే. 2024 ఎన్నికల్లో 103,167 ఓట్లతో గెలిచారు.',
      link: { label: 'MLA గురించి చదవండి', url: '/leaders' }
    },
    contact: {
      text: 'ఆఫీస్‌ను ఫోన్ ద్వారా లేదా Contact పేజీ ద్వారా సంప్రదించవచ్చు.',
      link: { label: '9398724704 కు కాల్ చేయండి', url: 'tel:9398724704' }
    },
    narasaraopet: {
      text: 'నరసరావుపేట ఆంధ్రప్రదేశ్‌లోని పల్నాడు జిల్లాలో ఉంది. కోటప్పకొండ ఆలయం మరియు స్థానిక అభివృద్ధి కార్యక్రమాలతో ప్రసిద్ధి చెందింది.',
      link: { label: 'నరసరావుపేట చూడండి', url: '/narasaraopet' }
    },
    kotappakonda: {
      text: 'కోటప్పకొండ నరసరావుపేట సమీపంలోని శ్రీ త్రికోటేశ్వర స్వామి పవిత్ర క్షేత్రం.',
      link: { label: 'కోటప్పకొండ సమాచారం', url: '/narasaraopet#kotappakonda' }
    },
    news: {
      text: 'తాజా వార్తలు, ప్రజా అప్డేట్లు, వీడియోలు News పేజీలో అందుబాటులో ఉన్నాయి.',
      link: { label: 'తాజా వార్తలు చూడండి', url: '/news' }
    },
    gallery: {
      text: 'ఈవెంట్లు, పర్యటనలు, నియోజకవర్గ పనుల ఫోటోలు మరియు వీడియోలు Gallery పేజీలో ఉన్నాయి.',
      link: { label: 'గ్యాలరీ తెరవండి', url: '/gallery' }
    },
    default: {
      text: 'సూపర్ 6 పథకాలు, MLA సమాచారం, ఆఫీస్ సంప్రదింపు, నరసరావుపేట, కోటప్పకొండ, వార్తలు, గ్యాలరీ గురించి నేను సహాయం చేయగలను.',
      link: null
    },
    welcome: {
      text: 'నమస్కారం! స్వాగతం. మీకు ఎలా సహాయం చేయగలను?',
      link: null
    }
  }
};

export const getWelcomeMessage = (language = 'en') => responses[language]?.welcome || responses.en.welcome;

export const getBotResponse = (input, language = 'en') => {
  const lower = String(input || '').toLowerCase();
  const langResponses = responses[language] || responses.en;

  if (lower.includes('kotappakonda') || lower.includes('temple') || lower.includes('కోటప్ప') || lower.includes('ఆలయ')) return langResponses.kotappakonda;
  if (lower.includes('super6') || lower.includes('super 6') || lower.includes('సూపర్') || lower.includes('scheme') || lower.includes('పథక')) return langResponses.super6;
  if (lower.includes('mla') || lower.includes('aravinda') || lower.includes('doctor') || lower.includes('ఎమ్మెల్యే') || lower.includes('అరవింద')) return langResponses.mla;
  if (lower.includes('contact') || lower.includes('phone') || lower.includes('office') || lower.includes('సంప్రద') || lower.includes('ఫోన్') || lower.includes('ఆఫీస్')) return langResponses.contact;
  if (lower.includes('narasaraopet') || lower.includes('constituency') || lower.includes('నరసరావుపేట') || lower.includes('నియోజక')) return langResponses.narasaraopet;
  if (lower.includes('news') || lower.includes('video') || lower.includes('వార్త') || lower.includes('వీడియో')) return langResponses.news;
  if (lower.includes('gallery') || lower.includes('photo') || lower.includes('ఫోటో') || lower.includes('గ్యాలరీ')) return langResponses.gallery;
  if (lower.includes('schemes') || lower.includes('welfare') || lower.includes('benefits')) return langResponses.schemes;

  return langResponses.default;
};

export class ChatbotEngine {
  constructor(knowledge = [], language = 'en') {
    this.knowledge = knowledge;
    this.language = language;
  }

  findAnswer(userInput) {
    const input = String(userInput || '').toLowerCase().trim();
    for (const item of this.knowledge || []) {
      if (item.active === false) continue;
      const question = (this.language === 'te' ? item.question_te : item.question_en) || '';
      if (this.isSimilar(input, question.toLowerCase())) {
        return (this.language === 'te' ? item.answer_te : item.answer_en) || getBotResponse(userInput, this.language).text;
      }
    }
    return getBotResponse(userInput, this.language).text;
  }

  isSimilar(input, question) {
    const inputWords = input.split(/\s+/).filter((word) => word.length > 2);
    const questionWords = question.split(/\s+/).filter((word) => word.length > 2);
    const matches = inputWords.filter((word) => questionWords.some((qWord) => qWord.includes(word) || word.includes(qWord)));
    return matches.length / Math.max(inputWords.length, 1) > 0.4;
  }
}

export const autoIndexContent = async (contentItem, type) => {
  const knowledge = {
    id: `auto_${type}_${contentItem.id || Date.now()}`,
    question_te: `${contentItem.title_te || ''} గురించి చెప్పండి`,
    question_en: `Tell me about ${contentItem.title_en || ''}`,
    answer_te: `${contentItem.title_te || ''}: ${stripHtml(contentItem.description_te || contentItem.content_te || '').slice(0, 220)}...`,
    answer_en: `${contentItem.title_en || ''}: ${stripHtml(contentItem.description_en || contentItem.content_en || '').slice(0, 220)}...`,
    category: type,
    active: true,
    updatedAt: new Date().toISOString()
  };
  await appendChatbotKnowledge(knowledge);
};
