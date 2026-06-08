import { useMemo, useState } from 'react';
import { useDoc } from './useFirestore';
import { ChatbotEngine, QUICK_QUESTIONS } from '@/services/chatbotService';
import { trackChatQuery } from '@/services/analyticsService';
import { useLanguage } from './useLanguage';
import { useTranslation } from 'react-i18next';

export const useChatbot = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { data } = useDoc('siteConfig', 'chatbotKnowledge');
  const engine = useMemo(() => new ChatbotEngine(data?.knowledge || [], language), [data, language]);
  const [messages, setMessages] = useState([{ role: 'bot', text: t('chatbot.welcome') }]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((items) => [...items, { role: 'user', text: clean }]);
    setIsTyping(true);
    await trackChatQuery(clean, language);
    window.setTimeout(() => {
      setMessages((items) => [...items, { role: 'bot', text: engine.findAnswer(clean) }]);
      setIsTyping(false);
    }, 450);
  };

  return { messages, isTyping, sendMessage, quickQuestions: QUICK_QUESTIONS[language] };
};
