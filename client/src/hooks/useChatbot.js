import { useEffect, useMemo, useRef, useState } from 'react';
import { QUICK_QUESTIONS, getBotResponse, getWelcomeMessage } from '@/services/chatbotService';
import { trackChatQuery } from '@/services/analyticsService';
import { useLanguage } from './useLanguage';

const STORAGE_KEY = 'tdp-chat-history';

const readHistory = (language) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return [{ role: 'bot', timestamp: Date.now(), ...getWelcomeMessage(language) }];
};

export const useChatbot = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState(() => readHistory(language));
  const [isTyping, setIsTyping] = useState(false);
  const timeoutsRef = useRef([]);
  const quickQuestions = useMemo(() => QUICK_QUESTIONS[language] || QUICK_QUESTIONS.en, [language]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  const sendMessage = (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;

    setMessages((items) => [...items, { role: 'user', text: clean, timestamp: Date.now() }]);
    setIsTyping(true);
    trackChatQuery(clean, language).catch(() => {});

    const timeoutId = window.setTimeout(() => {
      const response = getBotResponse(clean, language);
      setMessages((items) => [...items, { role: 'bot', timestamp: Date.now(), ...response }]);
      setIsTyping(false);
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeoutId);
    }, 600);
    timeoutsRef.current.push(timeoutId);
  };

  return { messages, isTyping, sendMessage, quickQuestions };
};
