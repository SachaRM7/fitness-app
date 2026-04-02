"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";

const F = `'Nunito', sans-serif`;
const FD = `'Cormorant Garamond', serif`;
const LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap";

const C = {
  bg: "#FAF5F0",
  card: "#FDFEFE",
  text: "#2D3436",
  sub: "#636E72",
  accent: "#E57373",
  accentLight: "#FDECEC",
  accentDark: "#D96060",
  success: "#81C784",
  successLight: "#E8F5E9",
  phase1: "#E8B4B8",
  phase2: "#A8C8DC",
  phase3: "#B5D4A7",
  border: "#EDE4DE",
  danger: "#E07070",
  gradient1: "linear-gradient(135deg, #E8B4B8 0%, #F6DFE2 100%)",
  gradient2: "linear-gradient(135deg, #A8C8DC 0%, #D4E6F0 100%)",
  gradient3: "linear-gradient(135deg, #B5D4A7 0%, #DCE9D4 100%)",
};

const SP = { 1: 4, 2: 8, 3: 16, 4: 24, 5: 32, 6: 48 };
const R = { container: 16, button: 12, round: "50%" };

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

const KEYS = { profile: "mef-profile", progress: "mef-progress", weights: "mef-weights", week: "mef-week", familyCode: "mef-family-code", imcTooltipSeen: "mef-imc-tooltip-seen" };

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

const hapticSuccess = () => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
  } catch {}
};

const btnStyle = {
  fontFamily: F,
  fontSize: 14,
  fontWeight: 700,
  border: "none",
  borderRadius: R.button,
  padding: `${SP[3] - 4}px ${SP[4]}px`,
  cursor: "pointer",
  background: C.accent,
  color: "#fff",
  minHeight: 44,
};

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

function Onboarding({ onDone, onRecoverByFamilyCode }) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState(["", "", "", "", ""]);
  const [familyCodeInput, setFamilyCodeInput] = useState("");
  const [recovering, setRecovering] = useState(false);
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
  const tryRecover = async () => {
    if (!familyCodeInput.trim() || recovering) return;
    setRecovering(true);
    try {
      const found = await onRecoverByFamilyCode?.(familyCodeInput);
      if (!found) {
        alert("Aucun compte trouvé avec ce code. Tu peux continuer l'onboarding.");
      }
    } finally {
      setRecovering(false);
    }
  };

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
        {step === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px", marginBottom: 18, textAlign: "left" }}>
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Code famille (optionnel)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={familyCodeInput}
                onChange={(e) => setFamilyCodeInput(e.target.value)}
                placeholder="ex: famille-rose"
                style={{ flex: 1, fontFamily: F, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px", outline: "none" }}
              />
              <button
                onClick={tryRecover}
                disabled={!familyCodeInput.trim() || recovering}
                style={{ ...btnStyle, fontSize: 12, padding: "9px 12px", opacity: familyCodeInput.trim() && !recovering ? 1 : 0.45 }}
              >
                {recovering ? "..." : "Récupérer"}
              </button>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 8 }}>
              Si un compte existe déjà avec ce code, l'app charge directement les données.
            </div>
          </div>
        )}
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showImcTooltip, setShowImcTooltip] = useState(false);
  const chartData = weights.map(w => ({ date: new Date(w.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), kg: w.kg }));
  const currentWeight = (weights.length ? weights[weights.length - 1].kg : profile.weight);
  const lost = profile.weight - currentWeight;
  const remaining = currentWeight - profile.targetWeight;
  const bmi = currentWeight / ((profile.height / 100) ** 2);

  const bmiColor = bmi < 25 ? "#81C784" : bmi < 30 ? "#FFB74D" : "#E57373";
  const bmiProgress = Math.min(100, Math.max(0, (bmi / 40) * 100));
  const bmiRadius = 19;
  const bmiCirc = 2 * Math.PI * bmiRadius;
  const bmiDashOffset = bmiCirc - (bmiCirc * bmiProgress) / 100;
  const labelFloated = isInputFocused || !!newW;
  const showPlaceholder = !labelFloated;

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(KEYS.imcTooltipSeen);
      setShowImcTooltip(!seen);
    } catch {
      setShowImcTooltip(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, paddingRight: 16, paddingLeft: 16, paddingBottom: 100 }}>
      <link href={LINK} rel="stylesheet" />
      <button onClick={onBack} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Retour</button>
      <h2 style={{ fontFamily: FD, fontSize: 26, color: C.text, margin: "0 0 4px", fontWeight: 700 }}>Suivi du poids</h2>
      <p style={{ fontFamily: F, fontSize: 13, color: C.sub, margin: "0 0 20px" }}>Pèse-toi 1× par semaine, le matin à jeun. Le programme s'adapte automatiquement.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Perdu", value: `${lost >= 0 ? "-" : "+"}${Math.abs(lost).toFixed(1)}`, unit: "kg", color: lost >= 0 ? C.success : C.danger },
          { label: "Actuel", value: currentWeight.toFixed(1), unit: "kg", color: C.accent },
          { label: "Restant", value: remaining > 0 ? remaining.toFixed(1) : "0", unit: "kg", color: C.phase2 },
        ].map((s, i) => (
          <div key={i} style={{ background: "#FFFFFF", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid #F1F2F6", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontFamily: F, fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: s.color, margin: "4px 0 0" }}>
              {s.value}<span style={{ fontSize: 10, fontWeight: 600, color: C.sub }}> {s.unit}</span>
            </div>
          </div>
        ))}
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "12px 10px", border: "1px solid #F1F2F6", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, position: "relative" }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>IMC</div>
            <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2 }}>
              {bmi < 25 ? "Normal" : bmi < 30 ? "Surpoids" : "Obésité"}
            </div>
          </div>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={bmiRadius} fill="none" stroke="#F1F2F6" strokeWidth="5" />
            <circle
              cx="24"
              cy="24"
              r={bmiRadius}
              fill="none"
              stroke={bmiColor}
              strokeWidth="5"
              strokeDasharray={bmiCirc}
              strokeDashoffset={bmiDashOffset}
              strokeLinecap="round"
              transform="rotate(-90 24 24)"
              style={{ transition: "stroke-dashoffset .4s ease" }}
            />
            <text x="24" y="27" textAnchor="middle" fontFamily={F} fontSize="9" fontWeight="800" fill="#2D3436">{bmi.toFixed(1)}</text>
          </svg>
        </div>
      </div>

      {showImcTooltip && (
        <div style={{ background: "#FFF9F2", border: "1px solid #F6D6B8", borderRadius: 12, padding: "10px 12px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>ℹ️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F, fontSize: 12, color: C.text, lineHeight: 1.4 }}>
              L'IMC est un indicateur parmi d'autres, l'important est ton ressenti !
            </div>
            <button
              onClick={() => {
                try { window.localStorage.setItem(KEYS.imcTooltipSeen, "1"); } catch {}
                setShowImcTooltip(false);
              }}
              style={{ marginTop: 6, fontFamily: F, fontSize: 11, fontWeight: 700, border: "none", background: "transparent", color: C.accent, cursor: "pointer", padding: 0 }}
            >
              Compris
            </button>
          </div>
        </div>
      )}

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
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px 14px", border: "1px solid #F1F2F6", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 20, opacity: 0.3 }}>
          <div style={{ height: 10, width: 90, background: "#E5E7EB", borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 140, borderRadius: 10, background: "linear-gradient(180deg, #E5E7EB 0%, #F3F4F6 100%)", position: "relative", overflow: "hidden" }}>
            <svg viewBox="0 0 320 140" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0,110 C35,95 60,118 95,96 C130,74 170,104 210,82 C245,62 280,80 320,52" fill="none" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ fontFamily: F, fontSize: 12, color: C.text, margin: "10px 0 0" }}>Ajoute au moins 2 pesées pour voir ta courbe.</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <label
            style={{
              position: "absolute",
              left: 12,
              top: labelFloated ? -8 : 8,
              fontFamily: F,
              fontSize: labelFloated ? 11 : 13,
              fontWeight: 600,
              color: labelFloated ? C.accent : C.sub,
              background: "#FFFFFF",
              padding: labelFloated ? "0 4px" : 0,
              transition: "all .18s ease",
              pointerEvents: "none",
            }}
          >
            Poids (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={newW}
            onChange={e => setNewW(e.target.value)}
            placeholder={showPlaceholder ? "Ex: 70.5" : ""}
            onKeyDown={e => { if (e.key === "Enter" && newW) { onAddWeight(Number(newW)); setNewW(""); } }}
            style={{ fontFamily: F, fontSize: 15, fontWeight: 600, width: "100%", padding: "24px 50px 8px 12px", border: `1.5px solid ${isInputFocused ? C.accent : "#F1F2F6"}`, borderRadius: 12, background: "#FFFFFF", color: C.text, outline: "none", boxSizing: "border-box", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-30%)", fontFamily: F, fontSize: 12, color: C.sub, fontWeight: 700 }}>kg</span>
        </div>
        <button onClick={() => { if (newW) { onAddWeight(Number(newW)); setNewW(""); } }} style={{ fontFamily: F, fontSize: 14, fontWeight: 800, border: "none", borderRadius: 12, padding: "12px 18px", cursor: "pointer", background: "#E57373", color: "#FFFFFF", opacity: newW ? 1 : 0.45 }}>
          + Ajouter
        </button>
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
  const [recentDoneIndex, setRecentDoneIndex] = useState(null);
  const [curSet, setCurSet] = useState((persistedState?.setsDone || 0) + 1);
  const [showTimer, setShowTimer] = useState(persistedState?.pendingRest?.exerciseIndex ?? null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
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

  useEffect(() => {
    if (recentDoneIndex === null) return;
    const t = setTimeout(() => setRecentDoneIndex(null), 500);
    return () => clearTimeout(t);
  }, [recentDoneIndex]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20, paddingRight: 16, paddingLeft: 16, paddingBottom: 170 }}>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: showTimer !== null ? 0.35 : 1, transition: "opacity .25s ease" }}>
        {session.exercises.map((ex, i) => {
          const isDone = done.has(i);
          return (
            <div
              key={i}
              style={{
                minHeight: 80,
                padding: 16,
                background: isDone ? "#E8F5E9" : C.card,
                borderRadius: 14,
                border: `1px solid ${isDone ? "#4CAF5033" : C.border}`,
                opacity: isDone ? 0.9 : 1,
                transition: "all .35s ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isDone ? "#4CAF501A" : C.accentLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                    color: isDone ? "#4CAF50" : C.text,
                    transform: isDone && recentDoneIndex === i ? "scale(1.12)" : "scale(1)",
                    transition: "transform .5s cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  {isDone ? "✓" : ex.icon}
                </div>
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
                    setRecentDoneIndex(null);
                    if (showTimer === i) {
                      setShowTimer(null);
                      setTimerSeconds(0);
                      setTimerTotalSeconds(0);
                    }
                    persistSessionState(nextDone, curSet, null);
                    return;
                  }

                  hapticSuccess();
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
                    setRecentDoneIndex(i);
                    persistSessionState(nextDone, curSet, null);
                  }
                }} style={{ fontFamily: F, fontSize: 12, fontWeight: 700, border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", background: isDone ? "#E8F5E9" : C.accentLight, color: isDone ? "#4CAF50" : C.accent, flexShrink: 0 }}>
                  {isDone ? "Décocher" : "Fait ✓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showTimer !== null && session.exercises[showTimer] && !done.has(showTimer) && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: allDone ? 104 : 24,
            width: "min(448px, calc(100vw - 24px))",
            background: "#FFFFFFEE",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            padding: "14px 16px",
            zIndex: 101,
          }}
        >
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>Repose-toi</div>
          <div style={{ fontFamily: F, fontSize: 13, color: C.text, marginTop: 2 }}>Exercice en cours : {session.exercises[showTimer].name}</div>
          <div style={{ fontFamily: F, fontSize: 12, color: C.sub, marginTop: 2 }}>
            {session.exercises[showTimer + 1] ? `Suivant : ${session.exercises[showTimer + 1].name}` : "Dernier exercice de la série"}
          </div>
          <div style={{ marginTop: 10 }}>
            <Timer seconds={timerSeconds || session.exercises[showTimer].rest} totalSeconds={timerTotalSeconds || session.exercises[showTimer].rest} autoStart onDone={() => {
              const nextDone = new Set(done);
              nextDone.add(showTimer);
              setDone(nextDone);
              setRecentDoneIndex(showTimer);
              setShowTimer(null);
              setTimerSeconds(0);
              setTimerTotalSeconds(0);
              persistSessionState(nextDone, curSet, null);
            }} />
          </div>
        </div>
      )}

      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 120, overflow: "hidden" }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${5 + (i * 4)}%`,
                top: "-10%",
                fontSize: 16 + (i % 4),
                animation: `confettiFall ${900 + (i % 5) * 180}ms ease-out forwards`,
                opacity: 0.9,
              }}
            >
              {["🌸", "✨", "🎉", "🌷"][i % 4]}
            </span>
          ))}
          <style>{`@keyframes confettiFall {0%{transform:translateY(0) rotate(0deg)}100%{transform:translateY(120vh) rotate(360deg);opacity:0}}`}</style>
        </div>
      )}

      {allDone && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            background: "rgba(250,245,240,0.76)",
            borderTop: `1px solid ${C.border}`,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <button onClick={() => {
              if (curSet < session.sets) {
                const nextSet = curSet + 1;
                setCurSet(nextSet);
                setDone(new Set());
                setRecentDoneIndex(null);
                setShowTimer(null);
                setTimerSeconds(0);
                setTimerTotalSeconds(0);
                persistSessionState(new Set(), nextSet, null);
              } else {
                hapticSuccess();
                setShowConfetti(true);
                setTimeout(() => {
                  setShowConfetti(false);
                  onComplete();
                }, 700);
              }
            }}
              style={{ ...btnStyle, width: "100%", padding: "14px 0", background: curSet < session.sets ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : `linear-gradient(135deg, ${C.success}, #4A9A5A)`, boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>
              {curSet < session.sets ? `Série terminée → Série ${curSet + 1}` : "🎉 Séance terminée !"}
            </button>
          </div>
        </div>
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
  const getCompletionTimestamp = useCallback((value) => {
    if (typeof value === "number" && Number.isFinite(value)) return Number(value);
    if (value && typeof value === "object") {
      if (typeof value.completedAt === "number" && Number.isFinite(value.completedAt)) return Number(value.completedAt);
      if (typeof value.endsAt === "number" && Number.isFinite(value.endsAt)) return Number(value.endsAt);
    }
    return null;
  }, []);

  const doneThisWeek = sessions.filter(s => Number.isFinite(getCompletionTimestamp(progress[s.id]))).length;
  const weekComplete = doneThisWeek === sessions.length && sessions.length > 0;
  const totalDone = Object.values(progress).filter(v => Number.isFinite(getCompletionTimestamp(v))).length;
  const totalSessions = program.reduce((a, w) => a + w.sessions.length, 0);

  const dayKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const sessionCompletionTimestamps = useMemo(() => {
    return Object.values(progress)
      .map((value) => getCompletionTimestamp(value))
      .filter((ts) => Number.isFinite(ts));
  }, [progress, getCompletionTimestamp]);

  const completedDaySet = useMemo(
    () => new Set(sessionCompletionTimestamps.map((ts) => dayKey(new Date(ts)))),
    [sessionCompletionTimestamps]
  );

  const latestCompletionTs = useMemo(
    () => (sessionCompletionTimestamps.length ? Math.max(...sessionCompletionTimestamps) : null),
    [sessionCompletionTimestamps]
  );

  const streakDays = useMemo(() => {
    const arr = [];
    const anchor = latestCompletionTs ? new Date(latestCompletionTs) : new Date();
    anchor.setHours(12, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [latestCompletionTs]);

  const currentStreak = useMemo(() => {
    if (!latestCompletionTs) return 0;

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const latest = new Date(latestCompletionTs);
    latest.setHours(12, 0, 0, 0);

    const dayDiff = Math.round((today - latest) / 86400000);
    if (dayDiff > 1) return 0;

    let streak = 0;
    const cursor = new Date(latest);

    while (completedDaySet.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [completedDaySet, latestCompletionTs]);

  if (view === "loading") return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <link href={LINK} rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        <div style={{ borderRadius: "0 0 32px 32px", background: "#F3ECE8", height: 120, marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)", animation: "shimmer 1.4s infinite" }} />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "#EFE7E2", borderRadius: 16, height: i === 2 ? 96 : 72, marginBottom: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)", animation: "shimmer 1.4s infinite" }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer {0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );

  if (view === "onboarding") return (
    <Onboarding
      onDone={async p => { await sv(p, {}, [{ date: Date.now(), kg: p.weight }], 1); setView("home"); }}
      onRecoverByFamilyCode={async (code) => {
        const normalized = setFamilyCode(code);
        setFamilyCodeState(normalized);
        setFamilyCodeInput(normalized);
        if (!normalized) return false;

        const data = await loadAllData();
        if (!data?.profile) return false;

        setProfile(data.profile);
        setProgress(data.progress || {});
        setWeights(data.weights || []);
        setCurrentWeek(data.week || 1);
        setView("home");
        return true;
      }}
    />
  );

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

  const headerProgress = totalSessions > 0 ? Math.max(0, Math.min(100, (totalDone / totalSessions) * 100)) : 0;
  const avatarRadius = 25;
  const avatarCirc = 2 * Math.PI * avatarRadius;
  const avatarDashOffset = avatarCirc - (avatarCirc * headerProgress) / 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}><link href={LINK} rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
        <div style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)", borderRadius: "0 0 32px 32px", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h1 style={{ fontFamily: FD, fontSize: 24, color: "#2D3436", margin: 0, fontWeight: 600 }}>Hello {profile?.name}</h1>
              <p style={{ fontFamily: F, fontSize: 12, color: "#4F5B62", margin: 0, fontWeight: 600 }}>{profile?.age} ans · {profile?.height} cm</p>
            </div>
            <div style={{ width: 56, height: 56, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, boxSizing: "border-box" }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: "absolute", inset: 0 }}>
                <circle cx="28" cy="28" r={avatarRadius} fill="none" stroke="#F1E6E6" strokeWidth="3" />
                <circle
                  cx="28"
                  cy="28"
                  r={avatarRadius}
                  fill="none"
                  stroke="#E57373"
                  strokeWidth="3"
                  strokeDasharray={avatarCirc}
                  strokeDashoffset={avatarDashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  style={{ transition: "stroke-dashoffset .45s ease" }}
                />
              </svg>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #FDECEC 0%, #FFFFFF 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🌸
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingRight: 16, paddingLeft: 16 }}>
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: C.text }}>Série de victoires</div>
              <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: C.accent }}>
                {currentStreak} jour{currentStreak > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
              {streakDays.map((d, i) => {
                const done = completedDaySet.has(dayKey(d));
                return (
                  <div key={i} style={{ borderRadius: 10, background: done ? "#FFF3F6" : "#F7F7F8", border: `1px solid ${done ? "#F4C6D0" : C.border}`, padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontFamily: F, fontSize: 10, color: C.sub }}>
                      {d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.2 }}>{done ? "🌸" : "·"}</div>
                  </div>
                );
              })}
            </div>
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
                hapticSuccess();
                const normalized = setFamilyCode(familyCodeInput);
                setFamilyCodeState(normalized);
                setFamilyCodeInput(normalized);
                const data = await loadAllData();
                setProfile(data.profile);
                setProgress(data.progress || {});
                setWeights(data.weights || []);
                setCurrentWeek(data.week || 1);
              }}
              style={{ fontFamily: F, fontSize: 12, fontWeight: 700, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "8px 10px", minHeight: 40, background: "transparent", color: C.accent, cursor: "pointer" }}
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          {PHASES.map(p => {
            const pW = program.filter(w => p.weeks.includes(w.week));
            const pS = pW.flatMap(w => w.sessions);
            const pDone = pS.filter(s => Number.isFinite(getCompletionTimestamp(progress[s.id]))).length;
            const locked = p.weeks[0] > currentWeek;
            const isActive = p.weeks.includes(currentWeek);
            return (
              <div
                key={p.id}
                style={{
                  background: isActive ? "#FFF9F9" : C.card,
                  border: isActive ? "2px solid #E57373" : `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  opacity: locked ? 0.5 : 1,
                  filter: locked ? "grayscale(100%)" : "none",
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, fontWeight: 800, color: C.text }}>
                    {locked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="9" rx="2" stroke="#6B7280" strokeWidth="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : p.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div>
                      {isActive && (
                        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: "#FFFFFF", background: "#E57373", padding: "2px 7px", borderRadius: 999 }}>
                          En cours
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F, fontSize: 11, color: C.sub, marginTop: 2 }}>
                      Sem. {p.weeks[0]}–{p.weeks[3]} · {pDone}/{pS.length}
                    </div>
                  </div>
                  {pDone === pS.length && pS.length > 0 && <span style={{ fontSize: 18, color: C.success }}>✓</span>}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: C.border, marginTop: 12 }}>
                  <div style={{ height: "100%", borderRadius: 2, background: p.color, width: pS.length ? `${(pDone / pS.length) * 100}%` : "0%", transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={async () => { if (confirm("Tout réinitialiser ?")) { await sv(null, {}, [], 1); setView("onboarding"); } }} style={{ fontFamily: F, background: "none", border: "none", color: C.sub, fontSize: 11, cursor: "pointer", textDecoration: "underline", opacity: 0.5 }}>Réinitialiser</button>
        </div>
        </div>
      </div>
    </div>
  );
}
