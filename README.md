# FieldGuard — Weather-Aware Irrigation Decision-Support System

> **FieldGuard Agronomic Intelligence — FieldGuard Autonomous Telemetry (Event 02)**  
> **AI Telemetry: Heat & Water (Water Scarcity & Groundwater Resilience)**  
> Organized by **AWS Serverless Architecture**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Lambda%20%2B%20DynamoDB-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 1. Problem Statement
In India, over **80% of freshwater withdrawal goes to agriculture**, primarily pumped from rapidly depleting underground aquifers using subsidized diesel or grid electricity. Smallholder farmers face a critical daily dilemma:
* *"Should I pump groundwater today, or wait for forecast rain?"*
* *"If rain arrives, will it safely meet my crop's root-zone thirst before moisture stress hits?"*
* *"If my storage tank or borewell is low, what is my exact shortfall and critical deadline?"*

Existing agricultural apps act as passive weather graphs or theoretical crop calculators that demand farmers apply water without checking if water reserves exist or if effective rain is incoming.

---

## 2. Target User & Persona
* **Primary Persona**: Ramesh, a smallholder farmer in India (e.g. Bardhaman, West Bengal or Nashik, Maharashtra) cultivating 1.5 Bigha of vegetables/crops with restricted borewell electricity hours and limited storage tank capacity.
* **Secondary Persona**: Agricultural extension workers, KVK officers, and FPO coordinators managing advisories for multiple smallholder field blocks.

---

## 3. The Solution & Core Philosophy
> *"Do not stop at measuring an environmental problem. Turn environmental data into something a real person can act on."*

FieldGuard moves from passive dashboards to an actionable **Dual-Engine Decision Pipeline**:
```text
Real Weather Feed (Open-Meteo) 
       ↓
Engine 1: Daily FAO-56 Soil Moisture Infiltration
       ↓
Engine 2: Resource-Constrained Feasibility Planner
       ↓
Actionable Decision ("Hold Off Irrigation" / "Deficit Alert")
       ↓
Measurable Environmental Ledger (Groundwater & Pump Energy Conserved)
```

---

## 4. Key Differentiators vs. Existing Solutions

| Feature | CropSpy / Farmonaut / Standard Apps | FieldGuard |
| :--- | :--- | :--- |
| **Calculation Model** | Pure theoretical crop thirst ($ET_c$) | **Dual-Engine**: Balances crop thirst against usable storage volume, replenishment timing, and irrigation application method efficiency (Drip 90%, Sprinkler 75%, Flood 60%) |
| **Effective Rain Infiltration** | Flat monthly estimates or raw rainfall totals | **Daily Soil Water Balance**: Infiltration capped by actual root-zone deficit ($D_r$), excess goes to runoff |
| **Resource Constraints** | Assumes infinite water availability | **Objective Shortfall Alert**: Flags exact shortfall volume and hours to critical stress deadline |
| **Environmental Output** | Generic carbon score or none | **Quantified Environmental Ledger**: Calculates exact deferred irrigation litres, pump run-time saved, and kWh saved |
| **Field Onboarding** | Rigid, technical desktop forms | **Mobile-First 4-Step Wizard**: 1-tap GPS, OpenStreetMap geocoding, local units (Bigha/Acre), visual soil tiles, and custom pond/sump ($L \times W \times D$) calculator |
| **Meteorological Feed** | Manual entry or static graphs | **Live Meteorological Station**: Real-time Open-Meteo sync (Temp, Humidity, Wind, ET₀, PoP% rain probability) |
| **Accessibility & Voice** | English-only text dashboards | **Multilingual Audio Engine**: Full English, Hindi (हिंदी), and Bengali (বাংলা) translations with native Web Speech API read-aloud |
| **Hardware Barrier** | Requires ₹15,000–₹40,000 sensor probes | **100% Software-First**: Uses FAO-56 physics with optional sensor extensibility |

---

## 5. System Architecture & AWS Implementation

FieldGuard is built on a **100% AWS Serverless Architecture**:

```text
┌────────────────────────────────────────────────────────┐
│           Next.js 16 Client (App Router)              │
│       Mobile-First UI • 60-Second Field Setup          │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│     AWS Lambda Compute    │ │     Amazon DynamoDB      │
│  fieldguard-calculate-     │ │  FieldGuard-Farms Table   │
│         engine            │ │  FieldGuard-DecisionLogs  │
│  (FAO-56 Dual Engine)     │ │  (Pay-Per-Request Mode)  │
└─────────────┬─────────────┘ └──────────────────────────┘
              │
              ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│      AWS Bedrock LLM      │ │     Open-Meteo API       │
│  Grounded Multilingual    │ │  Daily Rain, PoP, and    │
│  Advisory (EN / HI / BN)  │ │  FAO-56 Penman ET₀       │
└───────────────────────────┘ └──────────────────────────┘
```

### AWS Services Utilized:
1. **AWS Lambda**: Executes the deterministic calculation engine (`src/aws/lambdaHandler.ts`) with sub-50ms execution latency.
2. **Amazon DynamoDB**: Serverless NoSQL document store operating under on-demand capacity mode:
   - `FieldGuard-Farms`: Partition key `farmId`.
   - `FieldGuard-DecisionLogs`: Partition key `farmId`, Sort key `timestamp`.
3. **AWS Bedrock / Strands Agents**: Translates verified calculation outputs into grounded farmer guidance in local languages.
4. **AWS SAM (`template.yaml`)**: Turnkey CloudFormation infrastructure-as-code template.

---

## 6. The Environmental Impact Ledger

When FieldGuard advises a farmer to **"Hold Off Irrigation"**, it derives the exact savings:
* **Avoided Irrigation Depth**: e.g., $8.22\text{ mm}$ scheduled application deferred over a $2{,}007\text{ m}^2$ plot.
* **Conserved Volume**: $\mathbf{16{,}500\text{ Litres}}$ of water extraction deferred.
* **Pump Operating Hours Saved**: $\mathbf{2.8\text{ Hours}}$ of 5 HP tube-well pumping.
* **Electricity Saved**: $\mathbf{14.9\text{ kWh}}$ of grid power.
* **Emissions Offset**: $\mathbf{12.2\text{ kg CO}_2}$ avoided.
* **Operational Expense Saved**: $\mathbf{₹97}$ in direct fuel/electricity cost.

---

## 7. Interactive Demo Presets (Zero-Crash Guarantee)

To guarantee reliable demonstration during video recording and judge reviews, FieldGuard includes a **1-Click Preset Switcher**:

* **Scenario A (Rain Avoidance Decision Shift)**: 1.5 Bigha Tomato, 22 mm rain forecast within 36h $\rightarrow$ Decision: `WAIT & REASSESS`, displays 16,500 L deferred irrigation.
* **Scenario B (Severe Drought / Tank Deficit)**: Multi-crop parcel (Tomato + Spinach), 36°C heatwave, tank has only 800 L against 3,300 L demand $\rightarrow$ Decision: `RESOURCE DEFICIT ALERT`, flags Spinach shallow-root stress deadline in 20 hours.
* **📍 Live GPS Mode**: Uses device geolocation to fetch live Open-Meteo weather for any city or field in real time.

---

## 8. Local Setup & Running Instructions

### Prerequisites:
* Node.js v20+ or v22+
* npm v10+

### Installation:
```bash
# Clone the repository
git clone git@github.com:MdKaifSardar/FieldAgent.git
cd FieldAgent

# Install dependencies
npm install --legacy-peer-deps

# Run automated FAO-56 unit tests
npm test

# Start local Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Environment Variables (`.env.local`)

FieldGuard includes a **Local Offline Fallback Mode** so development and testing function with zero AWS credentials. When connecting to live AWS:

```env
# Optional: Live AWS Credentials
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Table Names
DYNAMODB_FARMS_TABLE=FieldGuard-Farms
DYNAMODB_LOGS_TABLE=FieldGuard-DecisionLogs
```

---

## 10. Automated Test Validation

The core equations are backed by automated unit tests (`src/tests/fao56.test.ts`) validating against standard FAO-56 textbook equations:
```bash
npm test
```
Outputs:
```text
✓ src/tests/fao56.test.ts (9 tests)
  ✓ correctly calculates Crop Evapotranspiration (ETc = ET0 * Kc)
  ✓ correctly calculates TAW from AWC and Root Depth (Zr)
  ✓ correctly calculates RAW using depletion fraction p
  ✓ handles daily effective rain vs runoff cleanly
  ✓ steps forward daily soil water balance and detects stress
  ✓ calculates hours to critical stress accurately
  ✓ accurately derives deferred irrigation volume (16,500 L demo benchmark)
  ✓ triggers WAIT_AND_REASSESS when substantial rain is forecast
  ✓ triggers RESOURCE_DEFICIT_ALERT when water needed exceeds tank reserve
```

---

## 11. AI Coding Tools Disclosure
Development & AI Tooling Disclosure:
* **AI Coding Tools Used**: Google DeepMind Antigravity IDE (Gemini 3.8 Flash).
* All agronomic equations, system architectures, and implementations were designed, verified, and audited by the team.

---

## 12. Credits & Scientific References
* **UN FAO Irrigation and Drainage Paper No. 56**: Crop Evapotranspiration Guidelines (Allen, Pereira, Raes, Smith, 1998).
* **ICAR**: Indian Council of Agricultural Research Agro-Climatic Soil Profiles.
* **Open-Meteo**: Global open-source meteorological forecast API.
