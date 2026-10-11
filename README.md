<div align="center">

# 🛫 Runway

### ₹10,000. 30 days. Make it last.

**The money app that lets you crash-test every spend _before_ you make it.**

![Made for Gen Z](https://img.shields.io/badge/made%20for-Gen%20Z-ff3cac?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Built on Zite](https://img.shields.io/badge/built%20on-Zite-c6ff00?style=for-the-badge)

</div>

---

## ✈️ The pitch

It's day 1. You've got **₹10,000** and **30 days**. Rent share, metro pass, Spotify, that one friend's birthday, a surprise phone repair, a concert you *definitely* can't miss.

Most budgeting apps tell you what went wrong **after** it happened. Runway is different: it treats your month like a **runway** — a strip of road you need to get to the end of before you run out of tarmac. Every choice you make shortens or lengthens it, and you can **simulate any decision first** and watch your entire financial picture react in real time.

> **"Should I buy it?"** → Runway shows you exactly what happens to your daily allowance, day-30 balance, savings goals, risk level and Health Score. Then *you* decide.

---

## 🧠 The big idea: everything is connected

Runway isn't a pile of separate trackers. It's **one money model** where every number depends on every other:

```
   Transactions ──┐
   Subscriptions ─┼──►  🧮 Engine  ──►  Balance · Daily allowance · Day-30 forecast
   Savings goals ─┤                     Risk level · Health Score (0–100)
   Surprises ─────┘                     Goal on-track status · Smart nudges
```

Log a ₹349 Swiggy order and your allowance, forecast, risk and score all shift instantly — on every page, because they're all computed by the **same shared engine**.

---

## ✨ Features

### 🏠 Dashboard — mission control
- **Balance, today's allowance, Health Score and risk** at a glance
- **Forecast chart**: actual spend vs. projected balance through day 30
- **Smart nudge**: one plain-language tip, e.g. *"At this pace you'll hit ₹0 on day 27. Cut ₹40/day to finish strong."*
- Quick **Log money** button from anywhere

### 🧪 Decision Simulator — try it before you buy it
The signature feature. Pick a decision type:

| Decision | Example |
|---|---|
| 🛍️ One-time buy | Concert ticket ₹1,800 |
| 🔁 New subscription | Netflix ₹199/mo |
| ✂️ Cancel subscription | Drop Spotify |
| 🐷 Save | Move ₹500 to a goal |
| 💸 Extra income | Freelance gig ₹1,500 |

…and get a live **before → after** on every metric, plus a verdict: **Safe**, **Caution** or **Risky**. Commit it or discard it — every what-if is saved to your history.

### 💳 Spending — every rupee, sorted
- Full log of expenses and income with **search, filters and sorting**
- **Category donut** (Food, Transport, Fun, Shopping, Bills, Education, Health…)
- Flag **unexpected** hits so they count against you fairly
- Edit or delete anything — changes ripple through the whole model

### 🎯 Goals — save for what matters
- Targets, deadlines and an emoji for vibes 🎧
- Money moved into goals **leaves your spendable balance**, so the trade-off is real
- **On-track / behind** status with the daily amount you need
- 🎉 **Confetti** when you hit a goal

### 🔁 Subscriptions — the silent drain
- All commitments in one place, with **"that's X days of your allowance"** framing
- Upcoming renewals are **reserved in your forecast** automatically
- **Pause**, **mark paid**, or **simulate cancelling** in one click

### ❤️ Health — your financial report card
A transparent **0–100 score** built from five factors, each showing points earned:
1. Spending pace vs. allowance
2. Savings progress
3. Commitment load
4. Emergency buffer
5. Unexpected hits

Plus a clear **risk level** — Low, Medium, High or Critical.

### 📥 Import — bring your real money in
- Upload **bank statements** (CSV / XLS / XLSX)
- **Paste bank & UPI SMS alerts** — Runway parses amount, merchant and date and guesses the category
- **Review screen** before anything is saved, with duplicate detection
- 📡 **Live capture** (beta): forward bank SMS to a private webhook and they log themselves

---

## 🛠️ Tech stack

| Layer | Tools |
|---|---|
| Frontend | React · TypeScript · Vite · React Router |
| UI | Tailwind CSS · shadcn/ui · Framer Motion · Lucide icons |
| Charts | Recharts |
| Forms & validation | Zod · date-fns |
| Import parsing | SheetJS (`xlsx`) · regex SMS parser |
| Backend | Typed API endpoints (Zite / Cloudflare Workers) |
| Data & auth | Zite Database · magic-link sign-in |

---

## 📂 Project structure

```
runway/
├── src/
│   ├── App.tsx              # Routing + auth gate
│   ├── index.css            # Dark neon theme (CSS variables)
│   ├── lib/
│   │   ├── engine.ts        # 🧮 The money engine: metrics, risk, score, simulations
│   │   ├── finance.tsx      # React context that feeds the engine to every page
│   │   ├── server.ts        # Backend helpers: active cycle, ownership checks
│   │   ├── importers.ts     # Bank statement parsing
│   │   └── sms.ts           # SMS / UPI alert parsing + category guessing
│   ├── pages/               # Landing, Setup, Dashboard, Spending, Simulator,
│   │                        # Goals, Subscriptions, Health, Import
│   ├── components/          # AppShell, ForecastChart, TransactionDialog,
│   │                        # Confetti, AutoCapture, Indicators, …
│   └── api/                 # Backend endpoints (getOverview, startCycle,
│                            # saveTransaction, recordSimulation, captureSms, …)
├── tailwind.config.ts
└── package.json
```

---

## 🗄️ Data model

| Table | What it holds |
|---|---|
| **Budget Cycles** | Your 30-day run: starting balance, start date, status |
| **Transactions** | Expenses, income, goal contributions & withdrawals |
| **Savings Goals** | Target, saved amount, deadline, emoji |
| **Subscriptions** | Recurring costs & commitments, next renewal, status |
| **Simulations** | Every what-if: score before/after, verdict, committed? |
| **Capture Keys** | Private keys that route forwarded SMS to the right user |

Every row is owned by a user, and every endpoint checks ownership — **you only ever see your own money**.

---

## 🚀 How it flows

1. **Land** on the homepage → sign in with a magic link ✉️
2. **Set up** your cycle in 3 steps: starting amount → locked-in commitments → first goal
3. **Live** your month: log spends, import statements, paste SMS
4. **Simulate** before every big choice 🧪
5. **Finish** day 30 with money left — and a Health Score to brag about 🏆

---

## 💻 Running it

Runway is built on **[Zite](https://zite.com)**, which provides the database, authentication and serverless endpoints (the `zitejs/*` imports). The source here is the full app code; to run it yourself, import it into a Zite workspace — or swap the `zitejs` modules for your own backend & auth.

---

## 🗺️ Roadmap ideas

- [ ] Streaks & badges wall 🔥
- [ ] Shared budgets for roommates
- [ ] Weekly recap emails
- [ ] AI money coach chat
- [ ] Multi-currency support

---

<div align="center">

**Built for everyone who's ever checked their balance and whispered _"how?"_** 💸

*Make it last.* 🛫

</div>
