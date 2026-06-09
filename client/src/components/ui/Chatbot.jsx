import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Send, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import BicycleIcon from '@/components/ui/BicycleIcon';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages, isTyping, sendMessage, quickQuestions } = useChatbot();

  useEffect(() => {
    if (open && !minimized) scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping, open, minimized]);

  const submit = (text = inputText) => {
    sendMessage(text);
    setInputText('');
  };

  const close = () => {
    setOpen(false);
    setMinimized(false);
  };

  return (
    <div className="fixed bottom-52 right-4 z-[55] md:bottom-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 34, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 22, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed z-[70] flex flex-col overflow-hidden bg-white shadow-2xl ${
              minimized
                ? 'inset-x-3 bottom-24 top-auto rounded-lg border border-yellow-200 md:absolute md:inset-auto md:bottom-16 md:right-0 md:w-[360px]'
                : 'inset-0 h-[100dvh] md:absolute md:inset-auto md:bottom-16 md:right-0 md:h-[480px] md:w-[360px] md:rounded-lg md:border md:border-yellow-200'
            }`}
          >
            <ChatHeader minimized={minimized} onMinimize={() => setMinimized((value) => !value)} onClose={close} />

            {!minimized && (
              <>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 [-webkit-overflow-scrolling:touch]">
                  {messages.map((msg, index) => <ChatMessage key={`${msg.role}-${index}-${msg.text}`} message={msg} />)}
                  {isTyping && <TypingIndicator />}
                  <div ref={scrollRef} />
                </div>

                <div className="border-t border-gray-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {quickQuestions.map((q) => (
                      <button key={q.label} type="button" onClick={() => submit(q.query)} className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-900 transition hover:border-yellow-400 hover:bg-yellow-100">
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && submit()}
                      placeholder="Type your question..."
                      className="min-h-11 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                    />
                    <button type="button" onClick={() => submit()} className="inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg bg-tdp-yellow px-3 text-sm font-black text-tdp-navy shadow-yellow" aria-label="Send message">
                      <Send size={17} />
                      <BicycleIcon size={24} color="#1a1a2e" opacity={1} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative inline-flex items-center gap-2"
          aria-label="Open Narasaraopet assistant chat"
        >
          <span className="chatbot-pulse relative grid h-[52px] w-[52px] place-items-center rounded-full bg-tdp-yellow text-tdp-navy shadow-[0_12px_32px_rgba(245,166,35,0.42)] md:h-14 md:w-14">
            <BicycleIcon size={38} color="#1a1a2e" opacity={1} />
          </span>
          <span className="hidden rounded-full bg-white px-3 py-2 text-sm font-black text-slate-900 shadow-lg ring-1 ring-yellow-200 md:inline">Chat</span>
        </button>
      )}
    </div>
  );
};

const ChatHeader = ({ minimized, onMinimize, onClose }) => (
  <header className="flex min-h-[68px] items-center justify-between gap-3 bg-tdp-yellow px-4 py-3 text-tdp-navy">
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/72 shadow-sm">
        <BicycleIcon size={34} color="#1a1a2e" opacity={1} />
      </div>
      <div className="min-w-0">
        <p className="telugu truncate text-sm font-black">నరసరావుపేట సహాయకుడు</p>
        <p className="truncate text-xs font-bold text-slate-800/78">Narasaraopet Assistant</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onMinimize} className="grid h-11 w-11 place-items-center rounded-full bg-white/45 text-slate-950 transition hover:bg-white/70" aria-label={minimized ? 'Restore chat' : 'Minimize chat'}>
        <Minus size={18} />
      </button>
      <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/45 text-slate-950 transition hover:bg-white/70" aria-label="Close chat">
        <X size={18} />
      </button>
    </div>
  </header>
);

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">
      <BotAvatar />
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
      </span>
    </div>
  </div>
);

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[88%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && <BotAvatar />}
        <div className={`rounded-2xl p-3 text-sm leading-6 ${isUser ? 'rounded-br-sm bg-slate-900 font-semibold text-white' : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'}`}>
          <p>{message.text}</p>
          {message.link && <ChatLink link={message.link} />}
          <time className={`mt-2 block text-[10px] font-bold ${isUser ? 'text-white/60' : 'text-slate-400'}`}>{formatTime(message.timestamp)}</time>
        </div>
      </div>
    </div>
  );
};

const BotAvatar = () => (
  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tdp-yellow text-tdp-navy shadow-sm">
    <BicycleIcon size={24} color="#1a1a2e" opacity={1} />
  </span>
);

const ChatLink = ({ link }) => {
  const external = /^(https?:|tel:|mailto:)/.test(link.url);
  const className = 'mt-3 inline-flex min-h-10 items-center rounded-lg bg-tdp-yellow px-3 py-2 text-xs font-black text-tdp-navy shadow-sm';
  if (external) {
    return <a href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel={link.url.startsWith('http') ? 'noreferrer' : undefined} className={className}>{link.label}</a>;
  }
  return <Link to={link.url} className={className}>{link.label}</Link>;
};

const formatTime = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default Chatbot;
