"use client";

// Cette ligne indique à Vercel de ne pas essayer de pré-générer la page (évite l'erreur de build)
export const dynamic = "force-dynamic"; 

import { useState, useEffect, useCallback, useMemo } from "react";
// Assure-toi d'avoir bien fait : npm install recharts
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

// Le reste de ton code (const F, const C, etc.)
const F = `'Nunito', sans-serif`;
// ...