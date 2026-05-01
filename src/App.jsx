import { useState, useEffect, useMemo } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const ADMIN_PIN = "2372";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const CATEGORY_COLORS = {
  "Prompting":        { bg: "#E8F0FE", text: "#1a56db", border: "#93b4f8" },
  "Workflows":        { bg: "#FEF3C7", text: "#92400e", border: "#fbbf24" },
  "Artifacts":        { bg: "#D1FAE5", text: "#065f46", border: "#34d399" },
  "Time-saving":      { bg: "#FDE8F4", text: "#9d174d", border: "#f472b6" },
  "Settings & tools": { bg: "#EDE9FE", text: "#4c1d95", border: "#a78bfa" },
  "General":          { bg: "#F1F5F9", text: "#334155", border: "#94a3b8" },
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const SEED_TIPS = [
  {
    id: "seed-1",
    title: "Use markdown files instead of PDFs for project context",
    content: "When adding context to a Project or chat, use .md files rather than PDFs. Markdowns are more token-efficient and easier for Claude to read and parse. A well-structured markdown with your scenario, standards, and key facts will consistently give you better outputs than a PDF of the same content.",
    category: "Workflows",
    tags: ["projects", "context", "markdown", "token efficiency"],
    submitter: "Dani",
    date: "2025-04-15",
    votes: 8,
  },
  {
    id: "seed-2",
    title: "Ask Claude to improve your own prompts",
    content: "If a prompt isn't giving you the result you expected, paste it into Claude and explain what was wrong with the output. Claude can usually diagnose the issue and suggest a better version. You don't need to figure out prompt engineering yourself — use Claude to do it for you.",
    category: "Prompting",
    tags: ["prompting", "iteration", "optimisation"],
    submitter: "Luke",
    date: "2025-04-17",
    votes: 11,
  },
  {
    id: "seed-3",
    title: "Add a CLAUDE.md file to your Claude Code directories",
    content: "If you're using Claude Code, add a CLAUDE.md file to the directories you're working in. It lets you set standing instructions — what the data is, where files live, what your coding standards are — so you're not repeating yourself every session. It needs to be uppercase CLAUDE on Mac/Linux.",
    category: "Settings & tools",
    tags: ["claude code", "CLAUDE.md", "memory", "developer"],
    submitter: "Sheldon",
    date: "2025-04-18",
    votes: 6,
  },
  {
    id: "seed-4",
    title: "Watch Claude's thinking to catch it going off track",
    content: "When Claude shows its reasoning (the thinking panel), it's worth a quick scan — especially for complex tasks. You can see if it's heading down the wrong path before it wastes time on a bad answer. It also self-corrects out loud, which is genuinely useful to observe once or twice so you understand how it works.",
    category: "Workflows",
    tags: ["reasoning", "thinking", "quality", "agents"],
    submitter: "Luke",
    date: "2025-04-22",
    votes: 9,
  },
  {
    id: "seed-5",
    title: "Learn Claude properly with the free Anthropic Academy courses",
    content: "Anthropic have a free course platform at anthropic.skilljar.com. The lessons are around 20 minutes each and cover everything from basic usage to Claude Code and Cowork. Worth doing even if you're already using Claude daily — there are usually a few things that change how you work.",
    category: "General",
    tags: ["learning", "courses", "anthropic academy"],
    submitter: "Euan",
    date: "2025-04-23",
    votes: 7,
  },
];

const genId = () => `tip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fmt = d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

async function dbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS, ...options });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

async function loadTips() {
  return dbFetch("tips?order=created_at.desc");
}

async function insertTip(tip) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tips`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify(tip),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteTip(id) {
  return dbFetch(`tips?id=eq.${id}`, { method: "DELETE" });
}

async function incrementVote(id, currentVotes) {
  return dbFetch(`tips?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ votes: currentVotes + 1 }),
  });
}

async function seedIfEmpty(tips) {
  if (tips.length > 0) return tips;
  await Promise.all(SEED_TIPS.map(t => insertTip(t)));
  return loadTips();
}

const css = `
  :root { --navy: #001E41; --orange: #F35321; --radius: 10px; --font: 'Inter', system-ui, sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); }
  .kb-wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; }
  .kb-header { border-bottom: 3px solid var(--navy); padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .kb-label { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--orange); margin-bottom: 4px; }
  .kb-title { font-size: 26px; font-weight: 800; line-height: 1.15; }
  .kb-count { font-size: 13px; color: #64748b; margin-top: 4px; }
  .btn-submit { background: var(--orange); color: #fff; border: none; border-radius: var(--radius); padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-submit:hover { opacity: .88; }
  .btn-browse { background: var(--navy); color: #fff; border: none; border-radius: var(--radius); padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-browse:hover { opacity: .88; }
  .search-row { margin-bottom: 14px; }
  .search-input { width: 100%; padding: 10px 14px; border-radius: var(--radius); border: 1.5px solid #e2e8f0; background: #fff; font-size: 14px; outline: none; }
  .search-input:focus { border-color: var(--navy); }
  .filter-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .pill { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; }
  .pill-all.active { background: var(--navy); color: #fff; border-color: var(--navy); }
  .tag-cloud-wrap { margin-bottom: 20px; }
  .tag-cloud-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 8px; }
  .tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-chip { font-size: 12px; padding: 3px 10px; border-radius: 12px; background: #fff; border: 1.5px solid #e2e8f0; color: #64748b; cursor: pointer; }
  .tag-chip:hover { border-color: var(--orange); color: var(--orange); }
  .tag-chip.active { background: var(--orange); color: #fff; border-color: var(--orange); }
  .cards { display: flex; flex-direction: column; gap: 14px; }
  .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: var(--radius); display: flex; overflow: hidden; transition: box-shadow .15s, transform .15s; }
  .card:hover { box-shadow: 0 6px 20px rgba(0,30,65,.11); transform: translateY(-1px); }
  .card-accent { width: 5px; flex-shrink: 0; }
  .card-body { flex: 1; padding: 18px 20px; }
  .card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .cat-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; letter-spacing: .04em; white-space: nowrap; }
  .card-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .card-content { font-size: 14px; line-height: 1.65; color: #475569; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .card-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer; }
  .card-tag:hover { border-color: var(--orange); color: var(--orange); }
  .card-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .card-submitter, .card-date { font-size: 12px; color: #94a3b8; }
  .vote-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748b; }
  .vote-btn:hover, .vote-btn.voted { background: #fff2ee; border-color: var(--orange); color: var(--orange); }
  .admin-bar { display: flex; align-items: center; gap: 8px; }
  .admin-pin-input { padding: 6px 10px; border-radius: 8px; border: 1.5px solid #e2e8f0; font-size: 13px; width: 110px; outline: none; }
  .admin-pin-input:focus { border-color: var(--navy); }
  .btn-admin { background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748b; display: flex; align-items: center; gap: 5px; }
  .btn-admin.unlocked { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
  .admin-pin-error { font-size: 11px; color: #dc2626; }
  .btn-delete { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 16px; padding: 4px 6px; border-radius: 6px; }
  .btn-delete:hover { color: #dc2626; background: #fef2f2; }
  .delete-confirm { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding: 8px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
  .delete-confirm-msg { font-size: 12px; color: #dc2626; flex: 1; }
  .btn-confirm-del { background: #dc2626; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .btn-confirm-cancel { background: none; border: 1.5px solid #fecaca; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 600; cursor: pointer; color: #dc2626; }
  .empty { text-align: center; padding: 48px 24px; color: #94a3b8; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius); padding: 14px 18px; margin-bottom: 18px; color: #dc2626; font-size: 13px; }
  .loading { text-align: center; padding: 60px 24px; color: #94a3b8; font-size: 15px; }
  .form-wrap { background: #fff; border: 1.5px solid #e2e8f0; border-radius: var(--radius); padding: 28px; }
  .form-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .form-label span { color: var(--orange); }
  .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 14px; font-family: var(--font); outline: none; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--navy); }
  .form-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .form-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  .form-error { font-size: 11px; color: #dc2626; margin-top: 4px; }
  .form-actions { display: flex; gap: 10px; margin-top: 24px; }
  .btn-save { background: var(--orange); color: #fff; border: none; border-radius: var(--radius); padding: 11px 24px; font-size: 14px; font-weight: 700; cursor: pointer; }
  .btn-save:disabled { opacity: .5; cursor: not-allowed; }
  .btn-cancel { background: none; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: var(--radius); padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
`;

export default function App() {
  const [tips, setTips] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("browse");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [activeTag, setActiveTag] = useState("");
  const [votedIds, setVotedIds] = useState(new Set());
  const [adminMode, setAdminMode] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", content: "", category: "Prompting", tags: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        let data = await loadTips();
        data = await seedIfEmpty(data);
        setTips(data);
      } catch (e) {
        setError(`Couldn't load tips: ${e.message}`);
      }
      try {
        const v = localStorage.getItem("ss_voted");
        if (v) setVotedIds(new Set(JSON.parse(v)));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const catCounts = useMemo(() => {
    const c = {};
    tips.forEach(t => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, [tips]);

  const allTags = useMemo(() => {
    const freq = {};
    tips.forEach(t => (t.tags || []).forEach(tag => { freq[tag] = (freq[tag] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([tag]) => tag);
  }, [tips]);

  const filtered = useMemo(() => {
    let res = tips;
    if (activeCat !== "All") res = res.filter(t => t.category === activeCat);
    if (activeTag) res = res.filter(t => (t.tags || []).includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        (t.tags || []).some(tg => tg.toLowerCase().includes(q)) ||
        t.submitter.toLowerCase().includes(q)
      );
    }
    return res;
  }, [tips, activeCat, activeTag, search]);

  const handleVote = async (id) => {
    if (votedIds.has(id)) return;
    const tip = tips.find(t => t.id === id);
    try {
      await incrementVote(id, tip.votes);
      setTips(prev => prev.map(t => t.id === id ? { ...t, votes: t.votes + 1 } : t));
      const next = new Set([...votedIds, id]);
      setVotedIds(next);
      localStorage.setItem("ss_voted", JSON.stringify([...next]));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteTip(id);
      setTips(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteId(null);
    } catch (e) { setError(`Delete failed: ${e.message}`); }
  };

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? "" : tag);
    setView("browse");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.content.trim()) e.content = "Content is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const tip = {
        id: genId(),
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags: form.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
        submitter: form.name.trim(),
        date: new Date().toISOString().slice(0, 10),
        votes: 0,
      };
      await insertTip(tip);
      setTips(prev => [tip, ...prev]);
      setForm({ name: "", title: "", content: "", category: "Prompting", tags: "" });
      setErrors({});
      setView("browse");
      setActiveCat("All");
      setActiveTag("");
      setSearch("");
    } catch (e) { setError(`Couldn't save tip: ${e.message}`); }
    setSaving(false);
  };

  const handlePinSubmit = () => {
    if (pinValue === ADMIN_PIN) {
      setAdminMode(true); setShowPinInput(false); setPinValue(""); setPinError(false);
    } else { setPinError(true); setPinValue(""); }
  };

  if (!loaded) return <><style>{css}</style><div className="kb-wrap"><div className="loading">Loading tips…</div></div></>;

  return (
    <>
      <style>{css}</style>
      <div className="kb-wrap">
        <header className="kb-header">
          <div>
            <div className="kb-label">SmartSurvey internal</div>
            <div className="kb-title">Claude tips &amp; tricks</div>
            <div className="kb-count">{tips.length} tip{tips.length !== 1 ? "s" : ""} shared by the team</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {view === "browse" && (
              <div className="admin-bar">
                {adminMode ? (
                  <button className="btn-admin unlocked" onClick={() => { setAdminMode(false); setConfirmDeleteId(null); }}>🔓 Admin on — lock</button>
                ) : showPinInput ? (
                  <>
                    <input className="admin-pin-input" type="password" placeholder="Enter PIN…" value={pinValue} autoFocus
                      onChange={e => { setPinValue(e.target.value); setPinError(false); }}
                      onKeyDown={e => { if (e.key === "Enter") handlePinSubmit(); if (e.key === "Escape") { setShowPinInput(false); setPinValue(""); setPinError(false); } }}
                    />
                    <button className="btn-admin" onClick={handlePinSubmit}>Go</button>
                    {pinError && <span className="admin-pin-error">Wrong PIN</span>}
                  </>
                ) : (
                  <button className="btn-admin" onClick={() => setShowPinInput(true)}>🔒 Admin</button>
                )}
              </div>
            )}
            {view === "browse"
              ? <button className="btn-submit" onClick={() => setView("submit")}>+ Share a tip</button>
              : <button className="btn-browse" onClick={() => { setView("browse"); setErrors({}); }}>← Browse tips</button>
            }
          </div>
        </header>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {view === "browse" && (
          <>
            <div className="search-row">
              <input className="search-input" placeholder="Search tips, tags, or people…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-pills">
              <button className={`pill pill-all${activeCat === "All" ? " active" : ""}`} onClick={() => setActiveCat("All")}>All ({tips.length})</button>
              {CATEGORIES.map(cat => {
                const col = CATEGORY_COLORS[cat];
                const isActive = activeCat === cat;
                return (
                  <button key={cat} className="pill"
                    style={isActive ? { background: col.text, color: "#fff", borderColor: col.text } : { background: col.bg, color: col.text, borderColor: col.border }}
                    onClick={() => setActiveCat(prev => prev === cat ? "All" : cat)}
                  >{cat} ({catCounts[cat] || 0})</button>
                );
              })}
            </div>
            {allTags.length > 0 && (
              <div className="tag-cloud-wrap">
                <div className="tag-cloud-label">Filter by tag</div>
                <div className="tag-cloud">
                  {allTags.map(tag => (
                    <button key={tag} className={`tag-chip${activeTag === tag ? " active" : ""}`} onClick={() => handleTagClick(tag)}>{tag}</button>
                  ))}
                </div>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="empty"><div className="empty-icon">🔍</div><div>No tips match your filters.</div></div>
            ) : (
              <div className="cards">
                {filtered.map(tip => {
                  const col = CATEGORY_COLORS[tip.category] || CATEGORY_COLORS["General"];
                  const voted = votedIds.has(tip.id);
                  return (
                    <div key={tip.id} className="card">
                      <div className="card-accent" style={{ background: col.text }} />
                      <div className="card-body">
                        <div className="card-top">
                          <span className="cat-badge" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{tip.category}</span>
                        </div>
                        <div className="card-title">{tip.title}</div>
                        <div className="card-content">{tip.content}</div>
                        <div className="card-footer">
                          <div className="card-tags">
                            {(tip.tags || []).map(tag => (
                              <button key={tag} className="card-tag" onClick={() => handleTagClick(tag)}>#{tag}</button>
                            ))}
                          </div>
                          <div className="card-meta">
                            <span className="card-submitter">👤 {tip.submitter}</span>
                            <span className="card-date">{fmt(tip.date)}</span>
                            <button className={`vote-btn${voted ? " voted" : ""}`} onClick={() => handleVote(tip.id)}>
                              👍 {tip.votes} helpful
                            </button>
                            {adminMode && (
                              <button className="btn-delete" onClick={() => setConfirmDeleteId(confirmDeleteId === tip.id ? null : tip.id)}>🗑</button>
                            )}
                          </div>
                        </div>
                        {confirmDeleteId === tip.id && (
                          <div className="delete-confirm">
                            <span className="delete-confirm-msg">Remove this tip permanently?</span>
                            <button className="btn-confirm-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button className="btn-confirm-del" onClick={() => handleDelete(tip.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === "submit" && (
          <div className="form-wrap">
            <div className="form-title">Share a tip with the team</div>
            <div className="form-group">
              <label className="form-label">Your name <span>*</span></label>
              <input className="form-input" placeholder="e.g. Dani" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }} />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Tip title <span>*</span></label>
              <input className="form-input" placeholder="A short, descriptive title" value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: "" })); }} />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Tip content <span>*</span></label>
              <textarea className="form-textarea" placeholder="Explain the tip clearly — include context, examples, or caveats." value={form.content}
                onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setErrors(er => ({ ...er, content: "" })); }} />
              {errors.content && <div className="form-error">{errors.content}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" placeholder="e.g. prompting, context window, drafting" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              <div className="form-hint">Comma-separated. Keep them short and lowercase.</div>
            </div>
            <div className="form-actions">
              <button className="btn-save" onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save tip"}</button>
              <button className="btn-cancel" onClick={() => { setView("browse"); setErrors({}); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
