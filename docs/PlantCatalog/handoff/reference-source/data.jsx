// PlantCatalog — sample data.
// Mirrors the PlantCareProfile shape from PROMPT_PLANT_CATALOG_UI.md.
// Numbers are integer mm, °C, lux, µS/cm, days, etc — same precision policy as the rest of the app.

window.PC_PLANTS = [
  // ── Grönsaker ─────────────────────────────────────────────
  {
    id: "solanum-lycopersicum", commonName: "Tomat", commonNameEn: "Tomato",
    scientificName: "Solanum lycopersicum", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 12, maxC: 33 }, light: { minLux: 3000, maxLux: 55000 },
    soilMoisture: { minPct: 20, maxPct: 60 }, nutrientEC: { minMicroS: 350, maxMicroS: 2000 },
    humidity: { minPct: 40, maxPct: 80 }, soilTypes: ["Väldränerad", "Lerjord"],
    sowingMethod: "Förså inomhus i mars, plantera ut efter frost",
    waterFrequency: "Var 2–3:e dag", spreadMm: 500, rowSpacingMm: 600, daysToMaturity: 75,
  },
  {
    id: "cucumis-sativus", commonName: "Gurka", commonNameEn: "Cucumber",
    scientificName: "Cucumis sativus", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 15, maxC: 32 }, light: { minLux: 3500, maxLux: 50000 },
    soilMoisture: { minPct: 50, maxPct: 75 }, nutrientEC: { minMicroS: 400, maxMicroS: 1800 },
    humidity: { minPct: 60, maxPct: 90 }, soilTypes: ["Väldränerad", "Mullrik"],
    sowingMethod: "Förså inomhus april, plantera ut efter midsommar",
    waterFrequency: "Dagligen i värme", spreadMm: 400, rowSpacingMm: 1000, daysToMaturity: 55,
  },
  {
    id: "lactuca-sativa", commonName: "Sallad", commonNameEn: "Lettuce",
    scientificName: "Lactuca sativa", category: "vegetable", sunCategory: "Halvskugga",
    temperature: { minC: 4, maxC: 24 }, light: { minLux: 2000, maxLux: 30000 },
    soilMoisture: { minPct: 40, maxPct: 70 }, nutrientEC: { minMicroS: 280, maxMicroS: 1200 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik", "Lerjord"],
    sowingMethod: "Direktså maj–augusti, så i omgångar",
    waterFrequency: "Var 2:a dag", spreadMm: 200, rowSpacingMm: 250, daysToMaturity: 35,
  },
  {
    id: "daucus-carota", commonName: "Morot", commonNameEn: "Carrot",
    scientificName: "Daucus carota", category: "vegetable", sunCategory: "Full sol / Halvskugga",
    temperature: { minC: 4, maxC: 30 }, light: { minLux: 2000, maxLux: 40000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 250, maxMicroS: 1400 },
    humidity: { minPct: 40, maxPct: 75 }, soilTypes: ["Sandjord", "Lättlera"],
    sowingMethod: "Direktså april–juli, gallra till 5 cm",
    waterFrequency: "Var 3–4:e dag", spreadMm: 50, rowSpacingMm: 250, daysToMaturity: 70,
  },
  {
    id: "capsicum-annuum", commonName: "Paprika", commonNameEn: "Bell pepper",
    scientificName: "Capsicum annuum", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 15, maxC: 32 }, light: { minLux: 4000, maxLux: 55000 },
    soilMoisture: { minPct: 40, maxPct: 65 }, nutrientEC: { minMicroS: 500, maxMicroS: 2200 },
    humidity: { minPct: 50, maxPct: 75 }, soilTypes: ["Väldränerad", "Mullrik"],
    sowingMethod: "Förså inomhus februari, ut efter frost",
    waterFrequency: "Var 2–3:e dag", spreadMm: 400, rowSpacingMm: 500, daysToMaturity: 90,
  },
  {
    id: "capsicum-frutescens", commonName: "Chili", commonNameEn: "Chili pepper",
    scientificName: "Capsicum frutescens", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 18, maxC: 35 }, light: { minLux: 5000, maxLux: 55000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 500, maxMicroS: 2400 },
    humidity: { minPct: 40, maxPct: 70 }, soilTypes: ["Väldränerad"],
    sowingMethod: "Förså inomhus januari–februari",
    waterFrequency: "Var 2–3:e dag", spreadMm: 350, rowSpacingMm: 450, daysToMaturity: 110,
  },
  {
    id: "pisum-sativum", commonName: "Ärtor", commonNameEn: "Pea",
    scientificName: "Pisum sativum", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 5, maxC: 26 }, light: { minLux: 2500, maxLux: 45000 },
    soilMoisture: { minPct: 40, maxPct: 70 }, nutrientEC: { minMicroS: 200, maxMicroS: 1200 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Lerjord", "Mullrik"],
    sowingMethod: "Direktså april–maj längs spaljé",
    waterFrequency: "Var 3:e dag", spreadMm: 80, rowSpacingMm: 400, daysToMaturity: 65,
  },
  {
    id: "beta-vulgaris", commonName: "Rödbeta", commonNameEn: "Beetroot",
    scientificName: "Beta vulgaris", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 5, maxC: 28 }, light: { minLux: 2500, maxLux: 40000 },
    soilMoisture: { minPct: 40, maxPct: 65 }, nutrientEC: { minMicroS: 300, maxMicroS: 1600 },
    humidity: { minPct: 45, maxPct: 75 }, soilTypes: ["Mullrik", "Lerjord"],
    sowingMethod: "Direktså maj–juni, gallra till 10 cm",
    waterFrequency: "Var 3:e dag", spreadMm: 100, rowSpacingMm: 300, daysToMaturity: 60,
  },
  {
    id: "spinacia-oleracea", commonName: "Spenat", commonNameEn: "Spinach",
    scientificName: "Spinacia oleracea", category: "vegetable", sunCategory: "Halvskugga",
    temperature: { minC: 2, maxC: 22 }, light: { minLux: 1500, maxLux: 25000 },
    soilMoisture: { minPct: 50, maxPct: 80 }, nutrientEC: { minMicroS: 300, maxMicroS: 1500 },
    humidity: { minPct: 50, maxPct: 85 }, soilTypes: ["Mullrik"],
    sowingMethod: "Direktså mars–april och augusti",
    waterFrequency: "Var 2:a dag", spreadMm: 100, rowSpacingMm: 250, daysToMaturity: 40,
  },
  {
    id: "allium-cepa", commonName: "Lök", commonNameEn: "Onion",
    scientificName: "Allium cepa", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 5, maxC: 28 }, light: { minLux: 3000, maxLux: 45000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 300, maxMicroS: 1600 },
    humidity: { minPct: 40, maxPct: 70 }, soilTypes: ["Sandjord", "Mullrik"],
    sowingMethod: "Sätt sättlök april, eller förså frö",
    waterFrequency: "Var 4:e dag", spreadMm: 100, rowSpacingMm: 250, daysToMaturity: 110,
  },
  {
    id: "brassica-oleracea-capitata", commonName: "Vitkål", commonNameEn: "Cabbage",
    scientificName: "Brassica oleracea capitata", category: "vegetable", sunCategory: "Full sol",
    temperature: { minC: 4, maxC: 25 }, light: { minLux: 3000, maxLux: 45000 },
    soilMoisture: { minPct: 50, maxPct: 75 }, nutrientEC: { minMicroS: 400, maxMicroS: 2000 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik", "Lerjord"],
    sowingMethod: "Förså inomhus mars, plantera ut maj",
    waterFrequency: "Var 2:a dag", spreadMm: 450, rowSpacingMm: 600, daysToMaturity: 95,
  },

  // ── Kryddor ───────────────────────────────────────────────
  {
    id: "ocimum-basilicum", commonName: "Basilika", commonNameEn: "Basil",
    scientificName: "Ocimum basilicum", category: "herb", sunCategory: "Full sol",
    temperature: { minC: 15, maxC: 35 }, light: { minLux: 4000, maxLux: 50000 },
    soilMoisture: { minPct: 40, maxPct: 70 }, nutrientEC: { minMicroS: 350, maxMicroS: 1800 },
    humidity: { minPct: 50, maxPct: 75 }, soilTypes: ["Väldränerad"],
    sowingMethod: "Förså inomhus, plantera ut efter midsommar",
    waterFrequency: "Dagligen", spreadMm: 250, rowSpacingMm: 300, daysToMaturity: 30,
  },
  {
    id: "anethum-graveolens", commonName: "Dill", commonNameEn: "Dill",
    scientificName: "Anethum graveolens", category: "herb", sunCategory: "Full sol",
    temperature: { minC: 5, maxC: 28 }, light: { minLux: 3000, maxLux: 40000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 250, maxMicroS: 1400 },
    humidity: { minPct: 40, maxPct: 70 }, soilTypes: ["Väldränerad", "Sandjord"],
    sowingMethod: "Direktså maj–juli i omgångar",
    waterFrequency: "Var 3:e dag", spreadMm: 150, rowSpacingMm: 250, daysToMaturity: 40,
  },
  {
    id: "petroselinum-crispum", commonName: "Persilja", commonNameEn: "Parsley",
    scientificName: "Petroselinum crispum", category: "herb", sunCategory: "Halvskugga",
    temperature: { minC: 4, maxC: 26 }, light: { minLux: 2000, maxLux: 35000 },
    soilMoisture: { minPct: 40, maxPct: 70 }, nutrientEC: { minMicroS: 300, maxMicroS: 1500 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik"],
    sowingMethod: "Direktså april–maj, gror långsamt",
    waterFrequency: "Var 2–3:e dag", spreadMm: 200, rowSpacingMm: 300, daysToMaturity: 75,
  },
  {
    id: "thymus-vulgaris", commonName: "Timjan", commonNameEn: "Thyme",
    scientificName: "Thymus vulgaris", category: "herb", sunCategory: "Full sol",
    temperature: { minC: -5, maxC: 32 }, light: { minLux: 3500, maxLux: 50000 },
    soilMoisture: { minPct: 15, maxPct: 45 }, nutrientEC: { minMicroS: 200, maxMicroS: 1200 },
    humidity: { minPct: 30, maxPct: 60 }, soilTypes: ["Sandjord", "Stenig"],
    sowingMethod: "Förså februari eller plantera sticklingar",
    waterFrequency: "Var 5–7:e dag", spreadMm: 300, rowSpacingMm: 400, daysToMaturity: 85,
  },
  {
    id: "mentha-piperita", commonName: "Mynta", commonNameEn: "Mint",
    scientificName: "Mentha piperita", category: "herb", sunCategory: "Halvskugga",
    temperature: { minC: 0, maxC: 30 }, light: { minLux: 2000, maxLux: 35000 },
    soilMoisture: { minPct: 55, maxPct: 85 }, nutrientEC: { minMicroS: 300, maxMicroS: 1600 },
    humidity: { minPct: 50, maxPct: 85 }, soilTypes: ["Mullrik", "Fuktig"],
    sowingMethod: "Plantera sticklingar — håll i kruka, sprider sig kraftigt",
    waterFrequency: "Var 2:a dag", spreadMm: 350, rowSpacingMm: 400, daysToMaturity: 70,
  },
  {
    id: "allium-schoenoprasum", commonName: "Gräslök", commonNameEn: "Chives",
    scientificName: "Allium schoenoprasum", category: "herb", sunCategory: "Full sol / Halvskugga",
    temperature: { minC: -10, maxC: 28 }, light: { minLux: 2500, maxLux: 40000 },
    soilMoisture: { minPct: 35, maxPct: 65 }, nutrientEC: { minMicroS: 250, maxMicroS: 1400 },
    humidity: { minPct: 40, maxPct: 75 }, soilTypes: ["Mullrik"],
    sowingMethod: "Direktså april eller dela ruska",
    waterFrequency: "Var 3:e dag", spreadMm: 200, rowSpacingMm: 250, daysToMaturity: 90,
  },

  // ── Bär ───────────────────────────────────────────────────
  {
    id: "fragaria-ananassa", commonName: "Jordgubbe", commonNameEn: "Strawberry",
    scientificName: "Fragaria × ananassa", category: "berry", sunCategory: "Full sol",
    temperature: { minC: 5, maxC: 30 }, light: { minLux: 3000, maxLux: 45000 },
    soilMoisture: { minPct: 50, maxPct: 75 }, nutrientEC: { minMicroS: 400, maxMicroS: 1800 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik", "Surt"],
    sowingMethod: "Plantera revplantor sen sommar eller tidig vår",
    waterFrequency: "Var 2:a dag", spreadMm: 300, rowSpacingMm: 400, daysToMaturity: 120,
  },
  {
    id: "rubus-idaeus", commonName: "Hallon", commonNameEn: "Raspberry",
    scientificName: "Rubus idaeus", category: "berry", sunCategory: "Full sol",
    temperature: { minC: -5, maxC: 28 }, light: { minLux: 3000, maxLux: 45000 },
    soilMoisture: { minPct: 50, maxPct: 75 }, nutrientEC: { minMicroS: 400, maxMicroS: 1800 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik", "Lätt surt"],
    sowingMethod: "Plantera rotskott höst eller vår, längs spaljé",
    waterFrequency: "Var 3:e dag", spreadMm: 500, rowSpacingMm: 1500, daysToMaturity: 365,
  },
  {
    id: "ribes-nigrum", commonName: "Svarta vinbär", commonNameEn: "Blackcurrant",
    scientificName: "Ribes nigrum", category: "berry", sunCategory: "Full sol / Halvskugga",
    temperature: { minC: -15, maxC: 28 }, light: { minLux: 2500, maxLux: 40000 },
    soilMoisture: { minPct: 50, maxPct: 75 }, nutrientEC: { minMicroS: 400, maxMicroS: 2000 },
    humidity: { minPct: 50, maxPct: 80 }, soilTypes: ["Mullrik", "Lerjord"],
    sowingMethod: "Plantera buske vår eller höst",
    waterFrequency: "Var 4:e dag", spreadMm: 1200, rowSpacingMm: 1500, daysToMaturity: 730,
  },

  // ── Blommor ───────────────────────────────────────────────
  {
    id: "calendula-officinalis", commonName: "Ringblomma", commonNameEn: "Pot marigold",
    scientificName: "Calendula officinalis", category: "flower", sunCategory: "Full sol / Halvskugga",
    temperature: { minC: 3, maxC: 30 }, light: { minLux: 2000, maxLux: 45000 },
    soilMoisture: { minPct: 30, maxPct: 65 }, nutrientEC: { minMicroS: 200, maxMicroS: 1400 },
    humidity: { minPct: 40, maxPct: 75 }, soilTypes: ["Vanlig trädgårdsjord"],
    sowingMethod: "Direktså april–maj, självsår sig villigt",
    waterFrequency: "Var 3–4:e dag", spreadMm: 250, rowSpacingMm: 300, daysToMaturity: 55,
  },
  {
    id: "tagetes-patula", commonName: "Tagetes", commonNameEn: "French marigold",
    scientificName: "Tagetes patula", category: "flower", sunCategory: "Full sol",
    temperature: { minC: 8, maxC: 32 }, light: { minLux: 3000, maxLux: 50000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 250, maxMicroS: 1400 },
    humidity: { minPct: 40, maxPct: 70 }, soilTypes: ["Väldränerad"],
    sowingMethod: "Förså april, plantera ut efter frost — håller nematoder borta",
    waterFrequency: "Var 3:e dag", spreadMm: 200, rowSpacingMm: 250, daysToMaturity: 50,
  },
  {
    id: "tropaeolum-majus", commonName: "Indiankrasse", commonNameEn: "Nasturtium",
    scientificName: "Tropaeolum majus", category: "flower", sunCategory: "Full sol",
    temperature: { minC: 8, maxC: 30 }, light: { minLux: 2500, maxLux: 45000 },
    soilMoisture: { minPct: 30, maxPct: 60 }, nutrientEC: { minMicroS: 150, maxMicroS: 1000 },
    humidity: { minPct: 40, maxPct: 70 }, soilTypes: ["Mager", "Väldränerad"],
    sowingMethod: "Direktså maj, mager jord ger fler blommor",
    waterFrequency: "Var 3–4:e dag", spreadMm: 300, rowSpacingMm: 400, daysToMaturity: 50,
  },
];

// Seed beds — same shape as the Planera-tab Rect, with PlantPlacement entries.
window.PC_BEDS = [
  {
    id: "rect-1", label: "Bädd 1", width: 2000, height: 1000, rotationDeg: 0, cx: 4000, cy: 4000,
    plants: [
      { placementId: "p1", plantId: "solanum-lycopersicum", displayName: "Tomat", offsetX: -400, offsetY: 0, count: 3 },
      { placementId: "p2", plantId: "lactuca-sativa", displayName: "Sallad", offsetX: 600, offsetY: 0, count: 10 },
    ],
  },
  {
    id: "rect-2", label: "Bädd 2", width: 1500, height: 1500, rotationDeg: 25, cx: 8000, cy: 4000,
    plants: [
      { placementId: "p3", plantId: "solanum-lycopersicum", displayName: "Tomat", offsetX: 0, offsetY: 0, count: 2 },
    ],
  },
  {
    id: "rect-3", label: "Bädd 3", width: 3000, height: 800, rotationDeg: 0, cx: 6000, cy: 6500,
    plants: [
      { placementId: "p4", plantId: "daucus-carota", displayName: "Morot", offsetX: 0, offsetY: 0, count: 15 },
    ],
  },
];

// Planted IDs that aren't in any bed yet.
window.PC_INITIAL_PLANNED = ["capsicum-frutescens", "pisum-sativum"];

// Sample plot for the Planera-tab placeholder.
window.PC_PLOT = {
  boundaryRect: { id: "plot", cx: 6000, cy: 5000, width: 12000, height: 8000 },
  northRotationDeg: 0,
};

// Category labels (sv)
window.PC_CATEGORY_LABELS = {
  vegetable: "Grönsak",
  herb: "Krydda",
  berry: "Bär",
  flower: "Blomma",
};

// Category accents — map each category to a token from the design system palette.
window.PC_CATEGORY_TINT = {
  vegetable: { fg: "var(--bed-700)", bg: "var(--bed-100)", dot: "var(--bed-500)" },
  herb:      { fg: "var(--success-700)", bg: "var(--success-100)", dot: "var(--success-500)" },
  berry:     { fg: "var(--soil-700)", bg: "var(--soil-100)", dot: "var(--soil-500)" },
  flower:    { fg: "var(--sun-700)", bg: "var(--sun-100)", dot: "var(--sun-500)" },
};

// ─── Number formatting (matches the codebase's fmtNum / fmtInt) ───
window.fmtNum = function (n, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(decimals).replace(".", ",");
};
window.fmtInt = function (n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
