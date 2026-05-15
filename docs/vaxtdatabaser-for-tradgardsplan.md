# 🌱 Växtdatabaser för Koloniträdgårdsplaneraren

## Din app i korthet
Din app (`tradgardsplan-fas-2-klar-2-`) är en **kanvasbaserad 2D-redaktör för köksträdgårdar** (TypeScript/React, pnpm monorepo). Den hanterar redan geometri, sol/skugga, kollision och scen-serialisering. Det som saknas är **växtdata** — alltså just det du frågar om.

Nedan rankar jag de databaser/API:er som bäst matchar dina behov (vatten, sol, temperatur, jord, näring).

---

## 🏆 1. Open Plantbook — BÄST FÖR DIN APP
| | |
|---|---|
| **URL** | https://open.plantbook.io |
| **API-docs** | https://documenter.getpostman.com/view/12627470/TVsxBRjD |
| **Pris** | **Gratis** (kräver registrering + API-nyckel) |
| **Licens** | Fri att använda, community-driven |
| **Format** | REST API (JSON) |

### Varför den passar bäst
Open Plantbook är byggd specifikt för **sensordata och tröskelbaserade odlingsbehov** — exakt vad en trädgårdsplanerare behöver. Varje växt har **numeriska min/max-värden** som är lätta att programmatiskt jämföra och visualisera i ditt canvas.

### Data som returneras per växt:
```json
{
  "display_pid": "Solanum lycopersicum",
  "alias": "Tomato",
  "max_light_lux": 55000,
  "min_light_lux": 3000,
  "max_temp": 33,          // °C
  "min_temp": 12,           // °C
  "max_env_humid": 80,      // % luftfuktighet
  "min_env_humid": 15,
  "max_soil_moist": 60,     // % jordfuktighet
  "min_soil_moist": 20,
  "max_soil_ec": 2000,      // µS/cm (näringsbehov/konduktivitet)
  "min_soil_ec": 350
}
```

### Relevans för dina krav:
| Ditt behov | Open Plantbook | Kommentar |
|---|---|---|
| 💧 Vattenbehov | ✅ `min/max_soil_moist` | Numeriskt, perfekt |
| ☀️ Solbehov | ✅ `min/max_light_lux` + `min/max_light_mmol` | Kvantitativt! Kan kopplas till din sol/skugga-motor |
| 🌡️ Temperatur (klarar) | ✅ `min_temp` / `max_temp` | Direkt i °C |
| 🌡️ Optimal temperatur | ⚠️ Implicit (range = optimal) | min/max definierar toleranszon |
| 🪴 Jordtyp | ❌ Saknas | Inte explicit jord-klassificering |
| 🧪 Näringsbehov | ✅ `min/max_soil_ec` | Electrical conductivity = indirekt näring |

### Integrationsexempel i din app:
```typescript
// packages/plant-data/src/plantbook.ts
const API_BASE = "https://open.plantbook.io/api/v1";

interface PlantBookData {
  display_pid: string;
  alias: string;
  min_temp: number;
  max_temp: number;
  min_light_lux: number;
  max_light_lux: number;
  min_soil_moist: number;
  max_soil_moist: number;
  min_soil_ec: number;
  max_soil_ec: number;
}

export async function searchPlant(query: string, token: string): Promise<PlantBookData[]> {
  const res = await fetch(`${API_BASE}/plant/search?alias=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
```

---

## 🥈 2. Perenual — RIKAST DATA, MEN FREEMIUM
| | |
|---|---|
| **URL** | https://perenual.com/docs/api |
| **Pris** | Gratis: 100 req/dag. Premium: från $3/mån (3 000 req/dag) |
| **Format** | REST API (JSON) |

### Data som returneras per växt:
```json
{
  "common_name": "European Silver Fir",
  "scientific_name": ["Abies alba"],
  "watering": "Frequent",
  "watering_general_benchmark": { "value": "5-7", "unit": "days" },
  "sunlight": ["full sun", "part shade"],
  "hardiness": { "min": "7", "max": "7" },
  "soil": ["Rocky", "Dry", "Well-drained"],
  "growth_rate": "High",
  "maintenance": "Low",
  "care_level": "Medium",
  "drought_tolerant": false,
  "indoor": false,
  "poisonous_to_pets": false,
  "pest_susceptibility": ["Aphids", "Root rot"],
  "pruning_month": ["March", "April"],
  "flowering_season": "Spring",
  "harvest_season": "Autumn",
  "default_image": { "original_url": "..." }
}
```

### Relevans för dina krav:
| Ditt behov | Perenual | Kommentar |
|---|---|---|
| 💧 Vattenbehov | ✅ `watering` + `watering_general_benchmark` | Text + dagar |
| ☀️ Solbehov | ✅ `sunlight` | Kategoriskt (full sun / part shade) |
| 🌡️ Temperatur | ⚠️ `hardiness` (USDA-zoner) | Indirekt — behöver zon→°C-konvertering |
| 🪴 Jordtyp | ✅ `soil` | Array med jordtyper |
| 🧪 Näringsbehov | ❌ Saknas direkt | `maintenance` och `care_level` är proxy |
| 🖼️ Bilder | ✅ Fullständiga bilder | Stort plus för UI |
| 📋 Extra | ✅ Skadedjur, beskärning, skörd, giftighet | Väldigt rikt |

### Nackdel:
- Gratisnivån (100 req/dag) räcker för prototyp men inte produktion.
- Mycket data är **text/kategorier** (inte numerisk) — svårare att matcha mot din sol-motor.

---

## 🥉 3. Permapeople — ÖPPEN & PERMAKULTUR-FOKUSERAD
| | |
|---|---|
| **URL** | https://permapeople.org |
| **API-docs** | https://permapeople.org/knowledgebase/api-docs/ |
| **Pris** | **Gratis, öppen** |
| **Licens** | Öppen, icke-kommersiell organisation |
| **Format** | REST API (JSON) |

### Data som returneras:
```json
{
  "scientific_name": "Morus alba",
  "name": "White mulberry",
  "data": [
    { "key": "Water requirement", "value": "Moist" },
    { "key": "Light requirement", "value": "Full sun, partial sun/shade" },
    { "key": "USDA Hardiness zone", "value": "3-9" },
    { "key": "Soil type", "value": "Light (sandy), medium, heavy (clay)" },
    { "key": "Edible parts", "value": "Fruit, inner bark, leaves" },
    { "key": "Growth", "value": "Medium" }
  ]
}
```

### Relevans:
| Ditt behov | Permapeople | Kommentar |
|---|---|---|
| 💧 Vattenbehov | ✅ `Water requirement` | Textuellt |
| ☀️ Solbehov | ✅ `Light requirement` | Textuellt |
| 🌡️ Temperatur | ⚠️ `USDA Hardiness zone` | Indirekt |
| 🪴 Jordtyp | ✅ `Soil type` | Textuellt |
| 🧪 Näringsbehov | ❌ | Saknas |

### Fördel: 
Helt öppen och fri. Bygger på PFAF-data. Bra för permakulturfokuserade köksträdgårdar.

### Nackdel:
Data är key-value med fritext — kräver parsing/normalisering.

---

## 4. Plants For A Future (PFAF) — STÖRST DATABAS, MEN OFFLINE
| | |
|---|---|
| **URL** | https://pfaf.org |
| **Format** | **SQLite-databas** (köps som nedladdning) |
| **Pris** | Liten donation (~£5–10) |
| **Licens** | ⚠️ **Personlig/intern användning** — EJ redistribution i appar |

### Data:
8 000+ växter med: jordtyp, skuggtolerans, fuktighet, pH, vindtolerans, tillväxthastighet, härdighet (UK), ätlighet, medicinskt, kvävefixerare, m.m.

### Varför inte #1:
- **Licensproblem**: Får inte bäddas in i distribuerad mjukvara.
- Inget API — du måste ladda SQLite-filen.
- Men **utmärkt som referenskälla** om du bygger din egen dataset.

---

## 5. OpenFarm — ODLINGS-FOKUSERAD
| | |
|---|---|
| **URL** | https://openfarm.cc |
| **GitHub** | https://github.com/openfarmcc/OpenFarm |
| **Format** | REST API |
| **Pris** | Gratis, open source |

Exempel: `https://openfarm.cc/api/v1/crops/cherry-tomato`

Bra för odlingsguider (sow/harvest-datum, spacing), men har **begränsad data om temperatur/sol/jord** jämfört med alternativen ovan.

---

## 6. Trefle.io — ⚠️ NEDLAGD
Var den mest populära öppna växt-API:n men projektet har **stängt ned** (SSL-certifikat ogiltigt, API svarar inte). Nämns bara som varning — använd inte.

---

## 📊 Jämförelsetabell

| Egenskap | Open Plantbook | Perenual | Permapeople | PFAF | OpenFarm |
|---|:---:|:---:|:---:|:---:|:---:|
| 💧 Vatten | ✅ Numerisk | ✅ Text+dagar | ✅ Text | ✅ Text | ⚠️ |
| ☀️ Sol/ljus | ✅ Lux (numerisk) | ✅ Kategorier | ✅ Text | ✅ Text | ⚠️ |
| 🌡️ Temperatur | ✅ °C min/max | ⚠️ USDA-zon | ⚠️ USDA-zon | ⚠️ UK hardy | ❌ |
| 🪴 Jordtyp | ❌ | ✅ Array | ✅ Text | ✅ Detaljerad | ⚠️ |
| 🧪 Näring | ✅ EC µS/cm | ❌ | ❌ | ⚠️ Indirekt | ❌ |
| 💰 Gratis | ✅ | ⚠️ 100/dag | ✅ | ⚠️ Köp DB | ✅ |
| 📡 API | ✅ REST | ✅ REST | ✅ REST | ❌ SQLite | ✅ REST |
| 🖼️ Bilder | ❌ | ✅ | ❌ | ❌ | ✅ |
| 🔓 Licens | Fri | Kommersiell | Öppen | ⛔ Ej redistr. | MIT |
| 📊 Datakvalitet | Numerisk | Rikast | Medel | Djupast | Grund |
| 🇸🇪 Sv. fokus | ❌ | ❌ | ❌ | ⚠️ UK-nära | ❌ |

---

## 🎯 Min rekommendation

### Primär: **Open Plantbook** 
Bäst match för din app eftersom:
1. **Numerisk data** (lux, °C, %, µS/cm) passar din redan kvantitativa arkitektur (integer mm, sol-beräkningar med suncalc).
2. **Gratis och fri licens** — inga begränsningar.
3. Du kan direkt koppla `min/max_light_lux` mot din skugga/sol-motor och visa "denna bädd får X lux, tomat behöver Y–Z lux".

### Komplettera med: **Perenual** (för jordtyp + bilder)
Eftersom Open Plantbook saknar jordtyps-info och bilder kan du använda Perenual som sekundär källa:
- Hämta jordtyp, beskärning, skadedjur och bilder därifrån.
- 100 gratis req/dag räcker om du cachar lokalt.

### Arkitekturförslag för din monorepo:
```
packages/
  spatial-core/        ← befintlig
  plant-data/          ← NY: adapter-mönster
    src/
      types.ts         ← PlantCareProfile (normaliserad)
      plantbook.ts     ← Open Plantbook adapter
      perenual.ts      ← Perenual adapter (komplement)
      cache.ts         ← localStorage/IndexedDB-cache
      index.ts
```

```typescript
// packages/plant-data/src/types.ts
export interface PlantCareProfile {
  id: string;
  commonName: string;
  scientificName: string;
  
  // Numeriska ranges (från Open Plantbook)
  temperature: { minC: number; maxC: number };
  light: { minLux: number; maxLux: number };
  soilMoisture: { minPct: number; maxPct: number };
  nutrientEC: { minuS: number; maxuS: number };  // µS/cm
  humidity: { minPct: number; maxPct: number };
  
  // Kategorisk data (från Perenual)
  soilTypes?: string[];       // ["Well-drained", "Sandy"]
  wateringFrequency?: string; // "Every 5-7 days"
  sunCategory?: string[];     // ["Full sun", "Part shade"]
  imageUrl?: string;
}
```

Det följer ditt befintliga adapter-mönster (jfr `persistence.ts` med `LocalStorageAdapter` / `HttpAdapter`) och håller plant-data som ett rent package utan React-beroenden — precis som `spatial-core`.
