import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "bip-tracker-v2";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "just now";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}
function calcStreak(checkIns = []) {
  if (!checkIns.length) return 0;
  const sorted = [...new Set(checkIns)].sort().reverse();
  let streak = 0;
  let cursor = new Date(today());
  for (const d of sorted) {
    const diff = Math.round((cursor - new Date(d)) / 86400000);
    if (diff === 0 || diff === 1) { streak++; cursor = new Date(d); }
    else break;
  }
  return streak;
}

const EMOJIS = ["🚀","🔥","⚡","🎯","💡","🛠️","📦","🌱","💎","🧪","🎨","📈","✨","🏆","🦄"];
const GOAL_COLORS = [
  { from: "#f093fb", to: "#f5576c" },
  { from: "#4facfe", to: "#00f2fe" },
  { from: "#43e97b", to: "#38f9d7" },
  { from: "#fa709a", to: "#fee140" },
  { from: "#a18cd1", to: "#fbc2eb" },
  { from: "#fccb90", to: "#d57eeb" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #050714;
  --glass: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.08);
  --text: #f0f0ff;
  --muted: rgba(200,200,255,0.45);
  --muted2: rgba(200,200,255,0.22);
  --accent: #7c6eff;
  --accent-glow: rgba(124,110,255,0.35);
  --green: #00f5a0;
  --pink: #ff6b9d;
  --gold: #ffd166;
  --syne: 'Syne', sans-serif;
  --inst: 'Instrument Sans', sans-serif;
}

html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--inst);
  min-height: 100vh;
  overflow-x: hidden;
}

.cosmic-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
}
.orb {
  position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.16;
  animation: drift 22s ease-in-out infinite alternate;
}
.orb1 { width: 650px; height: 650px; background: #7c6eff; top: -220px; left: -120px; }
.orb2 { width: 520px; height: 520px; background: #ff6b9d; top: 35%; right: -160px; animation-delay: -8s; }
.orb3 { width: 420px; height: 420px; background: #00f5a0; bottom: -120px; left: 28%; animation-delay: -16s; }
@keyframes drift {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(50px,35px) scale(1.1); }
}
.stars {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 22% 48%, rgba(255,255,255,0.35) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 48% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 68% 62%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 83% 28%, rgba(255,255,255,0.45) 0%, transparent 100%),
    radial-gradient(1px 1px at 38% 82%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 91% 88%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 14% 72%, rgba(255,255,255,0.25) 0%, transparent 100%),
    radial-gradient(1px 1px at 58% 38%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 76% 8%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 3% 55%, rgba(255,255,255,0.35) 0%, transparent 100%);
}

.app {
  position: relative; z-index: 1;
  max-width: 940px; margin: 0 auto; padding: 44px 22px 100px;
}

/* HEADER */
.header { margin-bottom: 44px; animation: fadeUp 0.65s ease both; }
.header-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 24px; flex-wrap: wrap; margin-bottom: 0;
}
.brand-badge {
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(124,110,255,0.12);
  border: 1px solid rgba(124,110,255,0.28);
  border-radius: 20px; padding: 5px 14px;
  font-size: 11px; font-family: var(--syne);
  letter-spacing: 0.14em; color: #a78bfa;
  margin-bottom: 14px; text-transform: uppercase;
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: livePulse 1.8s ease infinite;
}
@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
.logo {
  font-family: var(--syne); font-weight: 800;
  font-size: clamp(30px, 5.5vw, 52px);
  line-height: 1; letter-spacing: -1.5px;
  background: linear-gradient(130deg, #ffffff 0%, #c8c3ff 45%, #7c6eff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.logo-sub {
  font-size: 13.5px; color: var(--muted); margin-top: 8px; letter-spacing: 0.01em; line-height: 1.5;
}

.stat-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.stat-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 18px; padding: 18px 22px;
  backdrop-filter: blur(24px);
  min-width: 110px; position: relative; overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,0.14);
  box-shadow: 0 16px 48px rgba(0,0,0,0.35);
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
}
.stat-val { font-family: var(--syne); font-weight: 800; font-size: 30px; line-height: 1; margin-bottom: 5px; }
.stat-val.green { color: var(--green); text-shadow: 0 0 20px rgba(0,245,160,0.4); }
.stat-val.gold { color: var(--gold); text-shadow: 0 0 20px rgba(255,209,102,0.4); }
.stat-val.pink { color: var(--pink); text-shadow: 0 0 20px rgba(255,107,157,0.4); }
.stat-lbl { font-size: 11px; color: var(--muted); letter-spacing: 0.07em; text-transform: uppercase; }

/* TABS */
.tabs {
  display: flex; gap: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 5px;
  margin-bottom: 32px; backdrop-filter: blur(20px);
  width: fit-content;
  animation: fadeUp 0.65s 0.12s ease both;
}
.tab-btn {
  background: none; border: none; color: var(--muted);
  font-family: var(--syne); font-size: 13px; font-weight: 600;
  letter-spacing: 0.04em; padding: 9px 22px; border-radius: 12px;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 7px;
}
.tab-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
.tab-btn.active {
  background: linear-gradient(135deg, rgba(124,110,255,0.22), rgba(124,110,255,0.08));
  color: #e0dcff;
  border: 1px solid rgba(124,110,255,0.32);
  box-shadow: 0 0 24px rgba(124,110,255,0.18), inset 0 1px 0 rgba(255,255,255,0.08);
}

/* GLASS CARD */
.glass-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 22px; backdrop-filter: blur(28px);
  position: relative; overflow: hidden;
  transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
}
.glass-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
  pointer-events: none;
}
.glass-card:hover {
  border-color: rgba(255,255,255,0.13);
  transform: translateY(-3px);
  box-shadow: 0 24px 64px rgba(0,0,0,0.45);
}

/* ADD FORM */
.add-form { padding: 26px; margin-bottom: 26px; animation: fadeUp 0.5s 0.18s ease both; }
.form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.form-header-icon {
  width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), #a78bfa);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #fff; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(124,110,255,0.35);
}
.form-title { font-family: var(--syne); font-weight: 700; font-size: 16px; }

.form-grid {
  display: grid; grid-template-columns: 60px 1fr 120px; gap: 10px; margin-bottom: 16px;
}
@media(max-width:580px) { .form-grid { grid-template-columns: 60px 1fr; } }

.input {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px; color: var(--text); font-family: var(--inst);
  font-size: 14px; padding: 12px 15px; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
}
.input:focus {
  border-color: rgba(124,110,255,0.5);
  box-shadow: 0 0 0 3px rgba(124,110,255,0.1);
}
.input::placeholder { color: var(--muted2); }
select.input option { background: #10112a; }

.emoji-sel {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px; color: var(--text); font-size: 20px;
  padding: 10px; cursor: pointer; outline: none; text-align: center;
  transition: border-color 0.2s; width: 100%;
}
.emoji-sel:focus { border-color: rgba(124,110,255,0.5); }

.slider-row {
  display: flex; align-items: center; gap: 14px; margin-bottom: 18px;
}
.slider-lbl { font-size: 12px; color: var(--muted); white-space: nowrap; }
.slider {
  flex: 1; -webkit-appearance: none; height: 4px;
  border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #a78bfa); cursor: pointer;
  box-shadow: 0 0 10px rgba(124,110,255,0.55); transition: box-shadow 0.2s, transform 0.15s;
}
.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 18px rgba(124,110,255,0.75); transform: scale(1.15);
}
.pct-badge {
  background: rgba(124,110,255,0.14); border: 1px solid rgba(124,110,255,0.26);
  border-radius: 9px; padding: 4px 12px; font-size: 12px;
  font-family: var(--syne); font-weight: 700; color: #a78bfa;
  min-width: 52px; text-align: center;
}

.add-btn {
  background: linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%);
  border: none; border-radius: 13px; color: #fff;
  font-family: var(--syne); font-size: 13px; font-weight: 700;
  letter-spacing: 0.06em; padding: 13px 26px; cursor: pointer;
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 22px rgba(124,110,255,0.38);
  display: flex; align-items: center; gap: 8px;
}
.add-btn:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(124,110,255,0.5); }
.add-btn:active { transform: translateY(0); }

/* SECTION LABEL */
.section-label {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--syne); font-size: 11px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 18px;
}
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--glass-border); }

/* GOALS GRID */
.goals-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px; margin-bottom: 36px;
}

/* GOAL CARD */
.goal-card { padding: 24px; animation: cardIn 0.4s ease both; }
@keyframes cardIn {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.goal-card-top {
  display: flex; align-items: flex-start; gap: 13px; margin-bottom: 18px;
}
.goal-emoji-wrap {
  width: 46px; height: 46px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  font-size: 23px; flex-shrink: 0;
}
.goal-title {
  font-family: var(--syne); font-weight: 700; font-size: 15px; line-height: 1.35; flex: 1;
}
.goal-card.done .goal-title { color: var(--muted); text-decoration: line-through; }
.del-btn {
  background: none; border: 1px solid transparent; color: var(--muted2);
  width: 28px; height: 28px; border-radius: 9px; cursor: pointer;
  font-size: 18px; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0; line-height: 1;
}
.del-btn:hover { border-color: rgba(255,107,157,0.4); color: var(--pink); background: rgba(255,107,157,0.09); }

.progress-track {
  height: 6px; background: rgba(255,255,255,0.06);
  border-radius: 3px; overflow: hidden; margin-bottom: 10px;
}
.progress-fill {
  height: 100%; border-radius: 3px; transition: width 0.55s cubic-bezier(0.4,0,0.2,1); position: relative;
}
.progress-fill::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0;
  width: 24px; background: rgba(255,255,255,0.38); filter: blur(5px); border-radius: 2px;
}

.goal-stats-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--muted); margin-bottom: 16px;
}
.streak-chip {
  display: flex; align-items: center; gap: 5px;
  background: rgba(255,209,102,0.1); border: 1px solid rgba(255,209,102,0.22);
  border-radius: 20px; padding: 3px 11px;
  font-family: var(--syne); font-weight: 700; font-size: 12px; color: var(--gold);
}

.card-slider-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.card-slider-row .slider { height: 3px; }
.card-slider-row .slider::-webkit-slider-thumb { width: 15px; height: 15px; }

.checkin-btn {
  width: 100%; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  color: var(--muted); font-family: var(--syne); font-size: 12px; font-weight: 600;
  letter-spacing: 0.07em; padding: 10px; cursor: pointer;
  transition: all 0.22s; text-transform: uppercase;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.checkin-btn:hover:not(:disabled) {
  background: rgba(0,245,160,0.09); border-color: rgba(0,245,160,0.3);
  color: var(--green); box-shadow: 0 0 22px rgba(0,245,160,0.14);
}
.checkin-btn.checked {
  background: rgba(0,245,160,0.07); border-color: rgba(0,245,160,0.22); color: var(--green);
}
.checkin-btn:disabled { opacity: 0.45; cursor: default; }

.shipped-badge {
  display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--green);
  font-family: var(--syne); font-weight: 700; letter-spacing: 0.09em; margin-top: 12px;
}

/* UPDATES */
.update-compose { padding: 24px; margin-bottom: 26px; animation: fadeUp 0.5s ease both; }
.compose-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
textarea.input { min-height: 82px; resize: vertical; line-height: 1.65; }
.compose-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.goal-select { flex: 1; min-width: 160px; }
.post-btn {
  background: linear-gradient(135deg, #ff6b9d, #f5576c);
  border: none; border-radius: 13px; color: #fff;
  font-family: var(--syne); font-size: 13px; font-weight: 700;
  padding: 12px 24px; cursor: pointer;
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 22px rgba(255,107,157,0.32); white-space: nowrap;
}
.post-btn:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,107,157,0.42); }

.feed { display: flex; flex-direction: column; }
.feed-item {
  display: flex; gap: 16px; padding: 18px 16px; border-radius: 16px;
  transition: background 0.15s; animation: slideIn 0.3s ease both;
}
@keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
.feed-item:hover { background: rgba(255,255,255,0.025); }
.feed-dot-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 5px; }
.feed-dot {
  width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0;
}
.feed-dot.update { background: var(--accent); box-shadow: 0 0 9px var(--accent-glow); }
.feed-dot.checkin { background: var(--gold); box-shadow: 0 0 9px rgba(255,209,102,0.45); }
.feed-line { flex: 1; width: 1px; background: var(--glass-border); margin-top: 7px; }
.feed-body { flex: 1; }
.feed-text { font-size: 14px; line-height: 1.65; color: var(--text); }
.feed-meta { display: flex; align-items: center; gap: 9px; margin-top: 7px; flex-wrap: wrap; }
.feed-time { font-size: 11px; color: var(--muted); }
.feed-goal-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(124,110,255,0.1); border: 1px solid rgba(124,110,255,0.2);
  border-radius: 20px; padding: 2px 11px; font-size: 11px;
  color: #a78bfa; font-family: var(--syne); font-weight: 600;
}
.feed-del {
  background: none; border: none; color: var(--muted2); cursor: pointer;
  font-size: 20px; padding: 0 4px; transition: color 0.15s; align-self: flex-start;
}
.feed-del:hover { color: var(--pink); }

/* HEATMAP */
.heatmap-wrap { padding: 26px; margin-bottom: 26px; animation: fadeUp 0.5s ease both; }
.heatmap-title {
  font-family: var(--syne); font-weight: 700; font-size: 15px;
  margin-bottom: 22px; display: flex; align-items: center; gap: 9px;
}
.heatmap-grid { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 18px; }
.hmap-cell {
  width: 14px; height: 14px; border-radius: 4px;
  background: rgba(255,255,255,0.05); transition: transform 0.15s, box-shadow 0.15s; cursor: default;
}
.hmap-cell:hover { transform: scale(1.4); }
.hmap-cell.l1 { background: rgba(124,110,255,0.22); }
.hmap-cell.l2 { background: rgba(124,110,255,0.44); }
.hmap-cell.l3 { background: rgba(124,110,255,0.7); }
.hmap-cell.l4 { background: var(--accent); box-shadow: 0 0 8px rgba(124,110,255,0.55); }
.hmap-legend {
  display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--muted);
}

.leaderboard { display: flex; flex-direction: column; gap: 9px; margin-top: 26px; }
.lb-item {
  display: flex; align-items: center; gap: 15px;
  padding: 16px 20px; background: var(--glass);
  border: 1px solid var(--glass-border); border-radius: 16px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.lb-item:hover {
  border-color: rgba(255,255,255,0.13); transform: translateX(5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}
.lb-rank { font-family: var(--syne); font-weight: 800; font-size: 19px; color: var(--muted2); min-width: 30px; }
.lb-emoji { font-size: 23px; }
.lb-name { flex: 1; font-family: var(--syne); font-weight: 600; font-size: 14px; }
.lb-checkins { font-size: 12px; color: var(--muted); }
.lb-streak {
  font-family: var(--syne); font-weight: 800; font-size: 16px; color: var(--gold);
  display: flex; align-items: center; gap: 5px; min-width: 64px; justify-content: flex-end;
}
.lb-streak.zero { color: var(--muted2); font-size: 14px; }

/* EMPTY */
.empty-state {
  text-align: center; padding: 64px 20px; color: var(--muted); animation: fadeUp 0.5s ease both;
}
.empty-icon { font-size: 52px; margin-bottom: 18px; opacity: 0.55; }
.empty-text { font-family: var(--syne); font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--muted); }
.empty-sub { font-size: 13px; color: var(--muted2); }

/* TOAST */
.toast {
  position: fixed; bottom: 30px; right: 30px; z-index: 999;
  display: flex; align-items: center; gap: 11px;
  background: rgba(14,13,36,0.96);
  border: 1px solid rgba(124,110,255,0.32); border-radius: 16px;
  padding: 15px 22px; backdrop-filter: blur(28px);
  box-shadow: 0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
  font-family: var(--syne); font-weight: 600; font-size: 13px; color: var(--text);
  animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1); max-width: 290px;
}
@keyframes toastIn {
  from { opacity:0; transform: translateY(18px) scale(0.88); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
.toast-icon { font-size: 19px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(124,110,255,0.28); border-radius: 3px; }
`;

export default function App() {
  const [data, setData] = useState({ goals: [], updates: [] });
  const [tab, setTab] = useState("goals");
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const toastTimer = useRef(null);

  const [newGoal, setNewGoal] = useState({ title: "", emoji: "🚀", target: 100, progress: 0 });
  const [newUpdate, setNewUpdate] = useState({ text: "", goalId: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) setData(JSON.parse(res.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
  }, []);

  const showToast = (msg, icon = "✨") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, icon });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    const colorIdx = data.goals.length % GOAL_COLORS.length;
    const goal = {
      id: generateId(), title: newGoal.title.trim(), emoji: newGoal.emoji,
      target: Number(newGoal.target) || 100, progress: Number(newGoal.progress) || 0,
      colorIdx, checkIns: [], createdAt: today(), completedAt: null,
    };
    save({ ...data, goals: [goal, ...data.goals] });
    setNewGoal({ title: "", emoji: "🚀", target: 100, progress: 0 });
    showToast("Goal created!", "🎯");
  };

  const checkIn = (goalId) => {
    const t = today();
    const goals = data.goals.map((g) =>
      g.id !== goalId || g.checkIns.includes(t) ? g : { ...g, checkIns: [...g.checkIns, t] }
    );
    const goal = data.goals.find((g) => g.id === goalId);
    const newUp = goal ? [{ id: generateId(), type: "checkin", text: `Checked in on "${goal.title}"`, goalId, createdAt: new Date().toISOString() }] : [];
    save({ goals, updates: [...newUp, ...data.updates] });
    showToast("Streak kept alive!", "🔥");
  };

  const updateProgress = (goalId, progress) => {
    const goals = data.goals.map((g) => {
      if (g.id !== goalId) return g;
      const done = progress >= g.target;
      return { ...g, progress, completedAt: done && !g.completedAt ? today() : g.completedAt };
    });
    save({ ...data, goals });
  };

  const deleteGoal = (id) => { save({ ...data, goals: data.goals.filter((g) => g.id !== id) }); showToast("Removed", "🗑️"); };
  const addUpdate = () => {
    if (!newUpdate.text.trim()) return;
    const u = { id: generateId(), type: "update", text: newUpdate.text.trim(), goalId: newUpdate.goalId, createdAt: new Date().toISOString() };
    save({ ...data, updates: [u, ...data.updates] });
    setNewUpdate({ text: "", goalId: "" });
    showToast("Update posted!", "📢");
  };
  const deleteUpdate = (id) => save({ ...data, updates: data.updates.filter((u) => u.id !== id) });

  const active = data.goals.filter((g) => !g.completedAt);
  const done = data.goals.filter((g) => g.completedAt);
  const topStreak = data.goals.reduce((mx, g) => Math.max(mx, calcStreak(g.checkIns)), 0);

  const heatDays = Array.from({ length: 70 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (69 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayAct = {};
  data.goals.forEach((g) => (g.checkIns || []).forEach((d) => { dayAct[d] = (dayAct[d] || 0) + 1; }));

  if (!loaded) return <style>{CSS}</style>;

  return (
    <>
      <style>{CSS}</style>
      <div className="cosmic-bg">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        <div className="stars" />
      </div>

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-top">
            <div>
              <div className="brand-badge"><div className="live-dot" /> Building in Public</div>
              <div className="logo">Build in Public</div>
              <div className="logo-sub">Track your goals · Grow your streaks · Share your journey</div>
            </div>
            <div className="stat-cards">
              <div className="stat-card"><div className="stat-val green">{active.length}</div><div className="stat-lbl">Active</div></div>
              <div className="stat-card"><div className="stat-val gold">{topStreak}</div><div className="stat-lbl">Best Streak</div></div>
              <div className="stat-card"><div className="stat-val pink">{done.length}</div><div className="stat-lbl">Shipped</div></div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          {[{ id:"goals",l:"Goals",i:"🎯" },{ id:"updates",l:"Updates",i:"📢" },{ id:"heatmap",l:"Activity",i:"🔥" }].map((t) => (
            <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
              <span>{t.i}</span>{t.l}
            </button>
          ))}
        </div>

        {/* GOALS */}
        {tab === "goals" && <>
          <div className="glass-card add-form">
            <div className="form-header">
              <div className="form-header-icon">＋</div>
              <div className="form-title">New Goal</div>
            </div>
            <div className="form-grid">
              <select className="emoji-sel" value={newGoal.emoji} onChange={(e) => setNewGoal({...newGoal,emoji:e.target.value})}>
                {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
              <input className="input" placeholder="What are you building?" value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal,title:e.target.value})}
                onKeyDown={(e) => e.key==="Enter" && addGoal()} />
              <input className="input" type="number" placeholder="Target" value={newGoal.target}
                onChange={(e) => setNewGoal({...newGoal,target:e.target.value})} />
            </div>
            <div className="slider-row">
              <span className="slider-lbl">Starting progress</span>
              <input type="range" className="slider" min={0} max={newGoal.target||100} value={newGoal.progress}
                onChange={(e) => setNewGoal({...newGoal,progress:Number(e.target.value)})} />
              <span className="pct-badge">{Math.round((newGoal.progress/(newGoal.target||100))*100)}%</span>
            </div>
            <button className="add-btn" onClick={addGoal}><span>＋</span>Add Goal</button>
          </div>

          <div className="section-label">Active · {active.length}</div>
          {active.length === 0
            ? <div className="empty-state"><div className="empty-icon">🛠️</div><div className="empty-text">No active goals yet</div><div className="empty-sub">Add your first goal above and start building</div></div>
            : <div className="goals-grid">{active.map((g,i) => <GoalCard key={g.id} goal={g} idx={i}
                streak={calcStreak(g.checkIns)} checkedToday={g.checkIns?.includes(today())}
                pct={Math.min(100,Math.round((g.progress/g.target)*100))}
                onCheckIn={() => checkIn(g.id)} onDelete={() => deleteGoal(g.id)} onProgress={(v) => updateProgress(g.id,v)} />)}
              </div>}

          {done.length > 0 && <>
            <div className="section-label">Shipped 🚀 · {done.length}</div>
            <div className="goals-grid">{done.map((g,i) => <GoalCard key={g.id} goal={g} idx={i} completed
              streak={calcStreak(g.checkIns)} checkedToday={false} pct={100}
              onCheckIn={()=>{}} onDelete={() => deleteGoal(g.id)} onProgress={()=>{}} />)}
            </div>
          </>}
        </>}

        {/* UPDATES */}
        {tab === "updates" && <>
          <div className="glass-card update-compose">
            <div className="compose-header">
              <div className="form-header-icon" style={{background:"linear-gradient(135deg,#ff6b9d,#f5576c)"}}>✍</div>
              <div className="form-title">Post an Update</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <textarea className="input" placeholder="What did you ship today? Share a win, a lesson, or a breakthrough..."
                value={newUpdate.text} onChange={(e) => setNewUpdate({...newUpdate,text:e.target.value})} />
              <div className="compose-row">
                <select className="input goal-select" value={newUpdate.goalId} onChange={(e) => setNewUpdate({...newUpdate,goalId:e.target.value})}>
                  <option value="">No goal tag</option>
                  {data.goals.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>)}
                </select>
                <button className="post-btn" onClick={addUpdate}>Post Update</button>
              </div>
            </div>
          </div>

          <div className="section-label">Feed · {data.updates.length}</div>
          {data.updates.length === 0
            ? <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-text">Your feed is empty</div><div className="empty-sub">Ship something and share your progress</div></div>
            : <div className="feed">{data.updates.map((u,i) => {
                const linked = data.goals.find((g) => g.id===u.goalId);
                return (
                  <div className="feed-item" key={u.id} style={{animationDelay:`${i*0.05}s`}}>
                    <div className="feed-dot-wrap">
                      <div className={`feed-dot ${u.type}`} />
                      {i < data.updates.length-1 && <div className="feed-line" />}
                    </div>
                    <div className="feed-body">
                      <div className="feed-text">{u.text}</div>
                      <div className="feed-meta">
                        <span className="feed-time">{daysAgo(u.createdAt)}</span>
                        {linked && <span className="feed-goal-tag">{linked.emoji} {linked.title}</span>}
                      </div>
                    </div>
                    <button className="feed-del" onClick={() => deleteUpdate(u.id)}>×</button>
                  </div>
                );
              })}</div>}
        </>}

        {/* HEATMAP */}
        {tab === "heatmap" && <>
          <div className="glass-card heatmap-wrap">
            <div className="heatmap-title"><span>📅</span>Check-in Activity — Last 70 Days</div>
            <div className="heatmap-grid">
              {heatDays.map((d) => {
                const c = dayAct[d]||0;
                const l = c===0?"":`l${Math.min(c,4)}`;
                return <div key={d} className={`hmap-cell ${l}`} title={`${d}: ${c} check-in${c!==1?"s":""}`} />;
              })}
            </div>
            <div className="hmap-legend">
              <span>Less</span>
              {["","l1","l2","l3","l4"].map((l,i) => <div key={i} className={`hmap-cell ${l}`} style={{flexShrink:0}} />)}
              <span>More</span>
            </div>
          </div>

          <div className="section-label">Streak Leaderboard</div>
          {data.goals.length === 0
            ? <div className="empty-state"><div className="empty-icon">🏆</div><div className="empty-text">No goals yet</div><div className="empty-sub">Add goals and check in daily to build streaks</div></div>
            : <div className="leaderboard">
                {[...data.goals].sort((a,b) => calcStreak(b.checkIns)-calcStreak(a.checkIns)).map((goal,i) => {
                  const streak = calcStreak(goal.checkIns);
                  return (
                    <div className="lb-item" key={goal.id}>
                      <div className="lb-rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                      <span className="lb-emoji">{goal.emoji}</span>
                      <span className="lb-name">{goal.title}</span>
                      <span className="lb-checkins">{goal.checkIns?.length||0} check-ins</span>
                      <span className={`lb-streak ${streak===0?"zero":""}`}>
                        {streak>0?<><span>🔥</span>{streak}d</>:"—"}
                      </span>
                    </div>
                  );
                })}
              </div>}
        </>}
      </div>

      {toast && <div className="toast"><span className="toast-icon">{toast.icon}</span>{toast.msg}</div>}
    </>
  );
}

function GoalCard({ goal, idx, streak, checkedToday, pct, onCheckIn, onDelete, onProgress, completed }) {
  const color = GOAL_COLORS[goal.colorIdx ?? idx % GOAL_COLORS.length];
  return (
    <div className={`glass-card goal-card ${completed?"done":""}`} style={{animationDelay:`${idx*0.08}s`}}>
      <div className="goal-card-top">
        <div className="goal-emoji-wrap" style={{background:`linear-gradient(135deg,${color.from}20,${color.to}30)`,border:`1px solid ${color.from}30`}}>
          {goal.emoji}
        </div>
        <div className="goal-title">{goal.title}</div>
        <button className="del-btn" onClick={onDelete}>×</button>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${color.from},${color.to})`}} />
      </div>

      <div className="goal-stats-row">
        <span>
          {goal.progress}<span style={{color:"var(--muted2)",margin:"0 4px"}}>/</span>{goal.target}
          <span style={{marginLeft:7,color:color.from,fontWeight:600}}>{pct}%</span>
        </span>
        {streak > 0 && <div className="streak-chip">🔥 {streak}d</div>}
      </div>

      {!completed ? <>
        <div className="card-slider-row">
          <input type="range" className="slider" min={0} max={goal.target} value={goal.progress}
            onChange={(e) => onProgress(Number(e.target.value))} />
        </div>
        <button className={`checkin-btn ${checkedToday?"checked":""}`} onClick={onCheckIn} disabled={checkedToday}>
          {checkedToday ? <><span>✓</span>Checked in today</> : <><span>＋</span>Check in today</>}
        </button>
      </> : (
        <div className="shipped-badge"><span>✦</span>Shipped on {goal.completedAt}</div>
      )}
    </div>
  );
}
