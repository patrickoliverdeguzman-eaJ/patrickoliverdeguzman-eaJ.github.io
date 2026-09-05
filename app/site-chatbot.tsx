'use client';

import { ArrowUpRight, Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { type SubmitEvent, useRef, useState } from 'react';

type ChatMessage = {
  role: 'assistant' | 'visitor';
  text: string;
  action?: { label: string; href: string };
};

const starters = ['What solutions do you offer?', 'How can you protect our data?', 'Do you provide support?', 'How do I contact you?'];

function answerFor(question: string): Omit<ChatMessage, 'role'> {
  const value = question.toLowerCase();

  if (/backup|recover|recovery|disaster|protect|archive|continuity/.test(value)) {
    return {
      text: 'INFOStorage designs data-protection strategies around your risk profile, including business continuity, disaster recovery, enterprise backup and restore, and digital archiving.',
      action: { label: 'Discuss data protection', href: '/#contact' },
    };
  }

  if (/security|network|firewall|waf|dlp|cyber|isolation/.test(value)) {
    return {
      text: 'The network and security practice covers cybersecurity, identity and access governance, next-generation firewalls, load balancing, WAF and DLP compliance, monitoring, and web isolation.',
      action: { label: 'Explore network & security', href: '/#solutions' },
    };
  }

  if (/storage|server|cloud|oracle|system|platform|virtual|infrastructure/.test(value)) {
    return {
      text: 'INFOStorage brings together enterprise storage, Oracle Cloud Infrastructure and engineered systems, server and storage virtualisation, and hyper-converged infrastructure around the work your organisation needs to do.',
      action: { label: 'Explore systems & platforms', href: '/#solutions' },
    };
  }

  if (/support|helpdesk|maintain|installation|implement|service|consult/.test(value)) {
    return {
      text: 'Yes. INFOStorage provides installation, maintenance and onsite support, helpdesk, consulting and implementation, project management, and systems integration.',
      action: { label: 'View value added services', href: '/#services' },
    };
  }

  if (/partner|client|vendor|brand/.test(value)) {
    return {
      text: 'INFOStorage works across enterprise infrastructure, data protection, cloud, and workplace technology. You can explore selected technology partners and valued clients on the partners page.',
      action: { label: 'View partners & clients', href: '/partners' },
    };
  }

  if (/contact|phone|address|location|quote|talk|speak|sales/.test(value)) {
    return {
      text: 'You can reach INFOStorage at +63 2 8899 4878 or visit 1101 AIC Burgundy Empire Tower, Ortigas Center, Pasig City. Share the outcome you need and the team can recommend a practical next step.',
      action: { label: 'Contact INFOStorage', href: '/#contact' },
    };
  }

  if (/cms|admin|content studio|publish/.test(value)) {
    return {
      text: 'Content Studio is the private workspace for authorised INFOStorage administrators to manage drafts, revisions, media, and publishing. It is not available to public visitors.',
    };
  }

  return {
    text: 'I can help you find the right INFOStorage capability. Ask about systems and cloud, network security, data protection, support services, partners, or how to contact the team.',
  };
}

export default function SiteChatbot() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello — I’m the INFOStorage assistant. I can point you to the right capability, service, or next conversation.',
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const openChat = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'visitor', text }, { role: 'assistant', ...answerFor(text) }]);
    setDraft('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(draft);
  };

  return (
    <aside className="site-chatbot" aria-label="INFOStorage assistant">
      {open && (
        <section id="infostorage-assistant" className="chatbot-panel" aria-live="polite">
          <header className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-mark"><Bot size={18} /></span>
              <span><strong>INFOStorage assistant</strong><small>Enterprise technology guidance</small></span>
            </div>
            <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></button>
          </header>

          <div className="chatbot-thread">
            {messages.map((message, index) => (
              <div className={`chatbot-message chatbot-message-${message.role}`} key={`${message.role}-${index}`}>
                {message.role === 'assistant' && <Bot size={15} aria-hidden="true" />}
                <div>
                  <p>{message.text}</p>
                  {message.action && <a href={message.action.href}>{message.action.label} <ArrowUpRight size={13} /></a>}
                </div>
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="chatbot-starters" aria-label="Suggested questions">
              {starters.map((starter) => <button type="button" key={starter} onClick={() => send(starter)}>{starter}</button>)}
            </div>
          )}

          <form className="chatbot-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="infostorage-chat-input">Ask INFOStorage assistant</label>
            <input ref={inputRef} id="infostorage-chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about INFOStorage…" autoComplete="off" />
            <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Send size={17} /></button>
          </form>
        </section>
      )}

      <button type="button" className="chatbot-launcher" onClick={open ? () => setOpen(false) : openChat} aria-expanded={open} aria-controls="infostorage-assistant">
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span>{open ? 'Close assistant' : 'Ask INFOStorage'}</span>
        {!open && <Sparkles size={15} className="chatbot-sparkle" />}
      </button>
    </aside>
  );
}
