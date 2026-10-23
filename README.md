# FieldGuard
### Weather-Aware Groundwater Resilience & Agronomic Decision Cockpit

> **AI-Powered Precision Irrigation & Groundwater Resilience Cockpit**  
> **Built for the Amazon Bedrock & Alexa+ Developer Hackathon 2026**  
> *Author: Md Kaif Sardar*

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Cognito%20%2B%20Polly%20%2B%20DynamoDB-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Tests: 10/10 Passing](https://img.shields.io/badge/Vitest-10%2F10%20Passed-brightgreen)](src/tests/fao56.test.ts)

---

## 1. Executive Summary & Problem Statement

In India, **over 80% of freshwater withdrawal is consumed by agriculture**, primarily pumped from rapidly depleting underground aquifers using subsidized diesel or grid electricity. Smallholder farmers face a critical daily dilemma:

1. *"Should I pump groundwater today, or wait for forecast rain?"*
2. *"If rain arrives, will it safely meet my crop's root-zone thirst before moisture stress hits?"*
3. *"If my storage tank or borewell recharge is low, what is my exact shortfall and critical deadline?"*

Existing agricultural apps act as passive weather graphs or theoretical crop calculators that demand farmers apply water without checking if water reserves exist or if effective rain is incoming.

**FieldGuard** transforms raw meteorological data and agronomic soil physics into **actionable, human-grade decisions** with quantified environmental savings and multilingual voice companionship.

---

## 2. Target Personas & Accessibility

* **Primary Persona**: **Ramesh**, a smallholder farmer in India (e.g. Bardhaman, West Bengal or Nashik, Maharashtra) cultivating 1.5 Bigha of vegetables/crops with restricted borewell electricity hours and limited storage tank capacity.
* **Secondary Persona**: **Agricultural Extension Workers & KVK Officers** managing field advisories for multiple village clusters and requiring auditable decision logs.

---

## 3. Product Architecture & Dual-Engine Pipeline

```text
       Live Open-Meteo Weather Feed (Temp, Humidity, Wind, ET₀, PoP%)
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│                   Engine 1: Daily FAO-56 Soil Water Balance             │
│   • Infiltration capped by actual root-zone deficit (Dr)               │
│   • Excess rainfall routed to surface runoff (avoids false optimism)   │
│   • Multi-crop parcel weighted aggregation (Kc, Zr, p)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│              Engine 2: Resource-Constrained Feasibility Planner        │
│   • Compares irrigation demand against usable storage tank / pond      │
│   • Applies application efficiency (Drip 90%, Sprinkler 75%, Flood 60%)│
│   • Computes hours to critical stress threshold (RAW)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│                      Actionable Agronomic Cockpit                      │
│   • HOLD OFF IRRIGATION (Rain Avoidance Shift)                         │
│   • PROCEED WITH IRRIGATION (Optimal Application Window)               │
│   • RESOURCE DEFICIT ALERT (Shortfall Volume + Critical Deadline)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│              Quantified Environmental Ledger (Conserved)               │
│   • Water Volume Conserved (Litres)   • Pumping Run-Time Avoided (Hrs)  │
│   • Electricity Saved (kWh)           • Carbon Emissions Offset (kg CO2)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Differentiators vs. Existing Solutions

| Feature | Standard Agri-Apps / Crop Calculators | FieldGuard |
| :--- | :--- | :--- |
| **Calculation Model** | Pure theoretical crop thirst ($ET_c$) | **Dual-Engine**: Balances crop thirst against usable storage volume, replenishment timing, and irrigation method efficiency |
| **Effective Rain Infiltration** | Flat monthly estimates or raw rainfall totals | **Daily Soil Water Balance**: Infiltration capped by actual root-zone deficit ($D_r$), excess goes to runoff |
| **Resource Constraints** | Assumes infinite water availability | **Objective Shortfall Alert**: Flags exact shortfall volume and hours to critical stress deadline |
| **Environmental Output** | Generic carbon score or none | **Quantified Environmental Ledger**: Calculates exact deferred irrigation litres, pump run-time saved, and kWh saved |
| **Authentication & Route Guard** | Open/unauthenticated or complex desktop login | **AWS Cognito Dual Auth**: Dedicated `/login` and `/register` routes with Phone/Email OTP, 30-day persistent sessions, and route guards |
| **Voice Guidance** | English-only or robotic monotone TTS | **Hybrid Polly Neural + Web Speech**: Human-grade Hindi & Indian English neural voices (`Kajal`) with device-native Bengali (`bn-IN`) fallback |
| **Field Onboarding** | Rigid desktop forms | **Voice-Guided 4-Step Onboarding**: Language $\rightarrow$ 1-tap GPS geocoding $\rightarrow$ Mobile $\rightarrow$ OTP verification |
| **Hardware Barrier** | Requires ₹15,000–₹40,000 IoT sensor probes | **100% Software-First**: Uses FAO-56 Penman-Monteith physics with optional sensor extensibility |

---

## 5. Major Product Enhancements & Changelog

### A. Dedicated Authentication & Security Architecture
* **AWS Cognito Integration**: Configured in region `ap-south-1` (User Pool: `ap-south-1_iMtATBX0R`, App Client: `u1tuajkqa6svhelgrb12g2abn`).
* **Phone & Email OTP Flow**: Supports seamless verification via mobile number (`+91...`) or email address with resend cooldowns.
* **Dedicated Route Pages**:
  - [`/login`](src/app/login/page.tsx): Clean split-screen authentication page with OTP entry, session verification, and back-to-home navigation.
  - [`/register`](src/app/register/page.tsx): Interactive onboarding page with voice companion, live speech feedback, GPS coordinate capture, and mobile OTP verification.
* **Session Persistence & Route Guarding**:
  - Persistent 30-day sessions with automated token refresh (`REFRESH_TOKEN_AUTH`).
  - Defensive `sessionStorage` fallback ensuring mobile users never lose active OTP state during browser backgrounding or multitasking.
  - Public route isolation: Unauthenticated visitors view a single high-conversion landing page; dashboard and farm settings are gated behind authenticated sessions.
  - Farm data partitioning: Multi-tenant farm records in DynamoDB are partitioned strictly by `userId`.

### B. Dual-Engine Hybrid Text-to-Speech (TTS) Architecture
* **Amazon Polly Cloud Engine ([`src/app/api/tts/route.ts`](src/app/api/tts/route.ts))**:
  - Connects to AWS Polly in `ap-south-1` using server-side IAM credentials.
  - **Hindi (`hi-IN`)**: Powered by Neural voice **"Kajal"** (with fallback to Standard **"Aditi"**).
  - **Indian English (`en-IN`)**: Powered by Neural voice **"Kajal"** (with fallback to Standard **"Raveena"**).
  - Audio streaming: Delivers `audio/mpeg` streams directly to the browser with HTTP caching (`Cache-Control: public, max-age=86400`).
* **HTML5 Web Speech API Fallback Tier ([`src/adapters/speechAdapter.ts`](src/adapters/speechAdapter.ts))**:
  - **Bengali (`bn-IN`) Preservation**: Since Amazon Polly does not offer a native Bengali voice model, Bengali advisories are seamlessly routed to the device-native Web Speech API.
  - **100% Offline Resilience**: If a farmer experiences 2G network drops or if AWS Polly quotas/credentials are unreachable, the adapter fails over to browser synthesis without throwing errors.
  - **In-Memory Audio Cache**: Retains recent voice prompts in memory to eliminate duplicate AWS API requests and provide 0ms instant replay.
  - **Chromium Queue Unsticking**: Automatically calls `synth.resume()` to bypass aggressive mobile browser audio pauses.

### C. Living Botanical Agronomic UI Redesign
* **Aesthetic Theme**: Outdoor-readable agronomic color palette using Warm Sand (`#F8FAF6`), Forest Moss (`#1B4D3E`), Golden Wheat (`#F59E0B`), and Terracotta Earth (`#C2410C`).
* **Cockpit Grid**:
  - **Live Meteorological Station**: Real-time sync with Open-Meteo for Temperature, Humidity, Wind Speed, Penman $ET_0$, and Rain Probability (PoP%).
  - **Primary Decision Card**: Prominent 3-tier action banner (`HOLD OFF IRRIGATION`, `PROCEED WITH IRRIGATION`, `RESOURCE DEFICIT ALERT`) with contextual rationale and one-click audio advisory.
  - **Dual Water Budget & Critical Stress Timeline**: Real-time comparison of crop water requirements vs. usable pond/tank storage, complete with hours until root-zone stress.
  - **Quantified Environmental Ledger**: Calculates deferred water litres, pump run-time avoided, kWh energy saved, and carbon offset.
* **Refactored Header**: Unified Language Selector dropdown (`English`, `हिन्दी`, `বাংলা`), authenticated user badge with one-click logout, and responsive mobile side drawer.

### D. Multi-Crop & Multi-Section Parcel Configuration
* **Multi-Crop Splitting**: Allows farmers to configure multiple crops within a single parcel with dynamic FAO-56 weighted parameter aggregation ($K_c, Z_r, p$).
* **Custom Storage Tank & Pond Calculator**: Computes exact storage capacity from physical dimensions ($L \times W \times D$) in meters or feet with instant volume conversion.
* **Local Indian Land Units**: Seamless conversion between Hectares, Acres, and Bigha (West Bengal standard $1{,}337.8\text{ m}^2$, Northern/Eastern standards).

### E. Hierarchical Multi-Parcel Portfolio & Enterprise Side Drawer
* **1 User $\longrightarrow$ Many Autonomous Parcels**: Fully decoupled multi-field management where each parcel maintains:
  - **Dedicated GPS Coordinates**: Isolated Open-Meteo weather and rainfall forecasts.
  - **Independent Water Reserves**: Separate tube-wells (with pump power & daily hours), Sintex tanks, or custom rain ponds.
  - **Autonomous Advisory & Ledger**: Separate FAO-56 soil moisture balance, deficit warnings, and Environmental Ledgers.
* **Enterprise Side Drawer (`EnterpriseSideDrawer.tsx`)**:
  - Farmer/Manager profile card with aggregate statistics (Total managed fields, Total Bigha/Acres).
  - Visual parcel portfolio list with dedicated water supply pills and crop tags.
  - 1-tap switching between fields with instant cockpit rehydration.
  - Integrated parcel editing, deletion, and "+ Register New Field" actions.
* **Clean Minimal Navbar (`Header.tsx`)**:
  - Pushed all field configuration clutter into the enterprise side drawer.
  - Navbar retains only brand identity, authenticated dashboard link, language selector, theme toggle, and profile drawer trigger.

---

## 6. System Architecture & AWS Infrastructure

FieldGuard runs on a **100% Serverless AWS Architecture**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 Client (App Router)                       │
│    • Dedicated /login & /register Pages    • Agronomic Cockpit Grid    │
│    • Multilingual Audio Advisory Engine    • Mobile-First Responsive   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼───────────────────────────┐
       ▼                            ▼                           ▼
┌──────────────┐             ┌──────────────┐            ┌──────────────┐
│  AWS Cognito │             │  AWS Polly   │            │Amazon DynamoDB
│  User Pool   │             │Neural Voices │            │  FieldGuard-  │
│ (Dual Auth)  │             │ (Kajal/Aditi)│            │    Farms     │
└──────────────┘             └──────────────┘            │  FieldGuard-  │
                                                         │ DecisionLogs │
                                                         └──────────────┘
```

### AWS Services Utilized:
1. **Amazon Cognito**: Serverless identity provider managing passwordless phone/email OTP verification and JWT session tokens.
2. **Amazon Polly**: High-fidelity neural voice synthesis generating localized audio advisories in Hindi and Indian English.
3. **Amazon DynamoDB**: Serverless NoSQL document database:
   - `FieldGuard-Farms`: Partition key `farmId`, storing complete soil, crop, parcel, and irrigation configurations.
   - `FieldGuard-DecisionLogs`: Partition key `farmId`, Sort key `timestamp`, recording timestamped decision histories and environmental ledgers.
4. **AWS SAM (`template.yaml`)**: CloudFormation infrastructure-as-code template for production serverless deployments.

---

## 7. The Environmental Impact Ledger

When FieldGuard advises a farmer to **"Hold Off Irrigation"**, it derives exact physical savings:
* **Avoided Irrigation Depth**: e.g., $8.22\text{ mm}$ scheduled application deferred over a $2{,}007\text{ m}^2$ plot.
* **Conserved Volume**: $\mathbf{16{,}500\text{ Litres}}$ of groundwater extraction deferred.
* **Pump Operating Hours Saved**: $\mathbf{2.8\text{ Hours}}$ of 5 HP tube-well pumping.
* **Electricity Saved**: $\mathbf{14.9\text{ kWh}}$ of grid power.
* **Emissions Offset**: $\mathbf{12.2\text{ kg CO}_2}$ avoided.
* **Operational Expense Saved**: $\mathbf{₹97}$ in direct fuel/electricity expenditure.

---

## 8. Interactive Demo Scenarios (Zero-Crash Guarantee)

To guarantee reliable demonstrations during live judge reviews and recordings, FieldGuard includes a **1-Click Scenario Switcher**:

* **Scenario A (Rain Avoidance Decision Shift)**: 1.5 Bigha Tomato, 22 mm rain forecast within 36h $\rightarrow$ Decision: `HOLD OFF IRRIGATION`, displays 16,500 L deferred irrigation.
* **Scenario B (Severe Drought / Tank Deficit)**: Multi-crop parcel (Tomato + Spinach), 36°C heatwave, tank has only 800 L against 3,300 L demand $\rightarrow$ Decision: `RESOURCE DEFICIT ALERT`, flags Spinach shallow-root stress deadline in 20 hours.
* **📍 Live GPS Mode**: Uses device geolocation to fetch live Open-Meteo weather for any farm location across India in real time.

---

## 9. Local Setup & Running Instructions

### Prerequisites:
* Node.js v20+ or v22+
* npm v10+

### Installation:
```bash
# Clone the repository
git clone git@github.com:MdKaifSardar/FieldAgent.git
cd FieldAgent

# Install dependencies
npm install

# Run automated FAO-56 unit tests
npm test

# Verify TypeScript compilation
npx tsc --noEmit

# Run production build
npm run build

# Start local Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Environment Variables (`.env.local`)

FieldGuard includes a **Local Offline Fallback Mode** so development and testing function without requiring active cloud credentials:

```env
# AWS Region (ap-south-1 for Mumbai)
AWS_REGION=ap-south-1

# IAM Credentials for DynamoDB & Polly
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# DynamoDB Tables
DYNAMODB_FARMS_TABLE=FieldGuard-Farms
DYNAMODB_LOGS_TABLE=FieldGuard-DecisionLogs

# AWS Cognito Identity Provider
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_iMtATBX0R
NEXT_PUBLIC_COGNITO_CLIENT_ID=u1tuajkqa6svhelgrb12g2abn

# Interactive Verification Testing Mode (enables scenario switcher & levers)
NEXT_PUBLIC_ENABLE_DEMO_SANDBOX=false
NEXT_PUBLIC_DEV_SECRET_KEY=fieldguard2026
```

---

## 11. Automated Test Validation

The core agronomic equations are validated against standard FAO-56 textbook formulas (`src/tests/fao56.test.ts`):
```bash
npm test
```
Outputs:
```text
✓ src/tests/fao56.test.ts (10 tests)
  ✓ correctly calculates Crop Evapotranspiration (ETc = ET0 * Kc)
  ✓ correctly calculates TAW from AWC and Root Depth (Zr)
  ✓ correctly calculates RAW using depletion fraction p
  ✓ handles daily effective rain vs runoff cleanly
  ✓ steps forward daily soil water balance and detects stress
  ✓ calculates hours to critical stress accurately
  ✓ accurately derives deferred irrigation volume (16,500 L demo benchmark)
  ✓ triggers WAIT_AND_REASSESS when substantial rain is forecast
  ✓ triggers RESOURCE_DEFICIT_ALERT when water needed exceeds tank reserve
  ✓ accurately calculates multi-crop parcel weighted parameters
```

---

## 12. AI Coding Tools Disclosure & Integrity

Development & AI Tooling Disclosure:
* **AI Coding Tools Used**: Google DeepMind Antigravity IDE (Gemini 3.8 Flash).
* All agronomic equations, system architectures, and implementations were designed, verified, and audited by the team.

---

## 13. Credits & Scientific References

* **UN FAO Irrigation and Drainage Paper No. 56**: Crop Evapotranspiration Guidelines (Allen, Pereira, Raes, Smith, 1998).
* **ICAR**: Indian Council of Agricultural Research Agro-Climatic Soil Profiles.
* **Open-Meteo**: Global open-source meteorological forecast API.
* **Amazon Web Services (AWS)**: Amazon Cognito, Amazon Polly, Amazon DynamoDB, AWS Lambda.
