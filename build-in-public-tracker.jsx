import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "bip-tracker-data";

const DEFAULT_DATA = {
  goals: [],
  updates: [],
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function calcStreak(checkIns = []) {
  if (!checkIns.length) return 0;
  const sorted = [...new Set(checkIns)].sort().reverse();
  let streak = 0;
  let cursor = new Date(today());
  for (const d of sorted) {
    const diff = Math.round((cursor - new Date(d)) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = new Date(d);
    } else break;
  }
  return streak;
}

const EMOJIS = ["🚀", "🔥", "⚡", "🎯", "💡", "🛠️", "📦", "🌱", "💎", "🧪"];

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0a;
    --surface: #111;
    --border: #222;
    --border-bright: #333;
    --text: #e8e8e8;
    --muted: #555;
    --accent: #00ff88;
    --accent2: #ff4d6d;
    --accent3: #ffcc00;
    --mono: 'Space Mono', monospace;
    --display: 'Bebas Neue', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--mono); font-size: 13px; }

  #root { min-height: 100vh; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

  .app {
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 16px 80px;
  }

  /* HEADER */
  .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 2px solid var(--accent);
    padding-bottom: 12px;
    margin-bottom: 32px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .header-left {}
  .logo {
    font-family: var(--display);
    font-size: clamp(36px, 8vw, 64px);
    letter-spacing: 2px;
    color: var(--text);
    line-height: 1;
  }
  .logo span { color: var(--accent); }
  .tagline { color: var(--muted); font-size: 11px; letter-spacing: 0.1em; margin-top: 4px; }
  .header-stats {
    display: flex;
    gap: 24px;
    align-items: flex-end;
  }
  .stat-pill {
    text-align: right;
  }
  .stat-pill .val {
    font-family: var(--display);
    font-size: 28px;
    color: var(--accent3);
    line-height: 1;
  }
  .stat-pill .lbl { color: var(--muted); font-size: 10px; letter-spacing: 0.12em; }

  /* TABS */
  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .tab {
    background: none;
    border: none;
    color: var(--muted);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 20px 10px;
    cursor: pointer;
    position: relative;
    transition: color 0.15s;
  }
  .tab:hover { color: var(--text); }
  .tab.active {
    color: var(--accent);
  }
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 2px;
    background: var(--accent);
  }

  /* SECTION LABEL */
  .section-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
  }

  /* GOAL CARD */
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .goal-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    position: relative;
    transition: border-color 0.15s, transform 0.15s;
    cursor: default;
  }
  .goal-card:hover {
    border-color: var(--border-bright);
    transform: translateY(-1px);
  }
  .goal-card.completed { border-color: #1a3d2e; }
  .goal-card.completed .goal-title { color: var(--muted); text-decoration: line-through; }

  .goal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }
  .goal-emoji { font-size: 20px; flex-shrink: 0; }
  .goal-title { font-size: 13px; font-weight: 700; flex: 1; line-height: 1.3; }
  .goal-actions { display: flex; gap: 4px; }
  .icon-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    width: 24px; height: 24px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .icon-btn:hover { border-color: var(--accent2); color: var(--accent2); }
  .icon-btn.check:hover { border-color: var(--accent); color: var(--accent); }

  .progress-bar-wrap {
    background: #1a1a1a;
    border-radius: 2px;
    height: 4px;
    margin: 10px 0 8px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--accent);
    transition: width 0.4s ease;
  }

  .goal-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--muted);
  }
  .streak-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--accent3);
    font-weight: 700;
  }
  .streak-fire { font-size: 12px; }

  .checkin-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    padding: 4px 8px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.12s;
    margin-top: 10px;
    width: 100%;
    text-transform: uppercase;
  }
  .checkin-btn:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: #000;
  }
  .checkin-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .checkin-btn.checked {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* ADD FORM */
  .add-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 28px;
  }
  .form-title {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .form-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .form-input {
    background: #0d0d0d;
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 8px 12px;
    flex: 1;
    min-width: 180px;
    transition: border-color 0.12s;
    outline: none;
  }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .form-select {
    background: #0d0d0d;
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 8px 12px;
    cursor: pointer;
    outline: none;
  }
  .form-select:focus { border-color: var(--accent); }

  .submit-btn {
    background: var(--accent);
    border: none;
    border-radius: 3px;
    color: #000;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 9px 20px;
    cursor: pointer;
    transition: opacity 0.12s;
  }
  .submit-btn:hover { opacity: 0.85; }

  .progress-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: var(--muted);
  }
  .progress-input-row input[type=range] {
    flex: 1;
    accent-color: var(--accent);
  }
  .pct-label { color: var(--accent3); font-weight: 700; min-width: 36px; }

  /* UPDATES FEED */
  .updates-feed { display: flex; flex-direction: column; gap: 0; }
  .update-item {
    display: flex;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
    animation: slideIn 0.25s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .update-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    margin-top: 4px;
    flex-shrink: 0;
  }
  .update-dot.checkin { background: var(--accent3); }
  .update-dot.complete { background: var(--accent2); }
  .update-body { flex: 1; }
  .update-text { font-size: 13px; line-height: 1.5; }
  .update-meta { color: var(--muted); font-size: 11px; margin-top: 3px; }
  .update-tag {
    display: inline-block;
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 2px;
    font-size: 10px;
    color: var(--muted);
    margin-left: 6px;
    vertical-align: middle;
  }
  .delete-btn {
    background: none;
    border: none;
    color: var(--border-bright);
    cursor: pointer;
    font-size: 14px;
    padding: 0 4px;
    align-self: flex-start;
    transition: color 0.12s;
  }
  .delete-btn:hover { color: var(--accent2); }

  /* UPDATE FORM */
  .update-form {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .update-form textarea {
    flex: 1;
    min-width: 220px;
    background: #0d0d0d;
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 10px 12px;
    resize: vertical;
    min-height: 64px;
    outline: none;
    transition: border-color 0.12s;
  }
  .update-form textarea:focus { border-color: var(--accent); }
  .update-form textarea::placeholder { color: var(--muted); }
  .update-form-right { display: flex; flex-direction: column; gap: 8px; }

  /* HEATMAP */
  .heatmap-section { margin-bottom: 28px; }
  .heatmap { display: flex; flex-wrap: wrap; gap: 3px; }
  .heatmap-cell {
    width: 12px; height: 12px;
    border-radius: 2px;
    background: #1a1a1a;
    transition: background 0.15s;
  }
  .heatmap-cell.level-1 { background: #003d22; }
  .heatmap-cell.level-2 { background: #007a44; }
  .heatmap-cell.level-3 { background: #00b866; }
  .heatmap-cell.level-4 { background: var(--accent); }

  /* EMPTY STATE */
  .empty {
    text-align: center;
    color: var(--muted);
    padding: 48px 0;
    font-size: 12px;
    letter-spacing: 0.1em;
  }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }

  /* TOAST */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--accent);
    color: #000;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    padding: 10px 18px;
    border-radius: 3px;
    z-index: 999;
    animation: toastIn 0.2s ease;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* TICKER */
  .ticker {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    height: 28px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
  }
  .ticker-inner {
    display: flex;
    gap: 48px;
    animation: ticker 18s linear infinite;
    white-space: nowrap;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 0.1em;
  }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-item span { color: var(--accent3); }
`;

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [tab, setTab] = useState("goals");
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // New goal form
  const [newGoal, setNewGoal] = useState({ title: "", emoji: "🚀", target: 100, progress: 0 });
  // New update form
  const [newUpdate, setNewUpdate] = useState({ text: "", goalId: "" });

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) setData(JSON.parse(res.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  // Save to storage
  const save = useCallback(async (next) => {
    setData(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // Goals
  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    const goal = {
      id: generateId(),
      title: newGoal.title.trim(),
      emoji: newGoal.emoji,
      target: Number(newGoal.target) || 100,
      progress: Number(newGoal.progress) || 0,
      checkIns: [],
      createdAt: today(),
      completedAt: null,
    };
    save({ ...data, goals: [goal, ...data.goals] });
    setNewGoal({ title: "", emoji: "🚀", target: 100, progress: 0 });
    showToast("Goal added 🎯");
  };

  const checkIn = (goalId) => {
    const todayStr = today();
    const goals = data.goals.map((g) => {
      if (g.id !== goalId) return g;
      if (g.checkIns.includes(todayStr)) return g;
      return { ...g, checkIns: [...g.checkIns, todayStr] };
    });
    save({ ...data, goals });
    // Add auto update
    const goal = data.goals.find((g) => g.id === goalId);
    if (goal) {
      const update = {
        id: generateId(),
        type: "checkin",
        text: `Checked in on "${goal.title}"`,
        goalId,
        createdAt: new Date().toISOString(),
      };
      save({ goals, updates: [update, ...data.updates] });
    }
    showToast("🔥 Streak kept alive!");
  };

  const updateProgress = (goalId, progress) => {
    const goals = data.goals.map((g) => {
      if (g.id !== goalId) return g;
      const completed = progress >= g.target;
      return {
        ...g,
        progress,
        completedAt: completed && !g.completedAt ? today() : g.completedAt,
      };
    });
    save({ ...data, goals });
  };

  const deleteGoal = (goalId) => {
    save({ ...data, goals: data.goals.filter((g) => g.id !== goalId) });
    showToast("Goal removed");
  };

  // Updates
  const addUpdate = () => {
    if (!newUpdate.text.trim()) return;
    const update = {
      id: generateId(),
      type: "update",
      text: newUpdate.text.trim(),
      goalId: newUpdate.goalId,
      createdAt: new Date().toISOString(),
    };
    save({ ...data, updates: [update, ...data.updates] });
    setNewUpdate({ text: "", goalId: "" });
    showToast("Update posted ✨");
  };

  const deleteUpdate = (id) => {
    save({ ...data, updates: data.updates.filter((u) => u.id !== id) });
  };

  // Stats
  const totalStreak = data.goals.reduce((max, g) => Math.max(max, calcStreak(g.checkIns)), 0);
  const completed = data.goals.filter((g) => g.completedAt).length;

  // Heatmap: last 70 days of check-in activity
  const heatmapDays = Array.from({ length: 70 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (69 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayActivity = {};
  data.goals.forEach((g) =>
    (g.checkIns || []).forEach((d) => {
      dayActivity[d] = (dayActivity[d] || 0) + 1;
    })
  );

  const tickerItems = [
    { label: "GOALS ACTIVE", val: data.goals.filter((g) => !g.completedAt).length },
    { label: "TOP STREAK", val: `${totalStreak}d` },
    { label: "UPDATES POSTED", val: data.updates.length },
    { label: "COMPLETED", val: completed },
    { label: "BUILDING IN PUBLIC", val: "ON" },
  ];

  if (!loaded) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              BUILD<span>.</span>IN<span>.</span>PUBLIC
            </div>
            <div className="tagline">// track • ship • share • repeat</div>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <div className="val">{data.goals.filter((g) => !g.completedAt).length}</div>
              <div className="lbl">Active Goals</div>
            </div>
            <div className="stat-pill">
              <div className="val">{totalStreak}</div>
              <div className="lbl">Best Streak</div>
            </div>
            <div className="stat-pill">
              <div className="val">{completed}</div>
              <div className="lbl">Shipped</div>
            </div>
          </div>
        </header>

        {/* Ticker */}
        <div className="ticker">
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div className="ticker-item" key={i}>
                {item.label} &nbsp;→&nbsp; <span>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["goals", "updates", "heatmap"].map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── GOALS TAB ── */}
        {tab === "goals" && (
          <>
            {/* Add goal form */}
            <div className="add-form">
              <div className="form-title">+ New Goal</div>
              <div className="form-row">
                <select
                  className="form-select"
                  value={newGoal.emoji}
                  onChange={(e) => setNewGoal({ ...newGoal, emoji: e.target.value })}
                >
                  {EMOJIS.map((em) => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
                <input
                  className="form-input"
                  placeholder="What are you building?"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Target (e.g. 100)"
                  style={{ maxWidth: 130 }}
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                />
              </div>
              <div className="progress-input-row" style={{ marginBottom: 12 }}>
                <span>Starting progress:</span>
                <input
                  type="range"
                  min={0}
                  max={newGoal.target || 100}
                  value={newGoal.progress}
                  onChange={(e) => setNewGoal({ ...newGoal, progress: Number(e.target.value) })}
                />
                <span className="pct-label">
                  {Math.round((newGoal.progress / (newGoal.target || 100)) * 100)}%
                </span>
              </div>
              <button className="submit-btn" onClick={addGoal}>
                Add Goal →
              </button>
            </div>

            {/* Goals grid */}
            <div className="section-label">Active Goals ({data.goals.filter(g => !g.completedAt).length})</div>
            {data.goals.filter((g) => !g.completedAt).length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🛠️</div>
                No active goals yet. Start building something!
              </div>
            ) : (
              <div className="goals-grid">
                {data.goals
                  .filter((g) => !g.completedAt)
                  .map((goal) => {
                    const streak = calcStreak(goal.checkIns);
                    const checkedToday = goal.checkIns?.includes(today());
                    const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
                    return (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        streak={streak}
                        checkedToday={checkedToday}
                        pct={pct}
                        onCheckIn={() => checkIn(goal.id)}
                        onDelete={() => deleteGoal(goal.id)}
                        onProgressChange={(v) => updateProgress(goal.id, v)}
                      />
                    );
                  })}
              </div>
            )}

            {data.goals.filter((g) => g.completedAt).length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 24 }}>
                  Shipped ({data.goals.filter(g => g.completedAt).length})
                </div>
                <div className="goals-grid">
                  {data.goals
                    .filter((g) => g.completedAt)
                    .map((goal) => {
                      const streak = calcStreak(goal.checkIns);
                      const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
                      return (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          streak={streak}
                          checkedToday={false}
                          pct={pct}
                          onCheckIn={() => {}}
                          onDelete={() => deleteGoal(goal.id)}
                          onProgressChange={() => {}}
                          completed
                        />
                      );
                    })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── UPDATES TAB ── */}
        {tab === "updates" && (
          <>
            <div className="update-form">
              <textarea
                placeholder="What did you ship today? Share your progress..."
                value={newUpdate.text}
                onChange={(e) => setNewUpdate({ ...newUpdate, text: e.target.value })}
              />
              <div className="update-form-right">
                <select
                  className="form-select"
                  value={newUpdate.goalId}
                  onChange={(e) => setNewUpdate({ ...newUpdate, goalId: e.target.value })}
                >
                  <option value="">No goal tag</option>
                  {data.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.title}
                    </option>
                  ))}
                </select>
                <button className="submit-btn" onClick={addUpdate}>
                  Post Update
                </button>
              </div>
            </div>

            <div className="section-label">Feed ({data.updates.length} updates)</div>
            {data.updates.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📢</div>
                No updates yet. Ship something and tell the world!
              </div>
            ) : (
              <div className="updates-feed">
                {data.updates.map((u) => {
                  const linkedGoal = data.goals.find((g) => g.id === u.goalId);
                  return (
                    <div className="update-item" key={u.id}>
                      <div className={`update-dot ${u.type}`} />
                      <div className="update-body">
                        <div className="update-text">
                          {u.text}
                          {linkedGoal && (
                            <span className="update-tag">
                              {linkedGoal.emoji} {linkedGoal.title}
                            </span>
                          )}
                        </div>
                        <div className="update-meta">{daysAgo(u.createdAt)}</div>
                      </div>
                      <button className="delete-btn" onClick={() => deleteUpdate(u.id)}>
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── HEATMAP TAB ── */}
        {tab === "heatmap" && (
          <>
            <div className="section-label">Check-in Activity — Last 70 Days</div>
            <div className="heatmap-section">
              <div className="heatmap">
                {heatmapDays.map((d) => {
                  const count = dayActivity[d] || 0;
                  const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
                  return (
                    <div
                      key={d}
                      className={`heatmap-cell ${level > 0 ? `level-${level}` : ""}`}
                      title={`${d}: ${count} check-in${count !== 1 ? "s" : ""}`}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div
                    key={l}
                    className={`heatmap-cell ${l > 0 ? `level-${l}` : ""}`}
                    style={{ flexShrink: 0 }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>

            <div className="section-label" style={{ marginTop: 24 }}>Goal Streaks</div>
            {data.goals.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔥</div>
                Add goals and check in daily to build streaks!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[...data.goals]
                  .sort((a, b) => calcStreak(b.checkIns) - calcStreak(a.checkIns))
                  .map((goal) => {
                    const streak = calcStreak(goal.checkIns);
                    const totalCheckins = goal.checkIns?.length || 0;
                    return (
                      <div
                        key={goal.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "12px 0",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{goal.emoji}</span>
                        <span style={{ flex: 1, fontSize: 13 }}>{goal.title}</span>
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>
                          {totalCheckins} total check-ins
                        </span>
                        <span
                          style={{
                            color: streak > 0 ? "var(--accent3)" : "var(--muted)",
                            fontWeight: 700,
                            fontSize: 13,
                            minWidth: 60,
                            textAlign: "right",
                          }}
                        >
                          {streak > 0 ? `🔥 ${streak}d` : "—"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ── GoalCard Component ────────────────────────────────────────────────────────
function GoalCard({ goal, streak, checkedToday, pct, onCheckIn, onDelete, onProgressChange, completed }) {
  return (
    <div className={`goal-card ${completed ? "completed" : ""}`}>
      <div className="goal-header">
        <span className="goal-emoji">{goal.emoji}</span>
        <span className="goal-title">{goal.title}</span>
        <div className="goal-actions">
          <button className="icon-btn" onClick={onDelete} title="Remove">×</button>
        </div>
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="goal-meta">
        <span>
          {goal.progress} / {goal.target}
          <span style={{ color: "var(--muted)", marginLeft: 4 }}>({pct}%)</span>
        </span>
        {streak > 0 && (
          <span className="streak-badge">
            <span className="streak-fire">🔥</span> {streak}d
          </span>
        )}
      </div>

      {!completed && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            <span>Progress:</span>
            <input
              type="range"
              min={0}
              max={goal.target}
              value={goal.progress}
              style={{ flex: 1, accentColor: "var(--accent)" }}
              onChange={(e) => onProgressChange(Number(e.target.value))}
            />
          </div>
          <button
            className={`checkin-btn ${checkedToday ? "checked" : ""}`}
            onClick={onCheckIn}
            disabled={checkedToday}
          >
            {checkedToday ? "✓ Checked in today" : "Check in today"}
          </button>
        </div>
      )}

      {completed && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em" }}>
          ✓ SHIPPED {goal.completedAt}
        </div>
      )}
    </div>
  );
}
