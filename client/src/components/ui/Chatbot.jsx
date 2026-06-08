import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages, isTyping, sendMessage, quickQuestions } = useChatbot();

  useEffect(() => {
    if (open) scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping, open]);

  const submit = (text = inputText) => {
    sendMessage(text);
    setInputText('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            className="fixed inset-0 flex flex-col bg-white md:absolute md:inset-auto md:bottom-16 md:right-0 md:h-[32rem] md:w-96 md:overflow-hidden md:rounded-lg md:border md:border-yellow-200 md:shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-tdp-red to-tdp-yellow p-4 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/18"><Bot size={22} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">Aravinda Babu Assistant</p>
                  <p className="text-xs font-semibold text-white/78">Online assistant</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white" aria-label="Close chat"><X size={18} /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((msg, index) => <ChatMessage key={`${msg.role}-${index}-${msg.text}`} message={msg} />)}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="border-t border-gray-100 bg-white p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {quickQuestions.map((q) => (
                  <button key={q.label} type="button" onClick={() => submit(q.query)} className="shrink-0 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-900">
                    {q.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && submit()}
                  placeholder="Type your message..."
                  className="min-h-11 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
                <button type="button" onClick={() => submit()} className="grid h-11 w-11 place-items-center rounded-lg bg-tdp-red text-white shadow-red" aria-label="Send message"><Send size={17} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-14 items-center gap-2 rounded-full bg-gradient-to-br from-tdp-red to-tdp-yellow px-4 font-black text-white shadow-xl transition-transform hover:scale-105"
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span className="hidden sm:inline">Chat with us</span>
      </button>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[84%] rounded-2xl p-3 text-sm leading-6 ${isUser ? 'rounded-br-sm bg-gradient-to-br from-tdp-red to-tdp-yellow font-semibold text-white' : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'}`}>
        <p>{message.text}</p>
        {message.link && <ChatLink link={message.link} />}
      </div>
    </div>
  );
};

const ChatLink = ({ link }) => {
  const external = /^(https?:|tel:|mailto:)/.test(link.url);
  const className = "mt-3 inline-flex items-center rounded-lg bg-tdp-yellow px-3 py-2 text-xs font-black text-tdp-navy";
  if (external) {
    return <a href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel={link.url.startsWith('http') ? 'noreferrer' : undefined} className={className}>{link.label}</a>;
  }
  return <Link to={link.url} className={className}>{link.label}</Link>;
};

export default Chatbot;
