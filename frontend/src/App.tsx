import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:4000";

type View = "scheduled" | "sent" | "detail" | "compose";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface Sender {
  id: string;
  email: string;
  displayName?: string | null;
}

interface Email {
  id: string;
  recipient: string;
  subject: string;
  body?: string | null;
  scheduledAt: string;
  sentAt?: string | null;
  status: string;
  sender?: { email?: string; displayName?: string | null };
}

type IconName =
  | "search" | "clock" | "check" | "plus" | "filter" | "refresh" | "star"
  | "back" | "paperclip" | "calendar" | "chevron" | "close" | "upload"
  | "logout" | "settings" | "trash" | "archive";

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.55,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "search": return <svg {...common}><circle cx="10.7" cy="10.7" r="6.2" /><path d="m15.4 15.4 4.1 4.1" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="7.4" /><path d="M12 8v4l2.6 1.5" /></svg>;
    case "check": return <svg {...common}><path d="m5 12.5 4 4L19 6.5" /></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "filter": return <svg {...common}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
    case "refresh": return <svg {...common}><path d="M20 11a8 8 0 0 0-14.7-4.3L4 9" /><path d="M4 5v4h4" /></svg>;
    case "star": return <svg {...common}><path d="m12 3.2 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.8l6.2-.9L12 3.2Z" /></svg>;
    case "back": return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
    case "paperclip": return <svg {...common}><path d="m20 11.5-7.6 7.6a5 5 0 0 1-7.1-7.1l8.1-8.1a3.5 3.5 0 1 1 5 5l-8.2 8.2a2 2 0 1 1-2.8-2.8l7.4-7.4" /></svg>;
    case "calendar": return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="1.5" /><path d="M8 3v4M16 3v4M4 9h16" /></svg>;
    case "chevron": return <svg {...common}><path d="m7 9 5 5 5-5" /></svg>;
    case "close": return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case "upload": return <svg {...common}><path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" /></svg>;
    case "logout": return <svg {...common}><path d="M10 17l5-5-5-5M15 12H4M20 5v14" /></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.5 1.5-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.1v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.5-1.5.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H8v-2.1h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.5-1.5.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.1v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.5 1.5-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
    case "trash": return <svg {...common}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
    case "archive": return <svg {...common}><path d="M4 7h16v4H4zM6 11v8h12v-8M9 15h6" /></svg>;
  }
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("scheduled");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const [senderId, setSenderId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("00");
  const [hourlyLimit, setHourlyLimit] = useState("00");

  const [showSendLater, setShowSendLater] = useState(false);
  const [showSenderPanel, setShowSenderPanel] = useState(false);
  const [showAddSender, setShowAddSender] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [senderEmail, setSenderEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [addingSender, setAddingSender] = useState(false);
  const [senderMessage, setSenderMessage] = useState("");

  const leadFileRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const scheduledEmails = useMemo(
    () => (searchQuery.trim() ? searchResults : emails).filter((email) => email.status === "SCHEDULED" || email.status === "PROCESSING"),
    [emails, searchQuery, searchResults]
  );
  const sentEmails = useMemo(
    () => (searchQuery.trim() ? searchResults : emails).filter((email) => email.status === "SENT" || email.status === "FAILED"),
    [emails, searchQuery, searchResults]
  );
  const visibleEmails = view === "sent" ? sentEmails : scheduledEmails;

  const loadSenders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/senders`, { withCredentials: true });
      if (response.data?.success) {
        const list: Sender[] = response.data.senders || [];
        setSenders(list);
        setSenderId((current) => list.some((sender) => sender.id === current) ? current : list[0]?.id || "");
      }
    } catch (error) { console.error("Failed to load senders:", error); }
  };

  const loadEmails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/emails`, { withCredentials: true });
      if (response.data?.success) setEmails(response.data.emails || []);
    } catch (error) { console.error("Failed to load emails:", error); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        if (!response.data?.success) { setUser(null); return; }
        setUser(response.data.user);
        await Promise.all([loadSenders(), loadEmails()]);
      } catch (error) {
        console.error("Failed to load data:", error);
        setUser(null);
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  const handleLogin = () => { window.location.href = `${API_URL}/api/auth/google`; };

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true }); }
    catch (error) { console.error("Logout failed:", error); }
    finally { setUser(null); setSenders([]); setEmails([]); }
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); return; }
    try {
      const response = await axios.get(`${API_URL}/api/emails/search`, { params: { q }, withCredentials: true });
      if (response.data?.success) setSearchResults(response.data.emails || []);
    } catch (error) { console.error("Search failed:", error); setSearchResults([]); }
  };

  const clearCompose = () => {
    setRecipient(""); setRecipients([]); setAttachments([]); setSubject(""); setBody("");
    setScheduledAt(""); setDelaySeconds("00"); setHourlyLimit("00"); setMessage(""); setShowSendLater(false);
  };

  const openCompose = () => {
    setMessage("");
    if (!senderId && senders.length) setSenderId(senders[0].id);
    setView("compose");
  };

  const closeCompose = () => {
    if (submitting) return;
    clearCompose();
    setView("scheduled");
  };

  const handleDeleteSender = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/senders/${id}`, { withCredentials: true });
      await loadSenders();
    } catch (error) { console.error("Failed to delete sender:", error); }
  };

  const handleAddSender = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddingSender(true); setSenderMessage("");
    try {
      const response = await axios.post(`${API_URL}/api/senders`, {
        email: senderEmail, displayName, smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPassword,
      }, { withCredentials: true });
      if (response.data?.success) {
        setSenderMessage("Sender added successfully.");
        setSenderEmail(""); setDisplayName(""); setSmtpUser(""); setSmtpPassword("");
        await loadSenders();
        setShowAddSender(false);
      }
    } catch (error: any) {
      setSenderMessage(error.response?.data?.message || "Failed to add sender.");
    } finally { setAddingSender(false); }
  };

  const handleLeadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const values = String(reader.result || "")
        .split(/[,;\s]+/)
        .map((value) => value.trim())
        .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
      setRecipients([...new Set(values)]);
      setRecipient("");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const addTypedRecipient = () => {
    const values = recipient.split(/[,;\s]+/).map((value) => value.trim()).filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    if (!values.length) return;
    setRecipients((current) => [...new Set([...current, ...values])]);
    setRecipient("");
  };

  const handleRecipientKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === ";") { event.preventDefault(); addTypedRecipient(); }
    if (event.key === "Backspace" && !recipient && recipients.length) setRecipients((current) => current.slice(0, -1));
  };

  const removeRecipient = (email: string) => setRecipients((current) => current.filter((item) => item !== email));

  const handleAttachments = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const setPreset = (minutes: number) => {
    const date = new Date(Date.now() + minutes * 60 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    setScheduledAt(local.toISOString().slice(0, 16));
  };

  const submitSchedule = async () => {
    setMessage("");
    const manual = recipient.split(/[,;\s]+/).map((value) => value.trim()).filter(Boolean);
    const allRecipients = [...new Set([...recipients, ...manual])];

    if (!senderId) { setMessage("Please add a sender account first."); return; }
    if (!allRecipients.length) { setMessage("Please enter a recipient."); return; }
    if (!subject.trim()) { setMessage("Please enter a subject."); return; }
    if (!body.trim()) { setMessage("Please write your message."); return; }
    if (!scheduledAt) { setMessage("Please pick a date & time."); setShowSendLater(true); return; }

    setSubmitting(true);
    try {
      const results: Email[] = [];
      for (const address of allRecipients) {
        const response = await axios.post(`${API_URL}/api/emails/schedule`, {
          senderId,
          recipient: address,
          subject,
          body,
          scheduledAt,
          delaySeconds: Number(delaySeconds) || 0,
          hourlyLimit: Number(hourlyLimit) || 0,
        }, { withCredentials: true });
        if (response.data?.success && response.data.email) results.push(response.data.email as Email);
      }
      setEmails((current) => [...results, ...current.filter((email) => !results.some((item) => item.id === email.id))]);
      clearCompose();
      setView("scheduled");
      await loadEmails();
    } catch (error: any) {
      console.error("Schedule failed:", error);
      setMessage(error.response?.data?.message || "Failed to schedule email.");
    } finally { setSubmitting(false); }
  };

  const openDetail = (email: Email) => { setSelectedEmail(email); setView("detail"); };

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    return (
      <main className="login-screen">
        <section className="login-card">
          <h1>Login</h1>
          <button className="google-button" type="button" onClick={handleLogin}>
            <span className="google-mark">G</span> Login with Google
          </button>
          <div className="login-divider"><span>or sign up through email</span></div>
          <input className="login-input" type="email" placeholder="Email ID" aria-label="Email ID" />
          <input className="login-input" type="password" placeholder="Password" aria-label="Password" />
          <button className="login-button" type="button" onClick={handleLogin}>Login</button>
        </section>
      </main>
    );
  }

  if (view === "compose") {
    const sender = senders.find((item) => item.id === senderId);
    return (
      <main className="compose-page">
        <header className="compose-topbar">
          <button className="compose-back" type="button" onClick={closeCompose}><Icon name="back" size={18} /><span>Compose New Email</span></button>
          <div className="compose-actions">
            <button className="top-icon-button" type="button" onClick={() => attachmentInputRef.current?.click()} aria-label="Attach files"><Icon name="paperclip" size={16} />{attachments.length > 0 && <small>{attachments.length}</small>}</button>
            <button className="top-icon-button" type="button" onClick={() => setShowSendLater((value) => !value)} aria-label="Schedule"><Icon name="clock" size={16} /></button>
            <button className="send-later-top" type="button" disabled={submitting} onClick={() => scheduledAt ? void submitSchedule() : setShowSendLater(true)}>{submitting ? "Sending..." : "Send Later"}</button>
          </div>
        </header>

        <form className="compose-editor" onSubmit={(event) => { event.preventDefault(); void submitSchedule(); }}>
          <div className="field-row from-row">
            <label>From</label>
            <div className="from-control">
              <select value={senderId} onChange={(event) => setSenderId(event.target.value)} required>
                {senders.map((item) => <option key={item.id} value={item.id}>{item.email}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </div>
          </div>

          <div className="field-row to-row">
            <label>To</label>
            <div className="recipient-line">
              <div className="recipient-chips">
                {recipients.map((email) => <span className="recipient-chip" key={email}>{email}<button type="button" onClick={() => removeRecipient(email)} aria-label={`Remove ${email}`}>×</button></span>)}
                <input value={recipient} onChange={(event) => setRecipient(event.target.value)} onKeyDown={handleRecipientKeyDown} onBlur={addTypedRecipient} placeholder="recipient@example.com" />
              </div>
              <button className="upload-list" type="button" onClick={() => leadFileRef.current?.click()}><Icon name="upload" size={12} /> Upload List</button>
              <input ref={leadFileRef} className="hidden-file" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleLeadFile} />
            </div>
          </div>

          <div className="field-row subject-row"><label>Subject</label><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" required /></div>

          <div className="compose-meta">
            <label><span>Delay between 2 emails</span><input type="number" min="0" value={delaySeconds} onChange={(event) => setDelaySeconds(event.target.value)} /></label>
            <label><span>Hourly Limit</span><input type="number" min="0" value={hourlyLimit} onChange={(event) => setHourlyLimit(event.target.value)} /></label>
          </div>

          <div className="message-editor">
            <input ref={attachmentInputRef} className="hidden-file" type="file" multiple onChange={handleAttachments} />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type Your Reply..." required />
            <div className="editor-toolbar" aria-hidden="true">
              <button type="button">↶</button><button type="button">↷</button><span />
              <button type="button">Tᵀ</button><button type="button"><b>B</b></button><button type="button"><i>I</i></button><button type="button"><u>U</u></button><span />
              <button type="button">≡</button><button type="button">↕</button><button type="button">1≡</button><button type="button">•≡</button><button type="button">⇥</button><button type="button">⇤</button><button type="button">“</button><button type="button">▤</button><button type="button">S̶</button>
            </div>
          </div>

          {attachments.length > 0 && <div className="attachments-row">{attachments.map((file) => <div className="attachment-card" key={`${file.name}-${file.lastModified}`}><div className="attachment-preview">{file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt="" /> : "FILE"}</div><div className="attachment-name">{file.name}</div><button type="button" onClick={() => setAttachments((current) => current.filter((item) => item !== file))}>×</button></div>)}</div>}
          {message && <p className="compose-message">{message}</p>}

          {showSendLater && (
            <div className="send-later-popover">
              <strong>Send Later</strong>
              <div className="pick-date-label">Pick date &amp; time</div>
              <div className="date-input-wrap"><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><Icon name="calendar" size={13} /></div>
              <button type="button" onClick={() => setPreset(24 * 60)}>Tomorrow</button>
              <button type="button" onClick={() => setPreset(24 * 60 + 10 * 60)}>Tomorrow, 10:00 AM</button>
              <button type="button" onClick={() => setPreset(24 * 60 + 11 * 60)}>Tomorrow, 11:00 AM</button>
              <button type="button" onClick={() => setPreset(24 * 60 + 15 * 60)}>Tomorrow, 3:00 PM</button>
              <div className="popover-actions"><button type="button" onClick={() => setShowSendLater(false)}>Cancel</button><button type="button" onClick={() => setShowSendLater(false)}>Done</button></div>
            </div>
          )}
          {sender && <span className="sr-only">{sender.email}</span>}
        </form>
      </main>
    );
  }

  if (view === "detail" && selectedEmail) {
    const detailSender = selectedEmail.sender?.displayName || selectedEmail.sender?.email || user.email;
    return (
      <main className="detail-page">
        <header className="detail-topbar">
          <button className="detail-back" type="button" onClick={() => setView(selectedEmail.status === "SENT" || selectedEmail.status === "FAILED" ? "sent" : "scheduled")}><Icon name="back" size={18} /><span>{selectedEmail.subject || "Hello, there!"}</span></button>
          <div className="detail-actions"><button type="button"><Icon name="star" size={15} /></button><button type="button"><Icon name="archive" size={14} /></button><button type="button"><Icon name="trash" size={14} /></button><span className="detail-divider" /><span className="detail-avatar">{initials(user.name)}</span></div>
        </header>
        <section className="message-detail">
          <div className="sender-line"><span className="sender-avatar">{initials(detailSender)}</span><div><strong>{detailSender}</strong><span>to me⌄</span></div><time>{formatDateTime(selectedEmail.sentAt || selectedEmail.scheduledAt)}</time></div>
          <div className="message-copy">
            <p>Hey {user.name.split(" ")[0]},</p>
            <p>{selectedEmail.body || "You've just RECEIVED something"}</p>
            {!selectedEmail.body && <><p>Your coach for world-class performance,</p><p>Grant</p><p><i>P.S. Always remember that you can develop world class technique! 🚀</i></p></>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mail-shell">
      <aside className="mail-sidebar">
        <div className="onb-logo">ONB</div>
        <button className="account-select" type="button" onClick={() => setShowSenderPanel(true)}>
          <div className="account-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}</div>
          <div className="account-copy"><strong>{user.name}</strong><span>{user.email}</span></div>
          <Icon name="chevron" size={11} />
        </button>
        <button className="mail-compose" type="button" onClick={openCompose}><Icon name="plus" size={13} /> Compose</button>
        <div className="core-label">CORE</div>
        <button className={`mail-nav ${view === "scheduled" ? "active" : ""}`} type="button" onClick={() => setView("scheduled")}><Icon name="clock" size={13} /><span>Scheduled</span><b>{scheduledEmails.length}</b></button>
        <button className={`mail-nav ${view === "sent" ? "active" : ""}`} type="button" onClick={() => setView("sent")}><Icon name="check" size={13} /><span>Sent</span><b>{sentEmails.length}</b></button>
        <button className="sender-accounts-link" type="button" onClick={() => setShowSenderPanel(true)}><Icon name="settings" size={14} /><span>Sender accounts</span></button>
        <div className="sidebar-profile"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.email}</span></div><button type="button" onClick={handleLogout} aria-label="Logout"><Icon name="logout" size={14} /></button></div>
      </aside>

      <section className="mail-list">
        <div className="list-toolbar">
          <div className="search-wrap"><Icon name="search" size={12} /><input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); if (!event.target.value.trim()) setSearchResults([]); }} onKeyDown={(event) => { if (event.key === "Enter") void handleSearch(); }} placeholder="Search" /></div>
          <button type="button" className="toolbar-icon" onClick={() => void handleSearch()} aria-label="Filter"><Icon name="filter" size={12} /></button>
          <button type="button" className="toolbar-icon" onClick={() => void loadEmails()} aria-label="Refresh"><Icon name="refresh" size={12} /></button>
        </div>
        <div className="email-list-body">
          {visibleEmails.map((email) => (
            <button className="mail-row" key={email.id} type="button" onClick={() => openDetail(email)}>
              <div className="row-recipient">To: <strong>{email.recipient}</strong></div>
              {view === "scheduled" ? <span className="time-pill"><Icon name="clock" size={9} /> {formatTime(email.scheduledAt)}</span> : <span className="sent-pill">Sent</span>}
              <div className="row-subject"><strong>{email.subject}</strong><span> - {email.body ? email.body.slice(0, 80) : "Thanks for the update. Looks good!"}</span></div>
              <span className="row-star"><Icon name="star" size={13} /></span>
            </button>
          ))}
          {!visibleEmails.length && <div className="mail-empty">No {view} emails.</div>}
        </div>
      </section>

      <button className="header-schedule" type="button" onClick={openCompose}><Icon name="plus" size={12} /> Schedule email</button>

      {showSenderPanel && (
        <div className="drawer-backdrop" onMouseDown={() => setShowSenderPanel(false)}>
          <section className="sender-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><h2>Sender accounts</h2><p>Manage your SMTP sender accounts.</p></div><button type="button" onClick={() => setShowSenderPanel(false)}><Icon name="close" size={16} /></button></header>
            <div className="drawer-body">
              {senders.map((sender) => <div className="drawer-sender" key={sender.id}><div><strong>{sender.email}</strong><span>{sender.displayName || ""}</span></div><button type="button" onClick={() => void handleDeleteSender(sender.id)}>Delete</button></div>)}
              <button className="drawer-add" type="button" onClick={() => setShowAddSender((value) => !value)}>+ Add sender</button>
              {showAddSender && <form className="drawer-form" onSubmit={handleAddSender}>
                <input type="email" placeholder="Sender email" value={senderEmail} onChange={(event) => setSenderEmail(event.target.value)} required />
                <input placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                <input placeholder="SMTP host" value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} required />
                <input type="number" placeholder="SMTP port" value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} required />
                <input type="email" placeholder="SMTP username" value={smtpUser} onChange={(event) => setSmtpUser(event.target.value)} required />
                <input type="password" placeholder="SMTP password" value={smtpPassword} onChange={(event) => setSmtpPassword(event.target.value)} required />
                <button type="submit" disabled={addingSender}>{addingSender ? "Adding..." : "Add sender"}</button>
                {senderMessage && <p>{senderMessage}</p>}
              </form>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
