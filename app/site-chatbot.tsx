'use client';

import { CircleAlert, MessageCircle, RefreshCw, Send, X } from 'lucide-react';
import { type SubmitEvent, useCallback, useEffect, useRef, useState } from 'react';

type SenderType = 'visitor' | 'admin';

type ChatMessage = {
  id: string;
  senderType: SenderType;
  senderName: string;
  body: string;
  createdAt: string;
};

type ChatConversation = {
  id: string;
  visitorName: string;
  status: 'open' | 'closed';
  lastMessageAt: string;
};

type VisitorSession = {
  id: string;
  token: string;
};

const endpoint = process.env.NEXT_PUBLIC_CMS_API_URL ?? 'https://infostorage-cms.patrickoliverdeguzman.workers.dev';
const visitorStorageKey = 'infostorage.chat.visitor-session';

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Your message could not be sent. Please try again.';
}

export default function SiteChatbot() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<VisitorSession | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', senderType: 'admin', senderName: 'INFOStorage', body: 'Hello — send us a message and an INFOStorage administrator can reply here.', createdAt: '' },
  ]);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${endpoint}${path}`, options);
    const data = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(data.error ?? 'The chat service is unavailable.');
    return data;
  }, []);

  const loadConversation = useCallback(async (savedSession: VisitorSession) => {
    setLoadingConversation(true);
    try {
      const data = await request<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/v1/chat/conversations/${savedSession.id}`, {
        headers: { 'X-Visitor-Token': savedSession.token },
      });
      setConversation(data.conversation);
      setMessages(data.messages);
      setError('');
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setLoadingConversation(false);
    }
  }, [request]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(visitorStorageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as VisitorSession;
      if (!saved?.id || !saved?.token) return;
      window.setTimeout(() => {
        setSession(saved);
        void loadConversation(saved);
      }, 0);
    } catch {
      localStorage.removeItem(visitorStorageKey);
    }
  }, [loadConversation]);

  useEffect(() => {
    if (!open || !session || !conversation) return;
    const interval = window.setInterval(() => void loadConversation(session), 8_000);
    return () => window.clearInterval(interval);
  }, [conversation, loadConversation, open, session]);

  const openChat = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const resetConversation = () => {
    localStorage.removeItem(visitorStorageKey);
    setSession(null);
    setConversation(null);
    setMessages([{ id: 'welcome', senderType: 'admin', senderName: 'INFOStorage', body: 'Hello — send us a message and an INFOStorage administrator can reply here.', createdAt: '' }]);
    setError('');
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || busy || loadingConversation) return;
    setBusy(true);
    setError('');
    try {
      if (!session) {
        const data = await request<{ conversation: ChatConversation; messages: ChatMessage[]; visitorToken: string }>('/v1/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorName, visitorEmail, message }),
        });
        const nextSession = { id: data.conversation.id, token: data.visitorToken };
        localStorage.setItem(visitorStorageKey, JSON.stringify(nextSession));
        setSession(nextSession);
        setConversation(data.conversation);
        setMessages(data.messages);
      } else {
        const data = await request<{ message: ChatMessage }>(`/v1/chat/conversations/${session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Visitor-Token': session.token },
          body: JSON.stringify({ message }),
        });
        setMessages((current) => [...current, data.message]);
      }
      setDraft('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  return (
    <aside className="site-chatbot" aria-label="Chat with INFOStorage">
      {open && (
        <section id="infostorage-assistant" className="chatbot-panel">
          <header className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-mark"><MessageCircle size={18} /></span>
              <span><strong>Chat with INFOStorage</strong><small>Messages go directly to the admin inbox</small></span>
            </div>
            <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </header>

          <div className="chatbot-thread" aria-live="polite">
            {messages.map((message) => (
              <div className={`chatbot-message chatbot-message-${message.senderType}`} key={message.id}>
                <div>
                  <small>{message.senderType === 'admin' ? message.senderName || 'INFOStorage' : 'You'}</small>
                  <p>{message.body}</p>
                </div>
              </div>
            ))}
            {loadingConversation && <div className="chatbot-connection"><RefreshCw size={14} className="chatbot-spin" /> Reconnecting to your conversation…</div>}
          </div>

          {!session && (
            <div className="chatbot-contact">
              <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder="Name (optional)" autoComplete="name" />
              <input value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} placeholder="Email (optional, for follow-up)" type="email" autoComplete="email" />
            </div>
          )}

          {error && <div className="chatbot-error"><CircleAlert size={15} /><span>{error}</span>{session && <button type="button" onClick={resetConversation}>Start over</button>}</div>}

          <form className="chatbot-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="infostorage-chat-input">Message INFOStorage</label>
            <textarea ref={inputRef} id="infostorage-chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={session ? 'Write a reply…' : 'How can we help?'} maxLength={2000} rows={2} />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || busy || loadingConversation}>{busy ? <RefreshCw size={17} className="chatbot-spin" /> : <Send size={17} />}</button>
          </form>
          <p className="chatbot-note">Replies appear here on this device. Leave an email if you would also like follow-up.</p>
        </section>
      )}

      <button type="button" className="chatbot-launcher" onClick={open ? () => setOpen(false) : openChat} aria-expanded={open} aria-controls="infostorage-assistant">
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span>{open ? 'Close chat' : 'Chat with us'}</span>
      </button>
    </aside>
  );
}
