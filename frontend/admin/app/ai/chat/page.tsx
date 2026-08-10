'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Database, Send, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/AdminLayout';
import {
  askFamilyPledgeAi,
  type AiChatMessage,
  type AiContextBlock,
} from '../../../lib/aiWorkspaceApi';

const STARTERS = [
  'Summarize what needs admin attention from the Family Pledge database today.',
  'How many contributions are confirmed this month and what is still pending?',
  'Summarize the active campaigns and their current progress.',
  'What approved Islamic reminder material is available for a sadaqah message?',
];

interface ChatItem extends AiChatMessage {
  context?: AiContextBlock[];
}

export default function FamilyPledgeAiChatPage() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const send = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || busy) return;

    const previous: AiChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((items) => [...items, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    try {
      const result = await askFamilyPledgeAi(message, previous);
      setMessages((items) => [
        ...items,
        { role: 'assistant', content: result.answer, context: result.context_used },
      ]);
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 20);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  return (
    <AdminLayout
      title="Family Pledge AI Chat"
      subtitle="Scoped admin assistant with approved read-only database context."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/ai-assistant" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft size={15} /> Draft workspace
          </Link>
          <Link href="/ai/tasks" className="btn-secondary">Scheduled tasks</Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Info icon={<ShieldCheck size={18} />} title="Restricted scope" text="Islam relevant to Family Pledge, Gaza humanitarian donations, and platform operations only." />
          <Info icon={<Database size={18} />} title="Read-only tools" text="The model receives sanitized summaries selected by the backend, never database credentials or unrestricted SQL." />
          <Info icon={<Bot size={18} />} title="No autonomous actions" text="Chat cannot send notifications, approve contributions, publish content, delete records, or change donor data." />
        </div>

        <div className="card overflow-hidden">
          <div className="h-[56vh] min-h-[420px] overflow-y-auto bg-gray-50 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-2xl py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot size={24} />
                </div>
                <h2 className="font-bold text-gray-900">Ask about Family Pledge operations</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Use the chat for platform summaries, campaigns, contributions, donation operations and approved Islamic reminder context. Personal donor details are intentionally unavailable to the AI.
                </p>
                <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => void send(starter)}
                      className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:border-primary/40 hover:bg-primary/5"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-primary text-white"><Bot size={16} /></div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-white' : 'border border-gray-200 bg-white text-gray-800'}`}>
                      <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                      {message.context && message.context.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-2">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Read-only context used</div>
                          <div className="flex flex-wrap gap-1.5">
                            {message.context.map((block) => (
                              <span key={block.name} title={block.description} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                                {block.name.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gray-800 text-white"><User size={15} /></div>
                    )}
                  </div>
                ))}
                {busy && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white"><Bot size={16} /></div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">Checking approved context and preparing an answer…</div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={4000}
                className="input min-h-[52px] flex-1 resize-none"
                placeholder="Ask about donations, campaigns, pending work, approved reminders…"
              />
              <button disabled={busy || !input.trim()} className="btn-primary self-end px-4 disabled:opacity-50" aria-label="Send AI message">
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">Enter to send · Shift+Enter for a new line · no donor PII is supplied to the model</p>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900"><span className="text-primary">{icon}</span>{title}</div>
      <p className="text-xs leading-5 text-gray-500">{text}</p>
    </div>
  );
}
