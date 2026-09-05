CREATE TABLE IF NOT EXISTS cms_chat_conversations (
  id TEXT PRIMARY KEY,
  visitor_token_hash TEXT NOT NULL UNIQUE,
  visitor_name TEXT NOT NULL DEFAULT 'Website visitor',
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_preview TEXT NOT NULL DEFAULT '',
  last_sender_type TEXT NOT NULL CHECK (last_sender_type IN ('visitor', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cms_chat_conversations_activity_idx
ON cms_chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS cms_chat_conversations_status_activity_idx
ON cms_chat_conversations(status, last_message_at DESC);

CREATE TABLE IF NOT EXISTS cms_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin')),
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES cms_chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cms_chat_messages_conversation_created_idx
ON cms_chat_messages(conversation_id, created_at ASC);
