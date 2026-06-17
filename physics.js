// physics.js — Shunt simulation helpers for VP shunt comparison
// All pressures and resistances use cmH₂O internally.
// MM2CM = 1.3595: divide cmH₂O by MM2CM to get mmHg (display conversion only).

const MM2CM = 1.3595; // 1 mmHg = 1.3595 cmH₂O — used for display conversion only

// SiphonGuard constants (cmH₂O units).
const SG_R_HIGH   = 0.98;  // cmH₂O/(mL/hr) — extra resistance when SG spiral path is active
const SG_Q_SWITCH = 140;   // mL/hr — approximate activation flow

// Position-dependent IAP: when upright, abdominal contents add hydrostatic pressure at the
// peritoneal catheter tip (pelvis). Effective abdominal column height varies with habitus.
const IAP_POS_DELTA_MAX = { slim: 10, normal: 15, obese: 22 }; // cmH₂O at 90°
function iapPositionDelta(habitus, angle_deg) {
  const maxD = IAP_POS_DELTA_MAX[habitus] ?? 15;
  return +(maxD * Math.sin(angle_deg * Math.PI / 180)).toFixed(2);
}

// Default CSF / fluid viscosity: water at 37°C ≈ CSF viscosity at body temperature.
// Actual CSF viscosity varies ~0.69–1.0 mPa·s; water at 37°C = 0.692 mPa·s.
const DEFAULT_VISC_PA_S = 6.92e-4; // Pa·s

// Hydrostatic siphon effect for VP shunt (returns cmH₂O).
// Column = lateral ventricles (~87.5 % of height) − umbilicus/abdominal cavity (~60 % of height)
// ≈ 27.5 % of body height. For 180 cm → ~50 cmH₂O at 90°.
// Body habitus affects IAP (handled separately), not this anatomical column.
function siphonEffect(height_cm, habitus, angle_deg) {
  if (angle_deg <= 0) return 0;
  return +(height_cm * 0.275 * Math.sin(angle_deg * Math.PI / 180)).toFixed(3);
}

function agdPressure(v, angle_deg) {
  if (!v.cur_agd || v.agdType === 'none') return 0;
  const sinA = Math.sin(angle_deg * Math.PI / 180);
  if (v.agdType === 'gravity') return v.cur_agd * sinA;
  const t = Math.min(1, Math.max(0, (angle_deg - 10) / 35));
  return v.cur_agd * t;
}

function openingThreshold(v, angle_deg, siphon, distalPressure_cm = 0) {
  if (v.agdType === 'delta' || v.agdType === 'spiral') {
    const compensation = Math.min(siphon, v.cur_agd || 0);
    return v.cur_p + compensation - siphon + distalPressure_cm;
  }
  return v.cur_p + agdPressure(v, angle_deg) - siphon + distalPressure_cm;
}

// Hagen-Poiseuille catheter resistance (laminar, Newtonian flow).
// R [cmH₂O/(mL/hr)] = (8·η·L) / (π·r⁴) / 98.0665 / 3.6e9
// Verify: L=1.2m, r=0.5mm, η=6.92e-4 → R ≈ 0.096 cmH₂O/(mL/hr)
function catheterResistance({ length_cm = 120, inner_mm = 1.0, visc_pa_s = DEFAULT_VISC_PA_S } = {}) {
  if (!length_cm || !inner_mm) return 0;
  const L = length_cm / 100;        // cm → m
  const r = (inner_mm / 2) / 1000;  // mm (diameter) → m (radius)
  return (8 * visc_pa_s * L) / (Math.PI * Math.pow(r, 4)) / 98.0665 / 3.6e9;
}

function flowSiphonGuard(icp, v, siphon, distalPressure_cm = 0, cR = 0) {
  const thr = v.cur_p - siphon + distalPressure_cm;
  if (icp <= thr) return 0;
  const dp = icp - thr;
  const rLow  = v.R + cR;
  const rHigh = v.R + SG_R_HIGH + cR;
  const dpSwitch = SG_Q_SWITCH * rLow;
  if (dp <= dpSwitch) return dp / rLow;
  return dp / rHigh;
}

function flowOSV(icp, v, siphon, distalPressure_cm = 0, cR = 0) {
  const c  = v.close_p  - siphon + distalPressure_cm;
  const d  = v.dp_p     - siphon + distalPressure_cm;
  const sf = v.safety_p - siphon + distalPressure_cm;
  const rf = v.reg_flow;
  if (icp <= c) return 0;
  if (icp < d) return Math.max(0, (icp - c) / Math.max(0.01, d - c) * rf);
  if (icp < sf) return rf;
  return Math.min(48, rf + (icp - sf) / (0.40 + cR));
}

function computeFlow(icp, v, angle_deg, siphon, distalPressure_cm = 0, cR = 0) {
  if (v.flowType === 'osv') return flowOSV(icp, v, siphon, distalPressure_cm, cR);
  if (v.flowType === 'sg') return flowSiphonGuard(icp, v, siphon, distalPressure_cm, cR);
  const thr = openingThreshold(v, angle_deg, siphon, distalPressure_cm);
  return Math.max(0, (icp - thr) / (v.R + cR));
}

function normalICPRange(angle_deg) {
  const t = angle_deg / 90;
  // cmH₂O: lying 0–6.8, standing −6.8–2.7 (≡ 0–5 / −5–+2 mmHg)
  return { lo: -6.8 * t, hi: 6.8 - 4.1 * t };
}

function respiratoryWaveform(time_s, amplitude_cm = 1.0, rate_bpm = 12, baseline_cm = 0) {
  const omega = 2 * Math.PI * rate_bpm / 60;
  return baseline_cm + amplitude_cm * Math.sin(omega * time_s);
}

// Cardiac ICP pulsation — P1 (percussion), P2 (tidal), P3 (dicrotic) waves.
// phi ∈ [0,1) = phase within one cardiac cycle. Returns deviation from mean ICP (cmH₂O).
// Waveform is zero-mean over one cycle; P1 peak ≈ +amplitude_cm.
// Shape: sharp P1, shallow shoulder into P2 (≈93% of P1), P3 bump on descending limb (~50%),
// then long diastolic decline. Matches clinical waveform (see reference image).
// Periodic diastolic term g(phi+1,...) ensures smooth cycle-boundary transition.
// _C_MEAN and _C_PEAK are numerical cycle constants so the waveform is zero-mean
// and P1 peak ≈ +amplitude_cm.
const _C_MEAN = 0.164;
const _C_PEAK = 0.867;
function cardiacICPWave(phi, amplitude_cm) {
  const g = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2);
  const raw =
    1.00 * g(phi, 0.200, 0.042) +   // P1 — percussion (sharp, tallest)
   -0.15 * g(phi, 0.285, 0.028) +   // shallow shoulder/notch between P1 and P2
    0.95 * g(phi, 0.360, 0.062) +   // P2 — tidal wave (broad, ~93% of P1)
    0.52 * g(phi, 0.550, 0.055) +   // P3 — dicrotic (~50% of P1 above diastolic)
   -0.48 * (g(phi, 0.800, 0.125) + g(phi + 1, 0.800, 0.125)); // diastolic fall (periodic)
  return amplitude_cm * (raw - _C_MEAN) / _C_PEAK;
}

// Build a combined ICP + IAP oscillation look-up table covering at least one respiratory cycle.
// iap_osc values are anti-phase to resp ICP: IAP rises during inspiration (diaphragm descends).
// iap_resp_ratio: IAP respiratory amplitude / ICP respiratory amplitude (typically 2–3).
function buildPulsatileLUT({ hr_bpm, resp_rate_bpm, resp_amp_cm, cardiac_amp_cm,
                             iap_resp_ratio = 2.5 } = {}) {
  const T_card = 60 / hr_bpm;
  const T_resp = 60 / resp_rate_bpm;
  const spCard = 20;                              // samples per cardiac cycle
  const nCards = Math.ceil(T_resp / T_card) + 1;  // enough to cover ≥ one resp cycle
  const N  = nCards * spCard;
  const dt = T_card / spCard;
  const icp_osc = new Float32Array(N);
  const iap_osc = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t   = i * dt;
    const phi = (t % T_card) / T_card;
    const rp  = 2 * Math.PI * t / T_resp;
    icp_osc[i] = cardiacICPWave(phi, cardiac_amp_cm) + resp_amp_cm * Math.sin(rp);
    iap_osc[i] = -resp_amp_cm * iap_resp_ratio * Math.sin(rp); // anti-phase
  }
  return { N, icp_osc, iap_osc };
}

function averageFlowOverCycle(flowFn, points) {
  if (!points.length) return 0;
  return points.reduce((sum, p) => sum + flowFn(p.icp_cm), 0) / points.length;
}
