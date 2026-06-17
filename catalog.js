// ═══════════════════════════════════════════════════════════════════════
// VP SHUNT VENTILKATALOG  –  Ventiler på det danske marked
// ═══════════════════════════════════════════════════════════════════════
//
// Alle trykniveauer — datafelter OG visningsetiketter — er i cmH₂O.
// 1 cmH₂O = 10 mmH₂O ≈ 0,74 mmHg. (Fabrikant-IFU'er angiver ofte mmH₂O.)
// Filen indlæses af index.html, som automatisk konverterer til mmHg internt.
//
// ─── Feltguide ─────────────────────────────────────────────────────────
//  mfg          : Fabrikant
//  type         : "single" = enkelt ventil  |  "family" = variantfamilie
//  id           : Unik nøgle
//  name/label   : Visningsnavn i tabellen
//  badge        : Farvebadge — b-fixed | b-prog | b-grav | b-flow | b-as
//  typeLbl      : Kort typebeskrivelse
//  note         : Fritekst-bemærkning
//
//  flowType     : "dp"  = differentialtryk   (standard)
//                 "osv" = flowreguleret       (OSV II)
//                 "sg"  = SiphonGuard
//  R            : Hydraulisk modstand  [cmH₂O / (mL/time)]  — pr. ventil.
//                 Bestemmer hældningen på flow-vs-ICP-kurven (lav R = stejl kurve).
//                 Certas Plus: 0.041 (udledt af IFU Rev M, Graf 1 — næsten fladt
//                 pres-flow-forløb). GAV 2.0 / proGAV / M.Blue+: 0.10 (IFU-61 V04).
//                 Øvrige ventiler: 0.05 (lav pladsholder — moderne ventiler er
//                 designet til minimal modstand; kræver fabrikantens pres-flow-data).
//
//  cur_p_cm     : Aktuel/standard åbningstryk  [cmH₂O]
//  p_min_cm     : Minimum justerbart tryk      [cmH₂O]   (kun justerbare)
//  p_max_cm     : Maximum justerbart tryk      [cmH₂O]   (kun justerbare)
//  p_settings   : Fast indstillingsliste  →  [{ label: "…", val_cm: X }]
//                 Brug val_cm: null for "Virtual Off" / blokeret indstilling
//
//  agdType      : "none" | "gravity" | "delta" | "spiral"
//  cur_agd_cm   : Aktuel AGD-tillæg           [cmH₂O]
//  agd_min_cm   : Minimum justerbar AGD        [cmH₂O]
//  agd_max_cm   : Maximum justerbar AGD        [cmH₂O]
//  pAdj         : false | "slider" | "select"
//  agdAdj       : false | "slider"
//  showTotal    : true → vis samlet stående tryk
//  lying_cm     : Eksplicit liggende åbningstryk til visning  [cmH₂O]
//  standing_cm  : Eksplicit stående åbningstryk til visning   [cmH₂O]
//
//  OSV-specifikke felter (flowType: "osv"):
//    reg_flow    : Reguleret flowrate  [mL/time]
//    close_p_cm  : Lukketryk                    [cmH₂O]
//    dp_p_cm     : Åbningstryk, reguleret zone  [cmH₂O]
//    safety_p_cm : Sikkerhedsventiltryk          [cmH₂O]
//
//  sgAvailable  : true → ventilen kan kombineres med SiphonGuard. Tabellen
//                 viser en til/fra-knap. Fra = flowType "dp", Til = "sg".
//
//  opening_range : Åbningsinterval (valgfrit). Vises via "Åbningsintervaller"-skift.
//                  source: 'ifu'      = fabrikantspecifikation fra IFU-trykniveaudiagram
//                  source: 'research' = uafhængig forskning (Czosnyka Lab / Miyake 2016)
//                  ref: "IFU-61 V04 Fig. 7"  — kildeangivelse til visning
//    Format A — nominalværdi med tolerance:
//      { nominal_cm: 5, tolerance_cm: 2, source: 'ifu', ref: 'IFU-xx Fig. y' }
//    Format B — eksplicit interval:
//      { min_cm: 3.5, max_cm: 6.5, source: 'research' }
//    Udelad feltet (eller sæt til null) hvis data ikke er tilgængelige.
//
//  refs : Array af referencer der vises som links i tabellen.
//    { type: "mfg"|"sci"|"xray"|"review", label: "Kort tekst", url: "https://…" }
//    type-koder:
//      "mfg"    = fabrikantens produktside        (vises altid)
//      "ifu"    = IFU-downloadside                (vises altid)
//      "xray"   = røntgen-identifikationsbilleder (vises altid)
//      "rec"    = indstillingsanbefaling/-guide   (vises altid)
//      "sci"    = videnskabelig artikel (DOI foretrukket)  — kun avanceret tilstand
//      "review" = oversigtsartikel                         — kun avanceret tilstand
//
//  research : Uafhængige forskningsdata (valgfrit). Vises KUN i avanceret
//             tilstand — basistilstanden viser udelukkende fabrikantinformation.
//    { hysteresis_cm : Målt åbnings-/lukkehysterese [cmH₂O]  (null = ikke indsamlet)
//      note          : Resumé af uafhængige målinger (fritekst)
//      refs          : [{ type:"sci"|"review", label, url }]  — kilder
//    }
//    Yderligere målte felter kan tilføjes efter behov (alle i cmH₂O, _cm-suffiks).
//    Udelad feltet helt for ventiler uden forskningsdata.
//
//  catheter : Distalt kateter (valgfrit). Dimensioner vises i en egen kolonne
//             i avanceret tilstand. Udfyld kun felter fabrikanten faktisk oplyser.
//    { inner_mm, outer_mm, length_cm }   — udelad ukendte felter (null/fjern)
//
//  sources : Kildeangivelse pr. dataværdi (valgfrit, men anbefalet). Hver nøgle
//            er et feltnavn (eller et frit emne); værdien dokumenterer hvor tallet
//            stammer fra, og evt. hvordan det er udledt.
//    { <feltnavn>: { ref: "kilde", comment: "fx 'aflæst af graf' / udledningsmetode" } }
//    Giver enhver værdi en fast plads til reference + derivationskommentar.
// ═══════════════════════════════════════════════════════════════════════

const CATALOG_DATA = [

  // ────────────────────────────────────────────────────────────────────
  // B BRAUN / MIETHKE
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "B Braun / Miethke",
    type: "family",
    name: "GAV 2.0",
    badge: "b-fixed", badge2: "b-grav",
    typeLbl: "Fast", typeLbl2: "Gravitationel ASD",
    note: "",
    refs: [
      { type: "mfg",  label: "Miethke GAV 2.0",       url: "https://www.miethke.com/en/products/preadjusted-valves/gav-20/" },
      { type: "ifu",  label: "IFU",        url: "https://www.miethke.com/en/downloads/preadjusted-valves/#accordion-8631-8632" },
      { type: "rec",  label: "Anbefaling", url: "https://www.miethke.com/en/downloads/preadjusted-valves/#accordion-8631-8633" },
      { type: "xray", label: "Røntgen-ID", url: "https://www.miethke.com/en/products/preadjusted-valves/gav-20/#c2443" },
    ],
    variants: [
      {
        id: "gav2-5-20",
        label: "5/20",
        lying_cm: 5, standing_cm: 20,
        flowType: "dp", R: 0.10,
        cur_p_cm: 5, agdType: "gravity", cur_agd_cm: 15,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 5, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
      {
        id: "gav2-5-25",
        label: "5/25",
        lying_cm: 5, standing_cm: 25,
        flowType: "dp", R: 0.10,
        cur_p_cm: 5, agdType: "gravity", cur_agd_cm: 20,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 5, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
      {
        id: "gav2-5-30",
        label: "5/30",
        lying_cm: 5, standing_cm: 30,
        flowType: "dp", R: 0.10,
        cur_p_cm: 5, agdType: "gravity", cur_agd_cm: 25,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 5, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
      {
        id: "gav2-5-35",
        label: "5/35",
        lying_cm: 5, standing_cm: 35,
        flowType: "dp", R: 0.10,
        cur_p_cm: 5, agdType: "gravity", cur_agd_cm: 30,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 5, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
      {
        id: "gav2-10-25",
        label: "10/25",
        lying_cm: 10, standing_cm: 25,
        flowType: "dp", R: 0.10,
        cur_p_cm: 10, agdType: "gravity", cur_agd_cm: 15,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 10, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
      {
        id: "gav2-10-30",
        label: "10/30",
        lying_cm: 10, standing_cm: 30,
        flowType: "dp", R: 0.10,
        cur_p_cm: 10, agdType: "gravity", cur_agd_cm: 20,
        catheter: { inner_mm: 1.2, outer_mm: 2.5 },
        opening_range: { nominal_cm: 10, tolerance_cm: 2, source: 'ifu', ref: 'IFU-61 V04 Fig. 7' },
        sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "1–2 cmH₂O forskel ved 20 vs. 5 ml/h → R = 1,5/15 ≈ 0,10 cmH₂O/(ml/h)" } },
      },
    ],
  },

  {
    mfg: "B Braun / Miethke",
    type: "single",
    id: "progav2",
    name: "proGAV 2.0",
    badge: "b-prog", badge2: "b-as",
    typeLbl: "Programmerbar", typeLbl2: "Justerbar ASD",
    note: "Valgbar AGD: ingen, fast SA 2.0 (6 trin) eller justerbar proSA/M.Blue+. Active-Lock.",
    refs: [
      { type: "mfg",    label: "Miethke proGAV 2.0",  url: "https://www.miethke.com/en/products/adjustable-valves/progav-20/" },
      { type: "ifu",    label: "IFU",        url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8504-8500" },
      { type: "rec",    label: "Anbefaling", url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8504-8502" },
      { type: "xray",   label: "Røntgen-ID", url: "https://www.miethke.com/en/products/adjustable-valves/progav-20/#c2089" },
    ],
    flowType: "dp", R: 0.10,
    cur_p_cm: 5, p_min_cm: 0, p_max_cm: 20,
    agdType: "gravity", cur_agd_cm: 20,
    pAdj: "slider", agdAdj: false,
    agdOptions: [
      { label: "Ingen AGD",                                agdType: "none",    cur_agd_cm: 0  },
      { label: "SA 2.0 – 10 cmH₂O",                      agdType: "gravity", cur_agd_cm: 10 },
      { label: "SA 2.0 – 15 cmH₂O",                      agdType: "gravity", cur_agd_cm: 15 },
      { label: "SA 2.0 – 20 cmH₂O",                      agdType: "gravity", cur_agd_cm: 20 },
      { label: "SA 2.0 – 25 cmH₂O",                      agdType: "gravity", cur_agd_cm: 25 },
      { label: "SA 2.0 – 30 cmH₂O",                      agdType: "gravity", cur_agd_cm: 30 },
      { label: "SA 2.0 – 35 cmH₂O",                      agdType: "gravity", cur_agd_cm: 35 },
      { label: "proSA / M.Blue+ (justerbar, 10–40 cmH₂O)", agdType: "gravity", cur_agd_cm: 25,
        agdAdj: "slider", agd_min_cm: 10, agd_max_cm: 40 },
    ],
    agdOptionsDefault: 3,  // SA 2.0 – 20 cmH₂O
    opening_range: null,  // tolerance i IFU; ISO 7197; ikke numerisk specificeret i brochure
    catheter: { inner_mm: 1.2 },
    sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "Samme ventilmekanisme som GAV 2.0; R = 1,5/15 ≈ 0,10 cmH₂O/(mL/h)" } },
  },


  {
    mfg: "B Braun / Miethke",
    type: "single",
    id: "mblue",
    name: "M.blue",
    badge: "b-fixed", badge2: "b-as",
    typeLbl: "Fast", typeLbl2: "Justerbar ASD",
    note: "Fast differentailtryk i fire trin (FX800T–FX803T); gravitationel ASD justerbar 0–40 cmH₂O.",
    refs: [
      { type: "mfg", label: "Aesculap M.blue", url: "https://www.aesculapusa.com/en/healthcare-professionals/or-solutions/or-solutions-hydrocephalus/m-blue-valve.html" },
      { type: "ifu",  label: "IFU",        url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8495-8496" },
      { type: "rec",  label: "Anbefaling", url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8495-8497" },
      { type: "xray", label: "Røntgen-ID", url: "https://www.miethke.com/en/products/adjustable-valves/mblue-mblue-plus/#c280" },
    ],
    flowType: "dp", R: 0.10,
    cur_p_cm: 5,
    p_settings: [
      { label: "FX800T – 0 cmH₂O",  val_cm: 0  },
      { label: "FX801T – 5 cmH₂O",  val_cm: 5  },
      { label: "FX802T – 10 cmH₂O", val_cm: 10 },
      { label: "FX803T – 15 cmH₂O", val_cm: 15 },
    ],
    agdType: "gravity", cur_agd_cm: 20,
    agd_min_cm: 0, agd_max_cm: 40,
    pAdj: "select", agdAdj: "slider",
    showTotal: true,
    opening_range: null,
    catheter: { inner_mm: 1.2, outer_mm: 2.5 },
  },

  {
    mfg: "B Braun / Miethke",
    type: "single",
    id: "mblue-plus",
    name: "M.blue+ (proGAV 2.0 + M.blue)",
    badge: "b-prog", badge2: "b-as",
    typeLbl: "Programmerbar", typeLbl2: "Justerbar ASD",
    note: "Uafhængig kontrol af åbningstryk i begge stillinger. EO-fri sterilisering.",
    refs: [
      { type: "mfg",  label: "Aesculap M.Blue",  url: "https://www.aesculapusa.com/en/healthcare-professionals/or-solutions/or-solutions-hydrocephalus/m-blue-valve.html" },
      { type: "ifu",  label: "IFU",        url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8495-8496" },
      { type: "rec",  label: "Anbefaling", url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-8495-8497" },
      { type: "xray", label: "Røntgen-ID", url: "https://www.miethke.com/en/products/adjustable-valves/mblue-mblue-plus/#c280" },
    ],
    flowType: "dp", R: 0.10,
    cur_p_cm: 5, p_min_cm: 0, p_max_cm: 20,
    agdType: "gravity", cur_agd_cm: 25,
    agd_min_cm: 10, agd_max_cm: 40,
    pAdj: "slider", agdAdj: "slider",
    showTotal: true,
    opening_range: null,
    catheter: { inner_mm: 1.2 },
    sources: { R: { ref: "IFU-61 V04 Fig. 7 + tekst", comment: "Samme ventilmekanisme som GAV 2.0/proGAV; R = 1,5/15 ≈ 0,10 cmH₂O/(mL/h)" } },
  },

  {
    mfg: "B Braun / Miethke",
    type: "single",
    id: "mflow",
    name: "M.Flow",
    badge: "b-flow",
    typeLbl: "Flowreguleret",
    note: "Justerbar flow-reduktionsenhed; trin 0–10 + Real Off. Bruges i serie med en trykventil (fx proGAV). Positionsuafhængig. Active-Lock. MR-betinget 3T.",
    refs: [
      { type: "mfg", label: "Miethke M.Flow", url: "https://www.miethke.com/en/products/adjustable-valves/mflow/" },
      { type: "ifu",  label: "IFU",        url: "https://www.miethke.com/en/downloads/adjustable-valves/#accordion-13826-13822" },
      { type: "xray", label: "Røntgen-ID", url: "https://www.miethke.com/en/products/adjustable-valves/mflow/#c13910" },
    ],
    flowType: "dp",
    R: 0.11,
    cur_p_cm: 0,
    p_settings: [
      // r_val = hydraulisk modstand [cmH₂O/(mL/t)] udledt af IFU V2.1-tabel ved 5 og 50 mL/t.
      // Trin 0, 2, 6, 10 fra IFU; øvrige lineært interpoleret.
      { label: "0  – R ≈ 0,11 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.11 },
      { label: "1  – R ≈ 0,24 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.24 },
      { label: "2  – R ≈ 0,36 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.36 },
      { label: "3  – R ≈ 0,48 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.48 },
      { label: "4  – R ≈ 0,59 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.59 },
      { label: "5  – R ≈ 0,71 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.71 },
      { label: "6  – R ≈ 0,83 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.83 },
      { label: "7  – R ≈ 0,96 cmH₂O/(mL/t)", val_cm: 0, r_val: 0.96 },
      { label: "8  – R ≈ 1,09 cmH₂O/(mL/t)", val_cm: 0, r_val: 1.09 },
      { label: "9  – R ≈ 1,22 cmH₂O/(mL/t)", val_cm: 0, r_val: 1.22 },
      { label: "10 – R ≈ 1,36 cmH₂O/(mL/t)", val_cm: 0, r_val: 1.36 },
      { label: "Real Off (lukket)",            val_cm: 0, r_val: 99   },
    ],
    pAdj: "select", agdAdj: false,
    agdType: "none", cur_agd_cm: 0,
    opening_range: null,
    isFlowResistor: true,
  },

  // ────────────────────────────────────────────────────────────────────
  // INTEGRA / MEDIPLAST
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "Integra / Mediplast",
    type: "family",
    name: "OSV II (Orbis Sigma)",
    badge: "b-flow",
    typeLbl: "Flowreguleret",
    note: "Flowregulerende i specifikt interval",
    refs: [
      { type: "mfg",    label: "Integra OSV II",  url: "https://products.integralife.com/osv-ii-valve-unit/product/hydrocephalus-flow-regulating-valves-osv-ii-valves-osv-ii-valve-unit" },
      { type: "ifu",    label: "IFU",             url: "https://products.integralife.com/osv-ii-low-pro-three-piece-shunt-system/product/hydrocephalus-flow-regulating-valves-osv-ii-valves-osv-ii-low-pro-three-piece-shunt-system#IFUs" },
      { type: "xray",   label: "Røntgen-ID (IFU)", url: "https://products.integralife.com/osv-ii-low-pro-three-piece-shunt-system/product/hydrocephalus-flow-regulating-valves-osv-ii-valves-osv-ii-low-pro-three-piece-shunt-system#IFUs" },
    ],
    variants: [
      {
        id: "osv2",
        label: "Standard – 24 mL/time",
        flowType: "osv", R: 0.05,
        cur_p_cm: 0, agdType: "none", cur_agd_cm: 0,
        reg_flow: 24,
        close_p_cm: 8.0,   // 5.9 mmHg
        dp_p_cm:   13.1,   // 9.6 mmHg — åbningstryk, reguleret zone
        safety_p_cm: 29.9, // 22 mmHg — sikkerhedsventil
        opening_range: null,
        catheter: { inner_mm: 1.1 },
      },
      {
        id: "osv2-lf",
        label: "Low Flow – 12 mL/time",
        flowType: "osv", R: 0.05,
        cur_p_cm: 0, agdType: "none", cur_agd_cm: 0,
        reg_flow: 12,
        close_p_cm: 8.0,
        dp_p_cm:   13.1,
        safety_p_cm: 29.9,
        opening_range: null,
        catheter: { inner_mm: 1.1 },
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // INTEGRA (CODMAN)
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "Integra (Codman)",
    type: "family",
    name: "Hakim Fast Tryk",
    badge: "b-fixed",
    typeLbl: "Fast",
    note: "Ingen sifonbeskyttelse. Overdrænagerisiko i oprejst stilling.",
    refs: [
      { type: "mfg",    label: "Integra Hakim Precision", url: "https://products.integralife.com/codman-hakim-precision-fixed-pressure-valve/product/hydrocephalus-fixed-pressure-valves-codman-hakim-precision-fixed-pressure-valves-codman-hakim-precision-fixed-pressure-valve" },
      { type: "ifu",    label: "IFU",             url: "https://ifu.integralife.com/" },
      { type: "xray",   label: "Røntgen-ID (IFU)", url: "https://labeling.integralife.com/eifu/search?searchType=on&query=hakim&term=%28hakim%29+AND+%28%28obsolete_md%3Afalse%29+OR+%28-obsolete_md%3A%5B*+TO+*%5D%29%29&f.country=DK&searchMode=text&formattedSearch=hakim&maxFacetValues=100&f.userType_md=provider&sortBy=effective_md&sortDirection=DESC" },
    ],
    variants: [
      {
        id: "hakim-lp",
        label: "LP – 4 cmH₂O (2,9 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 4, agdType: "none", cur_agd_cm: 0,
        opening_range: null,
        catheter: { inner_mm: 1.0 },
      },
      {
        id: "hakim-mp",
        label: "MP – 9 cmH₂O (6,6 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 9, agdType: "none", cur_agd_cm: 0,
        opening_range: null,
        catheter: { inner_mm: 1.0 },
      },
      {
        id: "hakim-hp",
        label: "HP – 14 cmH₂O (10,3 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 14, agdType: "none", cur_agd_cm: 0,
        opening_range: null,
        catheter: { inner_mm: 1.0 },
      },
    ],
  },

  {
    mfg: "Integra (Codman)",
    type: "single",
    id: "hakim-prog",
    name: "Hakim Programmerbar",
    badge: "b-prog",
    typeLbl: "Programmerbar",
    note: "Ingen sifonbeskyttelse. Røntgenkontrol nødvendig efter indstilling og MRI.",
    refs: [
      { type: "mfg",    label: "Integra Hakim Prog.", url: "https://products.integralife.com/codman-hakim-programmable-valve/product/hydrocephalus-programmable-valves-codman-hakim-programmable-valve" },
      { type: "ifu",    label: "IFU",             url: "https://labeling.integralife.com/eifu/search?searchType=on&query=hakim&term=%28hakim%29+AND+%28%28obsolete_md%3Afalse%29+OR+%28-obsolete_md%3A%5B*+TO+*%5D%29%29&f.country=DK&searchMode=text&formattedSearch=hakim&maxFacetValues=100&f.userType_md=provider&sortBy=effective_md&sortDirection=DESC" },
      { type: "xray",   label: "Røntgen-ID (IFU)", url: "https://labeling.integralife.com/eifu/search?searchType=on&query=hakim&term=%28hakim%29+AND+%28%28obsolete_md%3Afalse%29+OR+%28-obsolete_md%3A%5B*+TO+*%5D%29%29&f.country=DK&searchMode=text&formattedSearch=hakim&maxFacetValues=100&f.userType_md=provider&sortBy=effective_md&sortDirection=DESC" },
    ],
    flowType: "dp", R: 0.05,
    cur_p_cm: 9, p_min_cm: 3, p_max_cm: 20,
    agdType: "none", cur_agd_cm: 0,
    pAdj: "slider", agdAdj: false,
    opening_range: null,
    catheter: { inner_mm: 1.0 },
  },

  {
    mfg: "Integra (Codman)",
    type: "single",
    id: "certas",
    name: "Certas Plus",
    badge: "b-prog", badge2: "b-asd-sg",
    typeLbl: "Programmerbar", typeLbl2: "Flowreguleret ASD",
    note: "SiphonGuard aktiveret som standard (kan slås fra herunder). MR-betinget (1,5 og 3 T).",
    refs: [
      { type: "mfg",    label: "Integra Certas Plus", url: "https://products.integralife.com/codman-certas-plus-programmable-valve/product/hydrocephalus-programmable-valves-codman-certas-plus-small-programmable-valve" },
      { type: "mfg",    label: "Integra SiphonGuard", url: "https://products.integralife.com/codman-siphonguard-csf-control-device/product/hydrocephalus-accessories-csf-accessories-codman-siphonguard-csf-control-device" },
      { type: "ifu",    label: "IFU",                 url: "https://labeling.integralife.com/eifu/search?searchType=on&query=certas&term=%28certas%29+AND+%28%28obsolete_md%3Afalse%29+OR+%28-obsolete_md%3A%5B*+TO+*%5D%29%29&f.country=DK&searchMode=text&formattedSearch=certas&maxFacetValues=100&f.userType_md=provider&sortBy=effective_md&sortDirection=DESC" },
      { type: "xray",   label: "Røntgen", url: "https://products.integralife.com/file/general/1544017150.pdf" },
    ],
    flowType: "sg",      // SiphonGuard som standard tilkoblet (slå fra → "dp")
    sgAvailable: true,   // SiphonGuard kan slås til/fra i tabellen (flowType dp ↔ sg)
    // R udledt af IFU Rev M, Graf 1: ventilen alene giver kun ~0,4–0,7 cmH₂O/(mL/time)
    // trykstigning hen over flowintervallet → ~0,041 cmH₂O/(mL/time).
    R: 0.041,
    cur_p_cm: 11,
    p_settings: [
      // Gennemsnitligt driftstryk ved 20 mL/time (≈ fysiologisk CSF-produktion) per
      // fabrikantens IFU Rev M (2024), Graf 1 — IKKE det statiske nulflow-åbningstryk
      // (som er ~R×20 lavere). Tolerance: ±2 cmH₂O (trin 1–3), ±2,5 (trin 4), ±3,5 (trin 5–7).
      { label: "1 – 2,5 cmH₂O",               val_cm: 2.5  },
      { label: "2 – 5 cmH₂O",                 val_cm: 5    },
      { label: "3 – 8 cmH₂O",                 val_cm: 8    },
      { label: "4 – 11 cmH₂O",                val_cm: 11   },
      { label: "5 – 14,5 cmH₂O",              val_cm: 14.5 },
      { label: "6 – 18 cmH₂O",                val_cm: 18   },
      { label: "7 – 21,5 cmH₂O",              val_cm: 21.5 },
      { label: "8 – Virtual Off (>40 cmH₂O)",  val_cm: 40 },
    ],
    agdType: "none", cur_agd_cm: 0,
    pAdj: "select", agdAdj: false,
    opening_range: null,
    catheter: {
      inner_mm: 1.0,    // Certas Plus IFU, distal kateter-test
      outer_mm: null,   // ikke oplyst i IFU
      length_cm: 120,
    },
    sources: {
      p_settings:    { ref: "Certas Plus IFU Rev M (2024), Graf 1", comment: "Gennemsnitligt driftstryk ved 20 mL/time, aflæst af graf" },
      R:             { ref: "Certas Plus IFU Rev M (2024), Graf 1", comment: "Udledt af pres-flow-grafens hældning (næsten fladt forløb)" },
      sg_activation: { ref: "Integra/Codman SiphonGuard produktspecifikation", comment: "Primær kanal lukker når flow > ~140 mL/time" },
      sg_resistance: { ref: "Certas Plus IFU, SiphonGuard pres-flow-graf", comment: "Aflæst: ~37 cmH₂O ved 50 mL/time → ~0,74 cmH₂O/(mL/time) total" },
      catheter:      { ref: "Certas Plus IFU, distal kateter-test", comment: "120 cm kateter, 1 mm indv. diameter; 37 cmH₂O ved 50 mL/time" },
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // MEDTRONIC
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "Medtronic",
    type: "single",
    id: "strata2",
    name: "Strata II",
    badge: "b-prog",
    typeLbl: "Programmerbar",
    note: "Ingen sifonbeskyttelse. Fås med deltakammer som Strata NSC.",
    refs: [
      { type: "mfg",  label: "Medtronic Strata MR II", url: "https://www.medtronic.com/en-us/healthcare-professionals/products/neurological/hydrocephalus-therapy/shunts-valves/strata-mr-ii-adjustable-pressure-valve-shunt.html" },
    ],
    flowType: "dp", R: 0.05,
    cur_p_cm: 7,
    p_settings: [
      { label: "0,5 (~3 cmH₂O)",  val_cm: 3  },
      { label: "1,0 (~7 cmH₂O)",  val_cm: 7  },
      { label: "1,5 (~11 cmH₂O)", val_cm: 11 },
      { label: "2,0 (~15 cmH₂O)", val_cm: 15 },
      { label: "2,5 (~19 cmH₂O)", val_cm: 19 },
    ],
    agdType: "none", cur_agd_cm: 0,
    pAdj: "select", agdAdj: false,
    opening_range: null,
  },

  {
    mfg: "Medtronic",
    type: "single",
    id: "strata-nsc",
    name: "Strata NSC",
    badge: "b-prog", badge2: "b-asd-delta",
    typeLbl: "Programmerbar", typeLbl2: "Delta ASD",
    note: "Integreret deltakammer stopper drænage ved negativt udløbstryk.",
    refs: [
      { type: "mfg",  label: "Medtronic Strata NSC", url: "https://global.medtronic.com/xg-en/healthcare-professionals/products/neurological/shunts/strata-nsc-adjustable-pressure-valve.html" },
    ],
    flowType: "dp", R: 0.05,
    cur_p_cm: 7,
    p_settings: [
      { label: "0,5 (~3 cmH₂O)",  val_cm: 3  },
      { label: "1,0 (~7 cmH₂O)",  val_cm: 7  },
      { label: "1,5 (~11 cmH₂O)", val_cm: 11 },
      { label: "2,0 (~15 cmH₂O)", val_cm: 15 },
      { label: "2,5 (~19 cmH₂O)", val_cm: 19 },
    ],
    agdType: "delta", cur_agd_cm: 20,
    pAdj: "select", agdAdj: false,
    opening_range: null,
  },

  {
    mfg: "Medtronic",
    type: "family",
    name: "Delta Valve",
    badge: "b-fixed", badge2: "b-asd-delta",
    typeLbl: "Fast", typeLbl2: "Delta ASD",
    note: "~20 cmH₂O ekstra modstand i oprejst stilling (deltakammer).",
    refs: [
      { type: "mfg",  label: "Medtronic Delta Valve", url: "https://www.medtronic.com/en-us/l/patients/treatments-therapies/hydrocephalus-shunt/delta-valves.html" },
    ],
    variants: [
      {
        id: "delta-lp",
        label: "LP – 4 cmH₂O (2,9 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 4, agdType: "delta", cur_agd_cm: 20,
        opening_range: null,
      },
      {
        id: "delta-mp",
        label: "MP – 9 cmH₂O (6,6 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 9, agdType: "delta", cur_agd_cm: 20,
        opening_range: null,
      },
      {
        id: "delta-hp",
        label: "HP – 14 cmH₂O (10,3 mmHg)",
        flowType: "dp", R: 0.05,
        cur_p_cm: 14, agdType: "delta", cur_agd_cm: 20,
        opening_range: null,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // SOPHYSA / PO MEDICAL
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "Sophysa / PO Medical",
    type: "single",
    id: "polaris",
    name: "Polaris",
    badge: "b-prog",
    typeLbl: "Programmerbar",
    note: "Sjælden-jord magnetprogrammering. Tolerance −1/+1,5 cmH₂O. MR-betinget.",
    refs: [
      { type: "mfg",    label: "Sophysa Polaris",   url: "https://www.sophysa.com/products/hydrocephalus/polaris/" },
      { type: "mfg",    label: "Sophysa SiphonX",   url: "https://www.sophysa.com/products/hydrocephalus/siphonx/" },
    ],
    flowType: "dp", R: 0.05,
    cur_p_cm: 9, p_min_cm: 3, p_max_cm: 20,
    agdType: "none", cur_agd_cm: 0,
    pAdj: "slider",
    agdOptions: [
      { label: "Ingen AGD",  agdType: "none",    cur_agd_cm: 0  },
      { label: "SiphonX",    agdType: "gravity", cur_agd_cm: 25 },
    ],
    agdOptionsDefault: 0,
    opening_range: null,
  },

  {
    mfg: "Sophysa / PO Medical",
    type: "single",
    id: "sm8",
    name: "Sophy mini SM8",
    badge: "b-prog",
    typeLbl: "Programmerbar",
    note: "Tolerance −1/+1,5 cmH₂O. Kompakt design.",
    refs: [
      { type: "mfg",    label: "Sophysa SM8",       url: "https://www.sophysa.com/products/hydrocephalus/sophy-mini-sm8/" },
      { type: "mfg",    label: "Sophysa SiphonX",   url: "https://www.sophysa.com/products/hydrocephalus/siphonx/" },
    ],
    flowType: "dp", R: 0.05,
    cur_p_cm: 9,
    p_settings: [
      { label: "1 – 4 cmH₂O",  val_cm: 4  },
      { label: "2 – 6 cmH₂O",  val_cm: 6  },
      { label: "3 – 8 cmH₂O",  val_cm: 8  },
      { label: "4 – 10 cmH₂O", val_cm: 10 },
      { label: "5 – 12 cmH₂O", val_cm: 12 },
      { label: "6 – 14 cmH₂O", val_cm: 14 },
      { label: "7 – 17 cmH₂O", val_cm: 17 },
      { label: "8 – 20 cmH₂O", val_cm: 20 },
    ],
    agdType: "none", cur_agd_cm: 0,
    pAdj: "select",
    agdOptions: [
      { label: "Ingen AGD",  agdType: "none",    cur_agd_cm: 0  },
      { label: "SiphonX",    agdType: "gravity", cur_agd_cm: 25 },
    ],
    agdOptionsDefault: 0,
    opening_range: null,
  },



  // ────────────────────────────────────────────────────────────────────
  // SCENARIER (ikke-ventiler)
  // ────────────────────────────────────────────────────────────────────
  {
    mfg: "Scenarier",
    type: "single",
    id: "evd",
    name: "EVD (ekstern ventrikeldrænage)",
    badge: "b-scenario",
    typeLbl: "Drænscenarie",
    note: "Drænhøjde refereret til foramen Monro (ydre øregang). Negativt = kammer under referenspunkt. Ingen IAP — drænager til ekstern beholder, ikke peritoneal kavitet.",
    refs: [],
    flowType: "dp",
    R: 0.001,
    cur_p_cm: 10, p_min_cm: -5, p_max_cm: 20,
    agdType: "none", cur_agd_cm: 0,
    pAdj: "slider",
    evd: true,
    opening_range: null,
  },

  {
    mfg: "Scenarier",
    type: "single",
    id: "valveless",
    name: "Ventilløs shunt",
    badge: "b-scenario",
    typeLbl: "Drænscenarie",
    note: "Ingen ventil; åbningstryk 0. Flow begrænset udelukkende af katetermodstand — slå 'Medregn katetermodstand' til for fysiologisk kurve.",
    refs: [],
    flowType: "dp",
    R: 0.001,
    cur_p_cm: 0,
    agdType: "none", cur_agd_cm: 0,
    pAdj: false,
    opening_range: null,
  },

];
