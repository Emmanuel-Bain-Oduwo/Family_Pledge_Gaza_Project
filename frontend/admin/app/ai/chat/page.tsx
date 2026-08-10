'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, History, LogOut, MessageSquarePlus, Send, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/AdminLayout';
import AiMessageContent from '../../../components/AiMessageContent';
import { askFamilyPledgeAi, type AiChatMessage, type AiContextBlock } from '../../../lib/aiWorkspaceApi';

const STORAGE_KEY = 'family-pledge-ai-chat-sessions-v1';
const STARTERS = [
  'Summarize what needs admin attention from the Family Pledge database today.',
  'How many contributions are confirmed this month and what is still pending?',
  'Help me prepare a thoughtful Islamic reminder for the Family Pledge community.',
  'Help me plan and write something clearly for today.',
];

interface ChatItem extends AiChatMessage { context?: AiContextBlock[]; }
interface ChatSession { id: string; title: string; messages: ChatItem[]; updatedAt: string; }

function makeSession(): ChatSession {
  return { id: crypto.randomUUID(), title: 'New chat', messages: [], updatedAt: new Date().toISOString() };
}

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 40)));
}

export default function FamilyPledgeAiChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = loadSessions();
    const initial = stored[0] || makeSession();
    const next = stored.length ? stored : [initial];
    setSessions(next);
    setActiveId(initial.id);
    if (!stored.length) saveSessions(next);
  }, []);

  const active = useMemo(() => sessions.find((session) => session.id === activeId), [sessions, activeId]);
  const messages = active?.messages || [];

  const persist = (updater: (current: ChatSession[]) => ChatSession[]) => {
    setSessions((current) => {
      const next = updater(current);
      saveSessions(next);
      return next;
    });
  };

  const updateMessages = (nextMessages: ChatItem[]) => {
    persist((current) => current.map((session) => session.id === activeId ? {
      ...session,
      title: session.title === 'New chat' && nextMessages.length ? nextMessages.find((item) => item.role === 'user')?.content.slice(0, 52) || 'Family Pledge chat' : session.title,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    } : session));
  };

  const newChat = () => {
    const created = makeSession();
    persist((current) => [created, ...current]);
    setActiveId(created.id);
    setInput('');
    setHistoryOpen(false);
  };

  const deleteSession = (id: string) => {
    const remaining = sessions.filter((session) => session.id !== id);
    if (!remaining.length) {
      const created = makeSession();
      setSessions([created]); saveSessions([created]); setActiveId(created.id);
    } else {
      setSessions(remaining); saveSessions(remaining);
      if (activeId === id) setActiveId(remaining[0].id);
    }
  };

  const send = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || busy || !activeId) return;
    const previous: AiChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    const withUser: ChatItem[] = [...messages, { role: 'user', content: message }];
    updateMessages(withUser);
    setInput('');
    setBusy(true);
    try {
      const result = await askFamilyPledgeAi(message, previous);
      const withAssistant: ChatItem[] = [...withUser, { role: 'assistant', content: result.answer, context: result.context_used }];
      updateMessages(withAssistant);
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 20);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally { setBusy(false); }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void send(); };

  return (
    <AdminLayout title="Family Pledge AI Chat" subtitle="Islamic-aware admin and general assistant">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={newChat} className="btn-primary inline-flex items-center gap-2"><MessageSquarePlus size={16} /> New Chat</button>
          <button type="button" onClick={() => setHistoryOpen((value) => !value)} className="btn-secondary inline-flex items-center gap-2"><History size={16} /> History</button>
          <button type="button" onClick={() => router.push('/ai-assistant')} className="btn-secondary ml-auto inline-flex items-center gap-2"><LogOut size={16} /> Exit Chat</button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
          <aside className={`${historyOpen ? 'block' : 'hidden'} card max-h-[68vh] overflow-y-auto p-2 lg:block`}>
            <div className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-gray-400">Chat history</div>
            <div className="space-y-1">
              {sessions.map((session) => (
                <div key={session.id} className={`group flex items-center gap-1 rounded-xl ${session.id === activeId ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
                  <button type="button" className="min-w-0 flex-1 px-3 py-3 text-left" onClick={() => { setActiveId(session.id); setHistoryOpen(false); }}>
                    <div className="truncate text-sm font-semibold text-gray-800">{session.title}</div>
                    <div className="mt-1 text-[10px] text-gray-400">{new Date(session.updatedAt).toLocaleString()}</div>
                  </button>
                  <button type="button" aria-label="Delete chat" onClick={() => deleteSession(session.id)} className="mr-2 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </aside>

          <div className="card overflow-hidden">
            <div className="h-[60vh] min-h-[440px] overflow-y-auto bg-gray-50 p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="mx-auto max-w-2xl py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot size={24} /></div>
                  <h2 className="font-bold text-gray-900">What do you want to work on?</h2>
                  <p className="mt-1 text-sm text-gray-500">Ask about Family Pledge, Islam, admin work, planning, writing, technology, study or another useful topic.</p>
                  <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
                    {STARTERS.map((starter) => <button key={starter} type="button" onClick={() => void send(starter)} className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:border-primary/40 hover:bg-primary/5">{starter}</button>)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' && <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-primary text-white"><Bot size={16} /></div>}
                      <div className={`max-w-[86%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-white' : 'border border-gray-200 bg-white text-gray-800'}`}>
                        {message.role === 'assistant' ? <AiMessageContent content={message.content} /> : <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>}
                        {message.context && message.context.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">{message.context.map((block) => <span key={block.name} title={block.description} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">{block.name.replace(/_/g, ' ')}</span>)}</div>}
                      </div>
                      {message.role === 'user' && <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gray-800 text-white"><User size={15} /></div>}
                    </div>
                  ))}
                  {busy && <div className="flex items-center gap-3 text-sm text-gray-500"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white"><Bot size={16} /></div><div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">Preparing an answer…</div></div>}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={submit} className="border-t border-gray-200 bg-white p-3 sm:p-4">
              <div className="flex gap-2">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} maxLength={4000} className="input min-h-[52px] flex-1 resize-none" placeholder="Ask anything useful — Family Pledge, Islam, writing, planning, technology, study…" />
                <button disabled={busy || !input.trim()} className="btn-primary self-end px-4 disabled:opacity-50" aria-label="Send AI message"><Send size={18} /></button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Enter to send · Shift+Enter for a new line</p>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
