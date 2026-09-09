'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Archive, CheckCircle2, Mail, MessageCircle, RefreshCw, Search, Send, UserRound } from 'lucide-react';
import { CMS_API } from '@/lib/cms-api';
import { cmsAuthHeaders } from '@/lib/admin-session';

type ConversationStatus = 'open' | 'closed';

interface Conversation {
  id: string;
  visitorName: string;
  visitorEmail: string | null;
  status: ConversationStatus;
  lastMessagePreview: string;
  lastSenderType: 'visitor' | 'admin';
  lastMessageAt: string;
  unread: boolean;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'visitor' | 'admin';
  senderName: string;
  body: string;
  createdAt: string;
}

interface ConversationDetail {
  conversation: Conversation;
  messages: ChatMessage[];
}

function readableTime(value: string): string {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ConversationStatus>('open');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`${CMS_API}/v1/admin/conversations`, { headers: cmsAuthHeaders() });
      const data = (await response.json().catch(() => ({}))) as { conversations?: Conversation[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Conversations could not be loaded.');
      setConversations(data.conversations ?? []);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Conversations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string, showLoader = true) => {
    if (showLoader) setLoadingThread(true);
    try {
      const response = await fetch(`${CMS_API}/v1/admin/conversations/${id}`, { headers: cmsAuthHeaders() });
      const data = (await response.json().catch(() => ({}))) as ConversationDetail & { error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error ?? 'This conversation could not be opened.');
      setDetail(data);
      setConversations((current) => current.map((item) => item.id === id ? { ...item, ...data.conversation, unread: false } : item));
      await fetch(`${CMS_API}/v1/admin/conversations/${id}/read`, { method: 'POST', headers: cmsAuthHeaders() });
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This conversation could not be opened.');
    } finally {
      if (showLoader) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 6_000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    void loadConversation(selectedId);
    const timer = window.setInterval(() => void loadConversation(selectedId, false), 6_000);
    return () => window.clearInterval(timer);
  }, [loadConversation, selectedId]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [detail?.messages.length]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (statusFilter !== 'all' && conversation.status !== statusFilter) return false;
      if (!query) return true;
      return [conversation.visitorName, conversation.visitorEmail ?? '', conversation.lastMessagePreview]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [conversations, search, statusFilter]);

  const openConversation = (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDraft('');
  };

  const sendReply = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`${CMS_API}/v1/admin/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: cmsAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: draft.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: ChatMessage; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? 'The reply could not be sent.');
      setDetail((current) => current ? { ...current, messages: [...current.messages, data.message!] } : current);
      setDraft('');
      await loadConversations();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const setConversationStatus = async (status: ConversationStatus) => {
    if (!selectedId) return;
    setError('');
    try {
      const response = await fetch(`${CMS_API}/v1/admin/conversations/${selectedId}`, {
        method: 'PATCH',
        headers: cmsAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as { conversation?: Conversation; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error ?? 'The conversation status could not be changed.');
      setDetail((current) => current ? { ...current, conversation: data.conversation! } : current);
      setConversations((current) => current.map((item) => item.id === selectedId ? data.conversation! : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The conversation status could not be changed.');
    }
  };

  const unreadCount = conversations.filter((conversation) => conversation.unread).length;

  return (
    <div className="admin-chat-page">
      <div className="admin-chat-heading">
        <div>
          <h2>Chat inbox</h2>
          <p>Reply to website visitors and keep completed conversations organised.</p>
        </div>
        <button className="admin-btn admin-btn-secondary" type="button" onClick={() => void loadConversations()}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <div className="admin-chat-error" role="alert">{error}</div>}

      <div className="admin-chat-workspace">
        <aside className="admin-chat-list" aria-label="Chat conversations">
          <div className="admin-chat-list-tools">
            <label className="admin-chat-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search conversations</span>
              <input type="search" value={search} placeholder="Search visitors or messages" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="admin-chat-filters" aria-label="Conversation status">
              {(['open', 'closed', 'all'] as const).map((status) => (
                <button type="button" key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>
                  {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
                  {status === 'open' && unreadCount > 0 && <span>{unreadCount}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-chat-conversations">
            {loading ? (
              <div className="admin-chat-empty"><RefreshCw className="chatbot-spin" size={18} /> Loading conversations…</div>
            ) : filtered.length === 0 ? (
              <div className="admin-chat-empty"><MessageCircle size={22} /><strong>No matching conversations</strong><span>New website chats will appear here automatically.</span></div>
            ) : filtered.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`admin-chat-conversation ${selectedId === conversation.id ? 'active' : ''} ${conversation.unread ? 'unread' : ''}`}
                onClick={() => openConversation(conversation.id)}
              >
                <span className="admin-chat-avatar"><UserRound size={17} /></span>
                <span className="admin-chat-conversation-copy">
                  <span className="admin-chat-conversation-name">{conversation.visitorName}{conversation.unread && <i aria-label="Unread message" />}</span>
                  <span>{conversation.lastMessagePreview || 'No message preview'}</span>
                </span>
                <time dateTime={conversation.lastMessageAt}>{readableTime(conversation.lastMessageAt)}</time>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-chat-thread-panel" aria-label="Selected conversation">
          {!selectedId ? (
            <div className="admin-chat-empty admin-chat-empty-large">
              <MessageCircle size={32} />
              <strong>Select a conversation</strong>
              <span>Choose a visitor from the inbox to read and reply.</span>
            </div>
          ) : loadingThread && !detail ? (
            <div className="admin-chat-empty admin-chat-empty-large"><RefreshCw className="chatbot-spin" size={22} /> Opening conversation…</div>
          ) : detail ? (
            <>
              <header className="admin-chat-thread-header">
                <div>
                  <strong>{detail.conversation.visitorName}</strong>
                  <span>{detail.conversation.visitorEmail ? <><Mail size={13} /> {detail.conversation.visitorEmail}</> : 'No email supplied'}</span>
                </div>
                {detail.conversation.status === 'open' ? (
                  <button className="admin-btn admin-btn-secondary" type="button" onClick={() => void setConversationStatus('closed')}><CheckCircle2 size={15} /> Close conversation</button>
                ) : (
                  <button className="admin-btn admin-btn-secondary" type="button" onClick={() => void setConversationStatus('open')}><Archive size={15} /> Reopen</button>
                )}
              </header>

              <div className="admin-chat-thread" ref={threadRef} aria-live="polite">
                {detail.messages.map((message) => (
                  <article className={`admin-chat-message admin-chat-message-${message.senderType}`} key={message.id}>
                    <div><strong>{message.senderName}</strong><time dateTime={message.createdAt}>{readableTime(message.createdAt)}</time></div>
                    <p>{message.body}</p>
                  </article>
                ))}
              </div>

              {detail.conversation.status === 'open' ? (
                <form className="admin-chat-composer" onSubmit={sendReply}>
                  <label htmlFor="admin-chat-reply">Reply to {detail.conversation.visitorName}</label>
                  <div>
                    <textarea id="admin-chat-reply" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Write a helpful reply…" />
                    <button className="admin-btn admin-btn-primary" type="submit" disabled={!draft.trim() || sending}>
                      {sending ? <RefreshCw className="chatbot-spin" size={16} /> : <Send size={16} />} {sending ? 'Sending…' : 'Send reply'}
                    </button>
                  </div>
                  <small>Replies appear in the visitor’s chat on this device.</small>
                </form>
              ) : (
                <div className="admin-chat-closed"><CheckCircle2 size={16} /> This conversation is closed. Reopen it to send another reply.</div>
              )}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
