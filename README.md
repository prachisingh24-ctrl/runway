# ✨ Runway

> **Your money, your moves.** Plan a month. Test a purchase before you make it.

<p align="center">
  <a href="https://ntsppvuale.zite.so"><img alt="Open Runway" src="https://img.shields.io/badge/🚀_OPEN_RUNWAY-Try_the_live_app-7257FF?style=for-the-badge" /></a>
  <a href="https://github.com/prachisingh24-ctrl/runway"><img alt="GitHub repository" src="https://img.shields.io/badge/GitHub-Source_Code-181717?style=for-the-badge&logo=github" /></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Powered-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" />
</p>

Runway is a personal-finance experience for Gen Z built around a limited **₹10,000 budget over 30 days**. It connects spending, income, subscriptions, commitments, savings goals, unexpected expenses, financial risk, and financial health—so every decision has a visible consequence.

**[Open the live app ↗](https://ntsppvuale.zite.so)** · [Explore the code](https://github.com/prachisingh24-ctrl/runway) · [Report an issue](https://github.com/prachisingh24-ctrl/runway/issues)

> [!TIP]
> **Try the signature flow:** open the app → enter your budget → visit **What if I…** → test a purchase → compare the forecast → apply it or save it as skipped. A simulation should help you decide *before* the money moves.

---

## 🧭 Jump in

| Want to… | Go to |
|---|---|
| 🚀 Try Runway | [Live app](https://ntsppvuale.zite.so) |
| 🧠 Understand the decision simulator | [How it works](#-the-runway-loop) |
| 💸 Explore the feature set | [Features](#-built-for-real-life-money-decisions) |
| 🛠️ Run the project | [Setup](#-run-locally) |
| 🧪 Check financial calculations | [Tests](#-quality-checks) |
| 🔐 Understand bank-sync limitations | [Bank-sync status](#-bank-sync--privacy) |
| 🗺️ Explore the architecture | [Project map](#-project-map) |

## 🌈 Built for real-life money decisions

| Feature | What it helps you do |
|---|---|
| 💜 **Money dashboard** | See balance, daily allowance, commitments, month-end forecast, risk, and health score in one place. |
| 🧪 **Decision Simulator** | Preview one-time purchases, new subscriptions, cancellations, savings contributions, and extra income before applying a choice. |
| 📈 **30-day forecast** | Compare actual balance with projected cash flow and see how future transactions and renewals affect the finish line. |
| 🎯 **Savings goals** | Set a target and deadline, track progress, and see whether the current plan is on track. |
| 🔁 **Subscriptions** | Track recurring costs and upcoming renewals; simulate cancelling a subscription. |
| 🧾 **Spending & income** | Add, edit, search, filter, and sort money entries. |
| 📥 **Statement & SMS import** | Review CSV/XLS/XLSX statements or pasted bank/UPI SMS details before saving. |
| 🫶 **Financial health** | Explore the score factors, risk level, spending pace, emergency buffer, and next-step nudge. |
| 🏦 **Bank connections** | A preparation screen for a future consent-based integration; live bank syncing is not enabled yet. |

## 🧠 The Runway loop

The key idea is **simulate first, commit second**. The preview should not change saved financial records.

```mermaid
flowchart TD
    A["💰 Set your 30-day budget"] --> B["🧾 Add income, spending & commitments"]
    B --> C["🧪 Simulate a decision"]
    C --> D["📊 Compare balance, allowance & forecast"]
    D --> E{"Does the plan still work?"}
    E -->|Yes| F["✅ Apply decision"]
    E -->|Not yet| G["↩️ Adjust amount or skip"]
    F --> H["🔄 Recalculate financial health"]
    G --> C
    H --> C
    classDef money fill:#ede9fe,stroke:#7c3aed,color:#312e81
    classDef action fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,B,C,D money
    class F,G,H action
```

### 🔎 What a decision should change

A purchase is more than a line in a transaction list. Depending on the decision, Runway recalculates the affected values through the shared finance engine.

- **Balance:** what is available after posted transactions.
- **Daily allowance:** how much is available per remaining day after scheduled flows and upcoming renewals.
- **Day-30 forecast:** the estimated finish-line balance.
- **Risk:** Low, Medium, High, or Critical based on projected cash flow and buffer.
- **Savings goals:** whether deadlines remain achievable.
- **Health score:** a 0–100 estimate with a breakdown of contributing factors.

The numbers are planning estimates based on information entered by the user—not financial advice or a verified bank balance.

## 🛠️ Run locally

Runway uses Zite for authentication, database access, and backend endpoints. The source repository is available here, but a plain checkout does **not** provide the connected Zite services or project-specific generated modules.

### Prerequisites

- Node.js compatible with the project toolchain
- Corepack / Yarn
- Access to the connected Zite project for authenticated backend flows

### Start the app

```bash
corepack yarn install
corepack yarn dev
```

Vite uses port `8080` by default. The app's sign-in, data, and backend flows require the connected Zite configuration.

### Useful commands

| Command | Purpose |
|---|---|
| `corepack yarn dev` | Start the development server |
| `corepack yarn build` | Type-check and build for production |
| `corepack yarn preview` | Preview the production build |
| `corepack yarn typecheck` | Run the project type check |
| `corepack yarn test:finance` | Run finance-engine regression checks |

## 🧪 Quality checks

Before publishing, run:

```bash
corepack yarn typecheck
corepack yarn test:finance
corepack yarn build
```

The finance regression checks cover starting balance, posted and future transactions, cycle boundaries, chart/forecast consistency, and subscription-cancellation simulations. A successful build or GitHub merge does not, by itself, confirm the live Zite deployment has updated.

## 🗺️ Project map

```text
src/
├── api/                  # Authenticated backend endpoints
├── components/           # Shared UI, charts, indicators and app shell
├── lib/
│   ├── engine.ts         # Shared budget calculations and simulations
│   ├── finance.tsx       # Finance context, state and formatting helpers
│   ├── importers.ts      # Statement import helpers
│   └── sms.ts            # SMS parsing helpers
└── pages/                # Dashboard, simulator, spending, goals, health, etc.

docs/
└── bank-sync-integration.md  # Future bank-sync architecture and security plan

scripts/
└── test-finance-engine.mjs   # Finance-engine regression checks
```

### Stack

- **UI:** React 18, TypeScript, Vite, React Router
- **Design system:** Tailwind CSS and Radix UI
- **Charts & motion:** Recharts and Framer Motion
- **Forms & validation:** React Hook Form and Zod
- **Backend:** Zite authentication, database access, and server endpoints

## 🔐 Bank-sync & privacy

**Live bank syncing is not configured.** The Banks screen is currently a setup experience, not a working connection to a bank or Paytm transaction history.

A future integration needs an eligible India-compatible provider, explicit user consent, sandbox/production access, server-side credentials, secure callbacks, transaction deduplication, and end-to-end testing. Phone verification alone does not authorize access to financial transaction history.

Until then, use manual entry, statement import, or the available SMS-import flow—and review imported details before saving. Never enter bank passwords, UPI PINs, or OTPs into Runway.

Read the [bank-sync integration plan](docs/bank-sync-integration.md) for the architecture and security checklist.

## 🤝 Contributing

1. Fork the repository and create a focused feature branch.
2. Keep financial calculations in the shared engine instead of duplicating formulas in UI components.
3. Add or update regression tests for changes to financial behavior.
4. Run type-check, finance tests, and build.
5. Open a pull request describing the user-facing impact and any assumptions.

Ideas, bug reports, and improvements are welcome through [GitHub Issues](https://github.com/prachisingh24-ctrl/runway/issues).

## 📄 License

Runway is released under the [MIT License](LICENSE).
