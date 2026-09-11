import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Shield, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/fx/Card';
import { Button } from '@/components/fx/Button';
import { Badge, LabelBadge } from '@/components/fx/Badge';
import { copilotService } from '@/services/copilotService';
import { DEMO_COPILOT_SUGGESTIONS } from '@/data/mockData';
import type { CopilotMessage } from '@/types';

const WELCOME: CopilotMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Welcome to the FORTEXA AI Security Copilot.\n\nI analyze structured outputs from the FORTEXA pipeline:\n\n**Data sources I work with:**\n· Network State vectors (current + historical windows)\n· Graph Neural Network entity risk scores\n· Temporal Model behavioral patterns\n· World Model future-state simulations\n· Forecast Engine risk predictions\n· MITRE ATT&CK behavior mappings\n· Explainability feature contributions\n\n**Important:** I do not invent telemetry or access the internet. Every analysis I provide is grounded in FORTEXA pipeline outputs and clearly labeled as Observed, Inferred, or Forecast.\n\nWhat would you like to investigate?`,
  timestamp: new Date().toISOString(),
  label: 'observed',
  sources: ['FORTEXA processing pipeline', 'Imported dataset provenance'],
};

const LABEL_COLORS = {
  observed: 'text-[var(--primary-blue)]',
  inferred: 'text-amber-400',
  forecast: 'text-[var(--primary-blue)]',
  recommendation: 'text-emerald-400',
};

export function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    const response = await copilotService.sendMessage(text, messages);
    setMessages((prev) => [...prev, response]);
    setLoading(false);
  };

  const clear = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line === '') return <div key={i} className="h-1.5" />;
      const parts = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const isBullet = line.startsWith('·');
      return (
        <p
          key={i}
          className={`leading-relaxed ${isBullet ? 'text-[var(--muted-foreground)]' : ''}`}
          dangerouslySetInnerHTML={{ __html: parts }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] p-4 gap-3 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold">AI Security Copilot</h1>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
            Analyst assistant · Powered by FORTEXA pipeline outputs · Not live internet access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            READY
          </div>
          <Button variant="ghost" size="sm" onClick={clear}>
            <RefreshCw className="size-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded bg-[var(--card)]">
        <div className="p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`size-7 rounded shrink-0 mt-0.5 flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-blue-600/20 border border-blue-600/30'
                      : 'bg-[var(--secondary)] border border-[var(--border)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Shield className="size-3.5 text-blue-400" />
                  ) : (
                    <User className="size-3.5 text-[var(--muted-foreground)]" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] space-y-1.5`}>
                  {/* Label */}
                  {msg.role === 'assistant' && msg.label && (
                    <div className="flex items-center gap-2">
                      <LabelBadge label={msg.label} />
                      <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="flex justify-end">
                      <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600/15 border border-blue-600/25 text-[var(--foreground)]'
                        : 'bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]'
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((s) => (
                        <span
                          key={s}
                          className="text-[9px] font-mono text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="size-7 rounded bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                <Loader2 className="size-3.5 text-blue-400 animate-spin" />
              </div>
              <div className="bg-[var(--secondary)] border border-[var(--border)] rounded px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions */}
      <div className="shrink-0">
        <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
          Suggested Queries
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_COPILOT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="text-[10px] px-2.5 py-1.5 bg-[var(--secondary)] border border-[var(--border)] rounded hover:border-blue-500/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && send(input)}
          placeholder="Ask about the network state, forecast, or request an incident briefing…"
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50"
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
        >
          <Send className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
