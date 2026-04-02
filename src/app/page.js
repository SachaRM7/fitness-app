"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";

const F = `'Nunito', sans-serif`;
const FD = `'Cormorant Garamond', serif`;
const LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap";

const C = {
  bg: "#FAF5F0", card: "#FFFFFF", text: "#3A2D2F", sub: "#9B8589",
  accent: "#D46B7B", accentLight: "#F6DFE2", accentDark: "#B8505F",
  success: "#6BAF7B", successLight: "#E4F3E8",
  phase1: "#E8B4B8", phase2: "#A8C8DC", phase3: "#B5D4A7",
  border: "#EDE4DE", danger: "#E07070",
  gradient1: "linear-gradient(135deg, #E8B4B8 0%, #F6DFE2 100%)",
  gradient2: "linear-gradient(135deg, #A8C8DC 0%, #D4E6F0 100%)",
  gradient3: "linear-gradient(135deg, #B5D4A7 0%, #DCE9D4 100%)",
};

const EX = {
  respiration: { name: "Respiration abdominale", icon: "🫁", cat: "Core", desc: "Inspire en gonflant le ventre, expire en rentrant le nombril." },
  kegel: { name: "Kegel", icon: "💎", cat: "Périnée", desc: "Contracte le périnée 5s, relâche 5s." },
  pont: { name: "Pont", icon: "🌉", cat: "Fessiers", desc: "Allongée, pieds au sol, monte le bassin." },
  clam: { name: "Clam Shell", icon: "🐚", cat: "Fessiers", desc: "Sur le côté, genoux pliés, ouvre le genou du dessus." },
  bird_dog: { name: "Bird Dog", icon: "🐕", cat: "Dos/Core", desc: "À 4 pattes, tends bras droit + jambe gauche, alterne." },
  dead_bug: { name: "Dead Bug", icon: "🐛", cat: "Core", desc: "Sur le dos, tends bras/jambe opposés en alternant." },
  wall_push: { name: "Pompes au mur", icon: "🧱", cat: "Haut du corps", desc: "Pompes debout contre le mur." },
  chat_vache: { name: "Chat-Vache", icon: "🐱", cat: "Mobilité", desc: "À 4 pattes, alterne dos rond et dos creux." },
  squat_mur: { name: "Squat mur", icon: "🏋️‍♀️", cat: "Jambes", desc: "Dos contre le mur, descends en position chaise." },
  marche: { name: "Marche sur place", icon: "🚶‍♀️", cat: "Cardio", desc: "Marche sur place en levant bien les genoux." },
  squat: { name: "Squat", icon: "🏋️‍♀️", cat: "Jambes", desc: "Pieds largeur épaules, descends comme pour t'asseoir." },
  fente: { name: "Fente avant", icon: "🦵", cat: "Jambes", desc: "Un grand pas en avant, genou arrière vers le sol." },
  planche_g: { name: "Planche genoux", icon: "🧘‍♀️", cat: "Core", desc: "Position planche sur les genoux, corps aligné." },
  pompes_g: { name: "Pompes genoux", icon: "💪", cat: "Haut du corps", desc: "Pompes classiques mais sur les genoux." },
  superman: { name: "Superman", icon: "🦸‍♀️", cat: "Dos", desc: "Sur le ventre, décolle bras et jambes simultanément." },
  step_up: { name: "Step-up", icon: "🪜", cat: "Jambes/Cardio", desc: "Monte sur une marche en alternant les jambes." },
  pont_1j: { name: "Pont une jambe", icon: "🌉", cat: "Fessiers", desc: "Pont classique mais sur une seule jambe." },
  gainage_lat: { name: "Gainage latéral", icon: "📐", cat: "Obliques", desc: "Sur le côté, coude au sol, genoux posés, lève le bassin." },
  elev_lat: { name: "Élévations latérales", icon: "🍶", cat: "Épaules", desc: "Avec bouteilles d'eau, lève les bras sur les côtés." },
  mt_climber_l: { name: "Mountain Climber lent", icon: "⛰️", cat: "Cardio/Core", desc: "En planche, ramène un genou puis l'autre, lentement." },
  squat_jump: { name: "Squat Jump", icon: "🚀", cat: "Jambes/Cardio", desc: "Squat puis saute en extension." },
  burpee: { name: "Burpee adapté", icon: "⚡", cat: "Full body", desc: "Squat, mains au sol, step back, remonte, petit saut." },
  planche: { name: "Planche complète", icon: "🧘‍♀️", cat: "Core", desc: "Position planche sur les pieds, tiens la position." },
  pompes: { name: "Pompes", icon: "💪", cat: "Haut du corps", desc: "Pompes classiques complètes." },
  fente_dyn: { name: "Fentes dynamiques", icon: "🦵", cat: "Jambes/Cardio", desc: "Fentes en alternant rapidement les jambes." },
  mt_climber: { name: "Mountain Climber", icon: "⛰️", cat: "Cardio/Core", desc: "En planche, ramène les genoux rapidement." },
  dips: { name: "Dips chaise", icon: "🪑", cat: "Triceps", desc: "Mains sur une chaise derrière toi, descends et remonte." },
  sumo: { name: "Sumo Squat", icon: "🏋️‍♀️", cat: "Int. cuisses", desc: "Squat pieds très écartés, pointes vers l'extérieur." },
  crunch_velo: { name: "Crunch vélo", icon: "🚲", cat: "Abdos", desc: "Sur le dos, touche coude-genou opposé en alternant." },
  jumping_jack: { name: "Jumping Jacks", icon: "⭐", cat: "Cardio", desc: "Saute en écartant bras et jambes." },
};

function buildAdaptiveProgram(profile, weightHistory) {
  const { weight, targetWeight, height, age } = profile;
  const bmi = weight / ((height / 100) ** 2);
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].kg : weight;

  let weeklyWeightLoss = 0;
  if (weightHistory.length >= 2) {
    const last = weightHistory[weightHistory.length - 1];
    const prev = weightHistory[Math.max(0, weightHistory.length - 3)];
    const weeksDiff = Math.max(1, (last.date - prev.date) / (7 * 86400000));
    weeklyWeightLoss = (prev.kg - last.kg) / weeksDiff;
  }

  let intensity = 1.0;
  let cardioBoost = false;
  if (weeklyWeightLoss > 0.8) intensity = 0.9;
  else if (weeklyWeightLoss < 0.1 && weightHistory.length > 3) { intensity = 1.15; cardioBoost = true; }
  else if (weeklyWeightLoss >= 0.3) intensity = 1.1;

  if (age > 35) intensity *= 0.95;
  if (age > 40) intensity *= 0.9;

  let baseM = 1.0;
  if (bmi > 30) baseM = 0.85;
  else if (bmi > 25) baseM = 0.92;

  const r = (base, week) => Math.round(base * baseM * intensity * (1 + (week - 1) * 0.06));
  const sec = (base, week) => Math.round(base * baseM * intensity * (1 + (week - 1) * 0.05));
  const sets = (week) => { if (week <= 2) return 2; if (week <= 5) return 3; if (week <= 9) return Math.round(3 * intensity); return Math.round(4 * intensity); };
  const rest = (base, week) => Math.max(10, Math.round(base * (1 - (week - 1) * 0.03)));

  const weeks = [];

  const p1 = [
    [{ ex: "respiration", reps: (w) => `${r(10,w)} resp.`, rest: 30 }, { ex: "kegel", reps: (w) => `${r(10,w)} × 5s`, rest: 20 }, { ex: "pont", reps: (w) => `${r(10,w)} rép.`, rest: 30 }, { ex: "chat_vache", reps: (w) => `${r(8,w)} rép.`, rest: 20 }, { ex: "marche", reps: (w) => `${sec(3,w)} min`, rest: 0 }],
    [{ ex: "respiration", reps: (w) => `${r(8,w)} resp.`, rest: 25 }, { ex: "dead_bug", reps: (w) => `${r(8,w)} / côté`, rest: 30 }, { ex: "clam", reps: (w) => `${r(12,w)} / côté`, rest: 30 }, { ex: "wall_push", reps: (w) => `${r(10,w)} rép.`, rest: 30 }, { ex: "marche", reps: (w) => `${sec(3,w)} min`, rest: 0 }],
    [{ ex: "kegel", reps: (w) => `${r(12,w)} × 5s`, rest: 20 }, { ex: "bird_dog", reps: (w) => `${r(8,w)} / côté`, rest: 30 }, { ex: "squat_mur", reps: (w) => `${sec(10,w)}s tenue`, rest: 30 }, { ex: "pont", reps: (w) => `${r(12,w)} rép.`, rest: 30 }, { ex: "chat_vache", reps: (w) => `${r(10,w)} rép.`, rest: 0 }],
  ];
  for (let w = 1; w <= 4; w++) {
    weeks.push({ week: w, phase: 1, sessions: p1.map((s, i) => ({
      id: `w${w}s${i+1}`, name: ["Douceur & Périnée", "Core & Haut du corps", "Bas du corps"][i], sets: sets(w),
      exercises: s.map(e => ({ ...EX[e.ex], reps: e.reps(w), rest: rest(e.rest, w) })),
    }))});
  }

  const p2 = [
    [{ ex: "squat", reps: (w) => `${r(12,w)} rép.`, rest: 30 }, { ex: "pont_1j", reps: (w) => `${r(8,w)} / côté`, rest: 30 }, { ex: "fente", reps: (w) => `${r(10,w)} / côté`, rest: 30 }, { ex: "step_up", reps: (w) => `${r(10,w)} / côté`, rest: 30 }, { ex: "squat_mur", reps: (w) => `${sec(30,w)}s`, rest: 0 }],
    [{ ex: "pompes_g", reps: (w) => `${r(10,w)} rép.`, rest: 30 }, { ex: "planche_g", reps: (w) => `${sec(20,w)}s`, rest: 30 }, { ex: "elev_lat", reps: (w) => `${r(12,w)} rép.`, rest: 30 }, { ex: "superman", reps: (w) => `${r(10,w)} rép.`, rest: 30 }, { ex: "gainage_lat", reps: (w) => `${sec(15,w)}s / côté`, rest: 0 }],
    [{ ex: cardioBoost ? "step_up" : "mt_climber_l", reps: (w) => `${r(20,w)} rép.`, rest: 25 }, { ex: "squat", reps: (w) => `${r(15,w)} rép.`, rest: 20 }, { ex: "pompes_g", reps: (w) => `${r(10,w)} rép.`, rest: 20 }, { ex: "fente", reps: (w) => `${r(10,w)} / côté`, rest: 20 }, { ex: "planche_g", reps: (w) => `${sec(20,w)}s`, rest: 0 }],
  ];
  for (let w = 5; w <= 8; w++) {
    weeks.push({ week: w, phase: 2, sessions: p2.map((s, i) => ({
      id: `w${w}s${i+1}`, name: ["Bas du corps", "Haut du corps & Core", "Circuit Cardio"][i], sets: sets(w),
      exercises: s.map(e => ({ ...EX[e.ex], reps: e.reps(w), rest: rest(e.rest, w) })),
    }))});
  }

  const p3 = [
    [{ ex: "squat_jump", reps: (w) => `${r(10,w)} rép.`, rest: 20 }, { ex: "fente_dyn", reps: (w) => `${r(8,w)} / côté`, rest: 20 }, { ex: "sumo", reps: (w) => `${r(15,w)} rép.`, rest: 20 }, { ex: "pont_1j", reps: (w) => `${r(10,w)} / côté`, rest: 20 }, { ex: "jumping_jack", reps: (w) => `${sec(30,w)}s`, rest: 0 }],
    [{ ex: "pompes", reps: (w) => `${r(10,w)} rép.`, rest: 25 }, { ex: "planche", reps: (w) => `${sec(30,w)}s`, rest: 25 }, { ex: "crunch_velo", reps: (w) => `${r(15,w)} / côté`, rest: 25 }, { ex: "dips", reps: (w) => `${r(10,w)} rép.`, rest: 25 }, { ex: "superman", reps: (w) => `${r(12,w)} rép.`, rest: 0 }],
    [{ ex: "burpee", reps: (w) => `${r(8,w)} rép.`, rest: 20 }, { ex: "mt_climber", reps: (w) => `${r(20,w)} rép.`, rest: 15 }, { ex: "squat_jump", reps: (w) => `${r(10,w)} rép.`, rest: 15 }, { ex: "pompes", reps: (w) => `${r(8,w)} rép.`, rest: 15 }, { ex: "planche", reps: (w) => `${sec(30,w)}s`, rest: 15 }, { ex: "jumping_jack", reps: (w) => `${sec(30,w)}s`, rest: 0 }],
  ];
  for (let w = 9; w <= 12; w++) {
    weeks.push({ week: w, phase: 3, sessions: p3.map((s, i) => ({
      id: `w${w}s${i+1}`, name: ["Bas du corps intense", "Haut du corps & Abdos", "HIIT Full Body"][i], sets: sets(w),
      exercises: s.map(e => ({ ...EX[e.ex], reps: e.reps(w), rest: rest(e.rest, w) })),
    }))});
  }
  return weeks;
}

const PHASES = [
  { id: 1, name: "Réveil en douceur", weeks: [1,2,3,4], color: C.phase1, gradient: C.gradient1, desc: "Reconnexion périnée, transverse, mobilité." },
  { id: 2, name: "Montée en puissance", weeks: [5,6,7,8], color: C.phase2, gradient: C.gradient2, desc: "Renforcement, gainage, circuits cardio." },
  { id: 3, name: "Transformation", weeks: [9,10,11,12], color: C.phase3, gradient: C.gradient3, desc: "HIIT adapté, renforcement ciblé, full body." },
];

const KEYS = { profile: "mef-profile", progress: "mef-progress", weights: "mef-weights", week: "mef-week", familyCode: "mef-family-code" };

function normalizeFamilyCode(code) {
  return (code || "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
}

function getFamilyCode() {
  if (typeof window === "undefined") return "";
  return normalizeFamilyCode(window.localStorage.getItem(KEYS.familyCode) || "");
}

function setFamilyCode(code) {
  if (typeof window === "undefined") return "";
  const normalized = normalizeFamilyCode(code);
  if (normalized) window.localStorage.setItem(KEYS.familyCode, normalized);
  else window.localStorage.removeItem(KEYS.familyCode);
  return normalized;
}

function localLoad(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function localSave(key, val) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

async function loadAllData() {
  const fallback = {
    profile: localLoad(KEYS.profile),
    progress: localLoad(KEYS.progress) || {},
    weights: localLoad(KEYS.weights) || [],
    week: localLoad(KEYS.week) || 1,
  };

  if (!isFirebaseConfigured() || !db || typeof window === "undefined") return fallback;

  try {
    const familyCode = getFamilyCode();
    if (!familyCode) return fallback;

    const ref = doc(db, "users", familyCode);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, fallback, { merge: true });
      return fallback;
    }

    const data = snap.data() || {};
    const merged = {
      profile: data.profile ?? fallback.profile,
      progress: data.progress ?? fallback.progress,
      weights: data.weights ?? fallback.weights,
      week: data.week ?? fallback.week,
    };

    localSave(KEYS.profile, merged.profile);
    localSave(KEYS.progress, merged.progress);
    localSave(KEYS.weights, merged.weights);
    localSave(KEYS.week, merged.week);

    return merged;
  } catch {
    return fallback;
  }
}

async function saveAllData(partial) {
  if (typeof window === "undefined") return;

  const current = {
    profile: localLoad(KEYS.profile),
    progress: localLoad(KEYS.progress) || {},
    weights: localLoad(KEYS.weights) || [],
    week: localLoad(KEYS.week) || 1,
  };

  const next = { ...current, ...partial };

  localSave(KEYS.profile, next.profile);
  localSave(KEYS.progress, next.progress);
  localSave(KEYS.weights, next.weights);
  localSave(KEYS.week, next.week);

  if (!isFirebaseConfigured() || !db) return;

  try {
    const familyCode = getFamilyCode();
    if (!familyCode) return;
    const ref = doc(db, "users", familyCode);
    await setDoc(ref, next, { merge: true });
  } catch {}
}

const btnStyle = { fontFamily: F, fontSize: 14, fontWeight: 700, border: "none", borderRadius: 12, padding: "12px 24px", cursor: "pointer", background: C.accent, color: "#fff" };

function Timer({ seconds, totalSeconds, onDone, autoStart = false }) {
  const safeInitialLeft = Math.max(1, seconds);
  const safeTotal = Math.max(safeInitialLeft, totalSeconds || safeInitialLeft);

  const [left, setLeft] = useState(safeInitialLeft);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    setLeft(Math.max(1, seconds));
    setRunning(autoStart);
  }, [seconds, autoStart]);

  useEffect(() => { if (!running || left <= 0) return; const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [running, left]);
  useEffect(() => { if (left === 0 && running) { setRunning(false); onDone?.(); } }, [left, running]);
  const pct = ((safeTotal - left) / safeTotal) * 100;
  const rad = 26, circ = 2 * Math.PI * rad;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r={rad} fill="none" stroke={C.border} strokeWidth="3.5" />
        <circle cx="29" cy="29" r={rad} fill="none" stroke={C.accent} strokeWidth="3.5" strokeDasharray={circ} strokeDashoffset={circ - (circ * pct) / 100} strokeLinecap="round" transform="rotate(-90 29 29)" style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x="29" y="33" textAnchor="middle" fontFamily={F} fontSize="14" fontWeight="700" fill={C.text}>{left}s</text>
      </svg>
      {!running && left > 0 && <button onClick={() => setRunning(true)} style={{ ...btnStyle, fontSize: 12, padding: "5px 14px" }}>▶ Repos</button>}
      {running && <span style={{ fontFamily: F, color: C.sub, fontSize: 12 }}>Repose-toi…</span>}
      {left === 0 && <span style={{ fontFamily: F, color: C.success, fontWeight: 700, fontSize: 13 }}>C'est reparti !</span>}
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState(["", "", "", "", ""]);
  const fields = [
    { label: "Ton prénom", placeholder: "Marie", type: "text", icon: "👋", sub: "Comment tu t'appelles ?" },
    { label: "Ton âge", placeholder: "30", type: "number", unit: "ans", icon: "🎂", sub: "Pour adapter l'intensité." },
    { label: "Ta taille", placeholder: "165", type: "number", unit: "cm", icon: "📏", sub: "Pour calculer ton IMC." },
    { label: "Poids actuel", placeholder: "72", type: "number", unit: "kg", icon: "⚖️", sub: "On part de là." },
    { label: "Objectif de poids", placeholder: "62", type: "number", unit: "kg", icon: "🎯", sub: "Ton objectif réaliste." },
  ];
  const f = fields[step];
  const canNext = vals[step].trim().length > 0;
  const setVal = (v) => { const n = [...vals]; n[step] = v; setVals(n); };
  const next = () => {
    if (step < 4) setStep(step + 1);
    else onDone({ name: vals[0], age: Number(vals[1]), height: Number(vals[2]), weight: Number(vals[3]), targetWeight: Number(vals[4]) });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <link href={LINK} rel="stylesheet" />
      <div style={{ maxWidth: 380, width: "100%", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {fields.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? C.accent : C.border, transition: "all .3s" }} />)}
        </div>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{f.icon}</div>
        <h2 style={{ fontFamily: FD, fontSize: 28, color: C.text, margin: "0 0 6px", fontWeight: 700 }}>{f.label}</h2>
        <p style={{ fontFamily: F, fontSize: 13, color: C.sub, margin: "0 0 24px" }}>{f.sub}</p>
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input type={f.type} value={vals[step]} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && canNext && next()} placeholder={f.placeholder} autoFocus
            style={{ fontFamily: F, fontSize: 20, fontWeight: 600, width: "100%", padding: "14px 18px", paddingRight: f.unit ? 50 : 18, border: `2px solid ${C.border}`, borderRadius: 14, background: C.card, color: C.text, outline: "none", textAlign: "center", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          {f.unit && <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontFamily: F, fontSize: 14, color: C.sub, fontWeight: 600 }}>{f.unit}</span>}
        </div>
        <button onClick={next} disabled={!canNext} style={{ ...btnStyle, width: "100%", padding: "14px 0", opacity: canNext ? 1 : 0.4, background: canNext ? C.accent : C.border }}>
          {step < 4 ? "Suivant →" : "C'est parti ! 🌸"}
        </button>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 13, cursor: "pointer", marginTop: 12 }}>← Retour</button>}
      </div>
    </div>
  );
}

function WeightTracker({ profile, weights, onAddWeight, onBack }) {
  const [newW, setNewW] = useState("");
  const chartData = weights.map(w => ({ date: new Date(w.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), kg: w.kg }));
  const lost = profile.weight - (weights.length ? weights[weights.length - 1].kg : profile.weight);
  const remaining = (weights.length ? weights[weights.length - 1].kg : profile.weight) - profile.targetWeight;
  const bmi = (weights.length ? weights[weights.length - 1].kg : profile.weight) / ((profile.height / 100) ** 2);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, paddingRight: 16, paddingLeft: 16, paddingBottom: 100 }}>
      <link href={LINK} rel="stylesheet" />
      <button onClick={onBack} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontFamily: FD, fontSize: 26, color: C.text, margin: "0 0 4px", fontWeight: 700 }}>Suivi du poids</h2>
      <p style={{ fontFamily: F, fontSize: 13, color: C.sub, margin: "0 0 20px" }}>Pèse-toi 1× par semaine, le matin à jeun. Le programme s'adapte automatiquement.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Perdu", value: `${lost >= 0 ? "-" : "+"}${Math.abs(lost).toFixed(1)}`, unit: "kg", color: lost >= 0 ? C.success : C.danger },
          { label: "Actuel", value: (weights.length ? weights[weights.length - 1].kg : profile.weight).toFixed(1), unit: "kg", color: C.accent },
          { label: "Restant", value: remaining > 0 ? remaining.toFixed(1) : "0", unit: "kg", color: C.phase2 },
          { label: "IMC", value: bmi.toFixed(1), unit: "", color: bmi < 25 ? C.success : bmi < 30 ? C.accent : C.danger },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "10px 6px", textAlign: "center", border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: F, fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: s.color, margin: "3px 0 0" }}>{s.value}<span style={{ fontSize: 10, fontWeight: 600, color: C.sub }}> {s.unit}</span></div>
          </div>
        ))}
      </div>

      {chartData.length >= 2 ? (
        <div style={{ background: C.card, borderRadius: 16, padding: "16px 8px 8px 0", border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs><linearGradient id="cKg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.2} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: F, fill: C.sub }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fontFamily: F, fill: C.sub }} />
              <Tooltip contentStyle={{ fontFamily: F, fontSize: 12, borderRadius: 8 }} />
              <ReferenceLine y={profile.targetWeight} stroke={C.success} strokeDasharray="5 5" label={{ value: "Objectif", fontSize: 10, fontFamily: F, fill: C.success }} />
              <Area type="monotone" dataKey="kg" stroke={C.accent} fill="url(#cKg)" strokeWidth={2.5} dot={{ fill: C.accent, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ background: C.accentLight, borderRadius: 14, padding: "20px 16px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <p style={{ fontFamily: F, fontSize: 13, color: C.text, margin: 0 }}>Ajoute au moins 2 pesées pour voir ta courbe !</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input type="number" step="0.1" value={newW} onChange={e => setNewW(e.target.value)} placeholder="Ex: 70.5"
            onKeyDown={e => { if (e.key === "Enter" && newW) { onAddWeight(Number(newW)); setNewW(""); } }}
            style={{ fontFamily: F, fontSize: 16, fontWeight: 600, width: "100%", padding: "12px 50px 12px 16px", border: `2px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: F, fontSize: 13, color: C.sub, fontWeight: 600 }}>kg</span>
        </div>
        <button onClick={() => { if (newW) { onAddWeight(Number(newW)); setNewW(""); } }} style={{ ...btnStyle, padding: "12px 20px", opacity: newW ? 1 : 0.4 }}>+ Ajouter</button>
      </div>

      {weights.length > 0 && (
        <>
          <h3 style={{ fontFamily: FD, fontSize: 18, color: C.text, margin: "0 0 10px", fontWeight: 600 }}>Historique</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...weights].reverse().map((w, i) => {
              const idx = weights.length - 1 - i;
              const prev = idx > 0 ? weights[idx - 1] : null;
              const diff = prev ? w.kg - prev.kg : 0;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: F, fontSize: 13, color: C.sub }}>{new Date(w.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: C.text }}>{w.kg} kg</span>
                    {diff !== 0 && <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: diff < 0 ? C.success : C.danger, background: diff < 0 ? C.successLight : C.danger + "15", padding: "2px 7px", borderRadius: 8 }}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SessionView({ session, weekNum, onComplete, onBack, alreadyDone, persistedState, onSessionStateChange }) {
  const initialDone = useMemo(() => new Set(persistedState?.doneIndices || []), [persistedState]);
  const [done, setDone] = useState(initialDone);
  const [curSet, setCurSet] = useState((persistedState?.setsDone || 0) + 1);
  const [showTimer, setShowTimer] = useState(persistedState?.pendingRest?.exerciseIndex ?? null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const allDone = done.size >= session.exercises.length;
  const phase = PHASES.find(p => p.weeks.includes(weekNum)) || PHASES[0];

  const persistSessionState = useCallback((nextDone, nextSet, pendingRest = null) => {
    onSessionStateChange?.({
      setsDone: Math.max(0, nextSet - 1),
      doneIndices: Array.from(nextDone),
      pendingRest,
    });
  }, [onSessionStateChange]);

  useEffect(() => {
    const pending = persistedState?.pendingRest;
    if (!pending) return;

    const remaining = Math.ceil((pending.endsAt - Date.now()) / 1000);

    if (remaining > 0) {
      setShowTimer(pending.exerciseIndex);
      setTimerSeconds(remaining);
      setTimerTotalSeconds(Math.max(remaining, pending.initialRest || remaining));
      return;
    }

    const completed = new Set(done);
    completed.add(pending.exerciseIndex);
    setDone(completed);
    setShowTimer(null);
    setTimerSeconds(0);
    setTimerTotalSeconds(0);
    persistSessionState(completed, curSet, null);
  }, [persistedState, done, curSet, persistSessionState]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, paddingRight: 16, paddingLeft: 16, paddingBottom: 100 }}>
      <button onClick={onBack} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Retour</button>
      <div style={{ background: phase.gradient, borderRadius: 18, padding: "20px 20px 16px", marginBottom: 20 }}>
        <div style={{ fontFamily: F, fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Semaine {weekNum} · Série {curSet}/{session.sets}</div>
        <h2 style={{ fontFamily: FD, fontSize: 24, color: C.text, margin: "4px 0", fontWeight: 700 }}>{session.name}</h2>
        <div style={{ fontFamily: F, fontSize: 12, color: C.sub }}>{session.exercises.length} exercices · {session.sets} séries</div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {Array.from({ length: session.sets }).map((_, i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < curSet - 1 ? C.success : i === curSet - 1 ? C.accent : C.border }} />)}
        </div>
      </div>

      {alreadyDone && <div style={{ fontFamily: F, fontSize: 13, color: C.success, fontWeight: 700, background: C.successLight, borderRadius: 10, padding: "10px 14px", marginBottom: 14, textAlign: "center" }}>✓ Déjà validée — refais-la si tu veux !</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {session.exercises.map((ex, i) => {
          const isDone = done.has(i);
          return (
            <div key={i} style={{ padding: "14px 16px", background: isDone ? C.successLight : C.card, borderRadius: 14, border: `1px solid ${isDone ? C.success + "44" : C.border}`, opacity: isDone ? 0.65 : 1, transition: "all .3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: isDone ? C.success + "22" : C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{isDone ? "✓" : ex.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.text }}>{ex.name}</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: C.accent, marginTop: 1, fontWeight: 700 }}>{ex.reps}</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2, fontStyle: "italic" }}>{ex.desc}</div>
                </div>
                <button onClick={() => {
                  if (isDone) {
                    const nextDone = new Set(done);
                    nextDone.delete(i);
                    setDone(nextDone);
                    if (showTimer === i) {
                      setShowTimer(null);
                      setTimerSeconds(0);
                      setTimerTotalSeconds(0);
                    }
                    persistSessionState(nextDone, curSet, null);
                    return;
                  }

                  if (ex.rest > 0) {
                    if (showTimer !== null && showTimer !== i) {
                      alert("Termine le repos en cours avant d'en lancer un autre.");
                      return;
                    }
                    const pendingRest = { exerciseIndex: i, endsAt: Date.now() + ex.rest * 1000, initialRest: ex.rest };
                    setShowTimer(i);
                    setTimerSeconds(ex.rest);
                    setTimerTotalSeconds(ex.rest);
                    persistSessionState(done, curSet, pendingRest);
                  } else {
                    const nextDone = new Set(done);
                    nextDone.add(i);
                    setDone(nextDone);
                    persistSessionState(nextDone, curSet, null);
                  }
                }} style={{ fontFamily: F, fontSize: 12, fontWeight: 700, border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", background: isDone ? C.successLight : C.accentLight, color: isDone ? C.success : C.accent, flexShrink: 0 }}>
                  {isDone ? "Décocher" : "Fait ✓"}
                </button>
              </div>
              {showTimer === i && ex.rest > 0 && !isDone && <Timer seconds={timerSeconds || ex.rest} totalSeconds={timerTotalSeconds || ex.rest} autoStart onDone={() => {
                const nextDone = new Set(done);
                nextDone.add(i);
                setDone(nextDone);
                setShowTimer(null);
                setTimerSeconds(0);
                setTimerTotalSeconds(0);
                persistSessionState(nextDone, curSet, null);
              }} />}
            </div>
          );
        })}
      </div>

      {allDone && (
        <button onClick={() => {
          if (curSet < session.sets) {
            const nextSet = curSet + 1;
            setCurSet(nextSet);
            setDone(new Set());
            setShowTimer(null);
            setTimerSeconds(0);
            setTimerTotalSeconds(0);
            persistSessionState(new Set(), nextSet, null);
          } else {
            onComplete();
          }
        }}
          style={{ ...btnStyle, width: "100%", padding: "14px 0", marginTop: 20, background: curSet < session.sets ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : `linear-gradient(135deg, ${C.success}, #4A9A5A)`, boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>
          {curSet < session.sets ? `Série terminée → Série ${curSet + 1}` : "🎉 Séance terminée !"}
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState({});
  const [weights, setWeights] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [view, setView] = useState("loading");
  const [activeSession, setActiveSession] = useState(null);
  const [familyCode, setFamilyCodeState] = useState("");
  const [familyCodeInput, setFamilyCodeInput] = useState("");

  useEffect(() => {
    (async () => {
      const code = getFamilyCode();
      setFamilyCodeState(code);
      setFamilyCodeInput(code);
      const data = await loadAllData();
      setProfile(data.profile);
      setProgress(data.progress || {});
      setWeights(data.weights || []);
      setCurrentWeek(data.week || 1);
      setView(data.profile ? "home" : "onboarding");
    })();
  }, []);

  const sv = useCallback(async (p, pr, w, cw) => {
    const updates = {};
    if (p !== undefined) { setProfile(p); updates.profile = p; }
    if (pr !== undefined) { setProgress(pr); updates.progress = pr; }
    if (w !== undefined) { setWeights(w); updates.weights = w; }
    if (cw !== undefined) { setCurrentWeek(cw); updates.week = cw; }
    await saveAllData(updates);
  }, []);

  const program = useMemo(() => profile ? buildAdaptiveProgram(profile, weights) : [], [profile, weights]);
  const weekData = program.find(w => w.week === currentWeek);
  const phase = PHASES.find(p => p.weeks.includes(currentWeek));
  const sessions = weekData?.sessions || [];
  const doneThisWeek = sessions.filter(s => typeof progress[s.id] === "number").length;
  const weekComplete = doneThisWeek === sessions.length && sessions.length > 0;
  const totalDone = Object.keys(progress).length;
  const totalSessions = program.reduce((a, w) => a + w.sessions.length, 0);

  if (view === "loading") return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><link href={LINK} rel="stylesheet" /><div style={{ fontFamily: FD, fontSize: 22, color: C.accent }}>🌸</div></div>;

  if (view === "onboarding") return <Onboarding onDone={async p => { await sv(p, {}, [{ date: Date.now(), kg: p.weight }], 1); setView("home"); }} />;

  if (view === "weight") return <div style={{ minHeight: "100vh", background: C.bg }}><link href={LINK} rel="stylesheet" /><WeightTracker profile={profile} weights={weights} onBack={() => setView("home")} onAddWeight={async kg => { const w = [...weights, { date: Date.now(), kg }]; await sv(undefined, undefined, w, undefined); }} /></div>;

  if (view === "session" && activeSession) return <div style={{ minHeight: "100vh", background: C.bg }}><link href={LINK} rel="stylesheet" /><SessionView session={activeSession} weekNum={currentWeek} alreadyDone={typeof progress[activeSession.id] === "number"} persistedState={typeof progress[activeSession.id] === "object" ? progress[activeSession.id] : undefined} onSessionStateChange={async (sessionState) => { await sv(undefined, { ...progress, [activeSession.id]: sessionState }, undefined, undefined); }} onBack={() => { setView("week"); setActiveSession(null); }} onComplete={async () => { await sv(undefined, { ...progress, [activeSession.id]: Date.now() }, undefined, undefined); setView("week"); setActiveSession(null); }} /></div>;

  if (view === "week") return (
    <div style={{ minHeight: "100vh", background: C.bg }}><link href={LINK} rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, paddingRight: 16, paddingLeft: 16, paddingBottom: 100 }}>
        <button onClick={() => setView("home")} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Programme</button>
        <div style={{ background: phase.gradient, borderRadius: 20, padding: 22, marginBottom: 24 }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: C.accent }}>Phase {phase.id} · {phase.name}</div>
          <h2 style={{ fontFamily: FD, fontSize: 28, color: C.text, margin: "4px 0", fontWeight: 700 }}>Semaine {currentWeek}</h2>
          <p style={{ fontFamily: F, fontSize: 13, color: C.sub, margin: "0 0 14px", lineHeight: 1.5 }}>{phase.desc}</p>
          <div style={{ display: "flex", gap: 5 }}>
            {sessions.map((s, i) => {
              const isCompleted = typeof progress[s.id] === "number";
              const isInProgress = typeof progress[s.id] === "object";
              return (
                <div
                  key={i}
                  style={{
                    height: 5,
                    flex: 1,
                    borderRadius: 3,
                    background: isCompleted ? C.success : isInProgress ? C.accent : C.border
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 6 }}>{doneThisWeek}/{sessions.length} séances</div>
        </div>
        <div style={{ background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div><div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.text }}>Adapté à {profile?.name}</div><div style={{ fontFamily: F, fontSize: 11, color: C.sub }}>{sessions[0]?.sets} séries · Reps et repos ajustés selon ton poids</div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((session, idx) => {
            const isDone = typeof progress[session.id] === "number";
            return <button key={session.id} onClick={() => { setActiveSession(session); setView("session"); }}
              style={{ fontFamily: F, textAlign: "left", cursor: "pointer", background: isDone ? C.successLight : C.card, border: `1.5px solid ${isDone ? C.success + "44" : C.border}`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: isDone ? "none" : "0 2px 8px rgba(0,0,0,.03)", transition: "transform .15s" }}
              onMouseEnter={e => !isDone && (e.currentTarget.style.transform = "translateY(-1px)")} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: isDone ? C.success + "22" : C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isDone ? 18 : 20, fontWeight: 700, color: isDone ? C.success : C.accent }}>{isDone ? "✓" : idx + 1}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{session.name}</div><div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{session.exercises.length} exos · {session.sets} séries</div></div>
              <span style={{ fontSize: 18, color: C.sub }}>›</span>
            </button>;
          })}
        </div>
        {weekComplete && currentWeek < 12 && <button onClick={() => sv(undefined, undefined, undefined, currentWeek + 1)} style={{ ...btnStyle, width: "100%", padding: "14px 0", marginTop: 24, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>Passer à la semaine {currentWeek + 1} →</button>}
        {weekComplete && currentWeek === 12 && <div style={{ fontFamily: F, fontSize: 16, fontWeight: 800, textAlign: "center", marginTop: 24, padding: 24, background: C.successLight, borderRadius: 14, color: C.success }}>🎉 Programme terminé ! Bravo {profile?.name} !</div>}
      </div>
    </div>
  );

  // HOME
  const latestW = weights.length ? weights[weights.length - 1].kg : profile?.weight;
  const lost = profile ? profile.weight - latestW : 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}><link href={LINK} rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 24, paddingRight: 16, paddingLeft: 16, paddingBottom: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: FD, fontSize: 26, color: C.text, margin: 0, fontWeight: 700 }}>Hello {profile?.name} 🌸</h1>
            <p style={{ fontFamily: F, fontSize: 13, color: C.sub, margin: "4px 0 0" }}>{profile?.age} ans · {profile?.height} cm · Objectif {profile?.targetWeight} kg</p>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 3px 10px rgba(212,107,123,.3)" }}>🌸</div>
        </div>

        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>Synchronisation multi-appareils</div>
          <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginBottom: 10 }}>
            Utilise le même code famille sur les 2 appareils pour partager les données.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={familyCodeInput}
              onChange={(e) => setFamilyCodeInput(e.target.value)}
              placeholder="ex: famille-rose"
              style={{ flex: 1, fontFamily: F, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px", outline: "none" }}
            />
            <button
              onClick={async () => {
                const normalized = setFamilyCode(familyCodeInput);
                setFamilyCodeState(normalized);
                setFamilyCodeInput(normalized);
                const data = await loadAllData();
                setProfile(data.profile);
                setProgress(data.progress || {});
                setWeights(data.weights || []);
                setCurrentWeek(data.week || 1);
              }}
              style={{ ...btnStyle, padding: "9px 12px", fontSize: 12 }}
            >
              Enregistrer
            </button>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: familyCode ? C.success : C.sub, marginTop: 8 }}>
            {familyCode ? `Code actif: ${familyCode}` : "Aucun code actif (mode local uniquement)"}
          </div>
        </div>

        <button onClick={() => setView("weight")} style={{ fontFamily: F, textAlign: "left", cursor: "pointer", width: "100%", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 10px rgba(0,0,0,.03)", transition: "transform .15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚖️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{latestW} kg</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{lost > 0 ? `${lost.toFixed(1)} kg perdus` : "Début du programme"} · Objectif {profile?.targetWeight} kg</div>
          </div>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentLight, padding: "6px 12px", borderRadius: 10 }}>Peser →</div>
        </button>

        <div style={{ background: C.card, borderRadius: 18, padding: "18px 20px", marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.text }}>Progression</span>
            <span style={{ fontFamily: F, fontWeight: 800, fontSize: 14, color: C.accent }}>{totalSessions > 0 ? Math.round((totalDone / totalSessions) * 100) : 0}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.border }}>
            <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.success})`, width: totalSessions > 0 ? `${(totalDone / totalSessions) * 100}%` : "0%", transition: "width .5s" }} />
          </div>
          <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 8 }}>{totalDone} séance{totalDone > 1 ? "s" : ""} · Semaine {currentWeek}/12</div>
        </div>

        <button onClick={() => setView("week")} style={{ fontFamily: F, textAlign: "left", cursor: "pointer", width: "100%", background: phase?.gradient, border: `1.5px solid ${(phase?.color) + "55"}`, borderRadius: 18, padding: "18px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16, transition: "transform .15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: phase?.color + "55", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontSize: 22, fontWeight: 700, color: C.text }}>S{currentWeek}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Semaine {currentWeek}</div><div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{phase?.name} · {doneThisWeek}/{sessions.length} séances</div></div>
          <div style={{ fontFamily: F, fontSize: 22, color: C.accent }}>→</div>
        </button>

        <h3 style={{ fontFamily: FD, fontSize: 18, color: C.text, margin: "0 0 12px", fontWeight: 600 }}>Les 3 phases</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PHASES.map(p => {
            const pW = program.filter(w => p.weeks.includes(w.week));
            const pS = pW.flatMap(w => w.sessions);
            const pDone = pS.filter(s => typeof progress[s.id] === "number").length;
            const locked = p.weeks[0] > currentWeek;
            return (
              <div key={p.id} style={{ background: C.card, border: `1.5px solid ${p.weeks.includes(currentWeek) ? p.color : C.border}`, borderRadius: 14, padding: "14px 16px", opacity: locked ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, fontWeight: 800, color: C.text }}>{p.id}</div>
                  <div style={{ flex: 1 }}><div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div><div style={{ fontFamily: F, fontSize: 11, color: C.sub }}>Sem. {p.weeks[0]}–{p.weeks[3]} · {pDone}/{pS.length}</div></div>
                  {pDone === pS.length && pS.length > 0 && <span style={{ fontSize: 18, color: C.success }}>✓</span>}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: C.border, marginTop: 10 }}><div style={{ height: "100%", borderRadius: 2, background: p.color, width: pS.length ? `${(pDone / pS.length) * 100}%` : "0%", transition: "width .5s" }} /></div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={async () => { if (confirm("Tout réinitialiser ?")) { await sv(null, {}, [], 1); setView("onboarding"); } }} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 11, cursor: "pointer", textDecoration: "underline", opacity: 0.5 }}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}
