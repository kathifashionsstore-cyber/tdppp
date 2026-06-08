import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatbot } from '@/hooks/useChatbot';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const { messages, isTyping, sendMessage, quickQuestions } = useChatbot();
  const { t } = useTranslation();
  const submit = (text = inputText) => {
    sendMessage(text);
    setInputText('');
  };
  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      {open && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed inset-0 flex flex-col bg-white md:absolute md:inset-auto md:bottom-16 md:right-0 md:h-96 md:w-80 md:overflow-hidden md:rounded-2xl md:border md:border-yellow-200 md:shadow-2xl">
          <div className="bg-gradient-to-r from-red-700 to-yellow-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><Bot size={20} /></div>
              <div><p className="text-sm font-bold">TDP Assistant</p><p className="text-xs opacity-80">{t('chatbot.online')}</p></div>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, index) => (
              <div key={`${msg.text}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'rounded-br-sm bg-gradient-to-br from-red-600 to-yellow-500 text-white' : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="text-xs font-semibold text-gray-500">Typing...</div>}
          </div>
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {quickQuestions.map((q) => <button key={q} onClick={() => submit(q)} className="rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs text-yellow-800">{q}</button>)}
            </div>
          )}
          <div className="border-t border-gray-100 bg-white p-3">
            <div className="flex gap-2">
              <input value={inputText} onChange={(event) => setInputText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder={t('chatbot.placeholder')} className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
              <button onClick={() => submit()} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-red-600 to-yellow-500 text-white" aria-label="Send"><Send size={14} /></button>
            </div>
          </div>
        </motion.div>
      )}
      <button onClick={() => setOpen(!open)} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-yellow-500 text-white shadow-xl transition-transform hover:scale-110" aria-label="Open chatbot">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
};

export default Chatbot;
