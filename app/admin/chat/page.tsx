'use client';

import { CMS_API } from '@/lib/cms-api';

import { useEffect, useState } from 'react';

interface Conversation {
  id: string;
  visitorName: string;
  visitorEmail: string | null;
  status: string;
  lastMessagePreview: string;
  lastSenderType: string;
  lastMessageAt: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    fetch(`${CMS_API}/v1/admin/conversations`, { headers: { authorization: `Bearer ${token}` } })
      .then((res) => res.json() as Promise<ConversationsResponse>)
      .then((data) => setConversations(data.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-empty"><p>Loading conversations...</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Chat Conversations</h2>
      <div className="admin-card">
        {conversations.length === 0 ? (
          <div className="admin-empty"><p>No conversations yet.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Visitor</th><th>Email</th><th>Status</th><th>Last Message</th><th>Date</th></tr></thead>
            <tbody>
              {conversations.map((conv) => (
                <tr key={conv.id}>
                  <td>{conv.visitorName}</td>
                  <td>{conv.visitorEmail ?? '—'}</td>
                  <td><span className={`admin-badge admin-badge-${conv.status === 'open' ? 'published' : 'archived'}`}>{conv.status}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessagePreview}</td>
                  <td>{new Date(conv.lastMessageAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
