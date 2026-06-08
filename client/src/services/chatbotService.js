import { appendChatbotKnowledge } from './firestoreService';
import { stripHtml } from '@/utils/helpers';

export const QUICK_QUESTIONS = {
  te: ['MLA ఎవరు?', 'రోజువారీ పని ఏమిటి?', 'పట్టణ అభివృద్ధి?', 'పథకాలు ఏవి?', 'సంప్రదించడం ఎలా?'],
  en: ['Who is the MLA?', "What is today's work?", 'Town development?', 'Available schemes?', 'How to contact?']
};

const STATIC_KNOWLEDGE = {
  te: {
    'mla|ఎమ్మెల్యే|who|ఎవరు': 'డా. చదలవాడ అరవింద బాబు నరసారావుపేట నియోజకవర్గ ఎమ్మెల్యే. 2024 ఎన్నికలలో 19,705 ఓట్ల ఆధిక్యంతో గెలిచారు.',
    'education|విద్య|చదువు|doctor|డాక్టర్': 'అరవింద బాబు M.S. Orthopaedics పూర్తిచేశారు - NTR విశ్వవిద్యాలయం, విజయవాడ (1992).',
    'party|పార్టీ|tdp|తెలుగుదేశం': 'తెలుగు దేశం పార్టీ (TDP) 1982లో స్వర్గీయ N.T. రామారావు స్థాపించారు.',
    'contact|సంప్రదించు|phone|నంబర్': 'MLA కార్యాలయం: నరసారావుపేట. WhatsApp లేదా Contact పేజీ ద్వారా సంప్రదించండి.',
    'kotappakonda|కొటప్పకొండ|temple|గుడి': 'కొటప్పకొండ పవిత్ర క్షేత్రానికి మెరుగైన సౌకర్యాల కోసం MLA విశేష కృషి చేస్తున్నారు.',
    'election|ఎన్నిక|votes|ఓట్లు|2024': '2024 ఎన్నికలలో డా. అరవింద బాబు 1,03,167 ఓట్లు పొంది 19,705 ఓట్ల ఆధిక్యంతో గెలిచారు.',
    'work|పని|development|అభివృద్ధి': 'రోజువారీ పని పేజీ చూడండి - అక్కడ నరసారావుపేటలో జరుగుతున్న అభివృద్ధి పనులు ఉన్నాయి.',
    'schemes|పథకాలు|welfare|సంక్షేమం': 'పథకాలు పేజీలో కేంద్ర, రాష్ట్ర ప్రభుత్వ పథకాల వివరాలు ఉన్నాయి.',
    'gallery|గ్యాలరీ|photos|ఫోటోలు': 'గ్యాలరీ పేజీలో MLA పనులు, సందర్శనలు మరియు కార్యక్రమాల ఫోటోలు, వీడియోలు ఉన్నాయి.'
  },
  en: {
    'mla|who|leader': 'Dr. Chadalavada Aravinda Babu is the MLA of Narasaraopet constituency. He won the 2024 elections with a margin of 19,705 votes.',
    'education|doctor|qualification': 'Dr. Aravinda Babu completed M.S. Orthopaedics from NTR University of Health Sciences, Vijayawada (1992).',
    'party|tdp|telugu desam': 'Telugu Desam Party (TDP) was founded by Late N.T. Rama Rao in 1982.',
    'contact|phone|reach': 'Contact the MLA office in Narasaraopet via the Contact page or WhatsApp button.',
    'kotappakonda|temple': 'Kotappakonda is a sacred pilgrimage site. The MLA is working to improve facilities for devotees.',
    'election|votes|2024|win': 'In 2024 elections, Dr. Aravinda Babu won with 1,03,167 votes and a margin of 19,705 votes.',
    'work|development|projects': 'Visit the Daily Work page to see ongoing and completed development works in Narasaraopet.',
    'schemes|welfare|benefits': 'Visit the Schemes page for information on Central and State government welfare schemes.',
    'gallery|photos|videos': "Visit the Gallery page to see photos and videos of the MLA's work, visits and programs."
  }
};

export class ChatbotEngine {
  constructor(knowledge = [], language = 'te') {
    this.knowledge = knowledge;
    this.language = language;
    this.staticKB = STATIC_KNOWLEDGE[language] || STATIC_KNOWLEDGE.te;
  }

  findAnswer(userInput) {
    const input = userInput.toLowerCase().trim();
    for (const [keyPattern, answer] of Object.entries(this.staticKB)) {
      if (keyPattern.split('|').some((key) => input.includes(key.toLowerCase()))) return answer;
    }
    for (const item of this.knowledge || []) {
      if (item.active === false) continue;
      const q = (this.language === 'te' ? item.question_te : item.question_en) || '';
      if (this.isSimilar(input, q.toLowerCase())) return this.language === 'te' ? item.answer_te : item.answer_en;
    }
    return this.language === 'te'
      ? 'క్షమించండి, మీ ప్రశ్నకు సమాధానం నాకు దొరకలేదు. దయచేసి Contact పేజీ ద్వారా మాకు సంప్రదించండి.'
      : "Sorry, I couldn't find an answer to your question. Please contact us via the Contact page.";
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
