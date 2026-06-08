const STATIC = {
  te: [
    [/mla|ఎమ్మెల్యే|ఎవరు/i, 'డా. చదలవాడ అరవింద బాబు నరసారావుపేట నియోజకవర్గ ఎమ్మెల్యే.'],
    [/contact|సంప్రదించు|phone/i, 'Contact పేజీ లేదా WhatsApp ద్వారా MLA కార్యాలయాన్ని సంప్రదించండి.'],
    [/schemes|పథకాలు/i, 'పథకాలు పేజీలో కేంద్ర, రాష్ట్ర, స్థానిక పథకాల వివరాలు ఉన్నాయి.']
  ],
  en: [
    [/mla|who|leader/i, 'Dr. Chadalavada Aravinda Babu is the MLA of Narasaraopet constituency.'],
    [/contact|phone|reach/i, 'Use the Contact page or WhatsApp button to reach the MLA office.'],
    [/schemes|welfare/i, 'The Schemes page lists Central, State, and local welfare schemes.']
  ]
};

export const answerQuestion = (message = '', knowledge = [], language = 'te') => {
  for (const [pattern, answer] of STATIC[language] || STATIC.te) {
    if (pattern.test(message)) return answer;
  }
  const input = message.toLowerCase();
  const hit = knowledge.find((item) => {
    const question = (language === 'te' ? item.question_te : item.question_en || '').toLowerCase();
    return question.split(/\s+/).some((word) => word.length > 2 && input.includes(word));
  });
  if (hit) return language === 'te' ? hit.answer_te : hit.answer_en;
  return language === 'te'
    ? 'క్షమించండి, సమాధానం దొరకలేదు. Contact పేజీ ద్వారా సంప్రదించండి.'
    : "Sorry, I couldn't find an answer. Please use the Contact page.";
};
