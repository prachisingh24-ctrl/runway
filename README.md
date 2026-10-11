# Runway

**Plan a month. Test a purchase before you make it.**

Runway is a personal finance app built around a 30-day budget. Add income, spending, subscriptions, and savings goals, then see how they affect your available balance, daily allowance, end-of-cycle forecast, risk level, and financial health score.

The Decision Simulator lets you try a purchase or money change first. Review the projected impact, then choose whether to save it to your budget.

## Features

- **Dashboard:** balance, daily allowance, forecast, risk, Health Score, and a spending nudge.
- **Decision Simulator:** preview one-time purchases, subscriptions, subscription cancellations, savings contributions, and extra income.
- **Spending:** record, search, filter, sort, edit, and delete income and expenses.
- **Savings goals:** set targets and deadlines, track progress, and record contributions or withdrawals.
- **Subscriptions:** track recurring commitments, upcoming renewals, and cancellations.
- **Health:** see a score from 0 to 100 with a breakdown of its contributing factors.
- **Import:** review bank statement files (CSV, XLS, or XLSX), paste bank or UPI SMS alerts, or configure incoming SMS capture.

## How the budget works

Runway uses one shared finance engine to calculate the numbers shown throughout the app. Changes to a transaction, goal, or subscription update the dashboard, forecast, allowance, risk, and score together.

Each budget cycle has a starting balance, start date, and length. The default challenge is ₹10,000 over 30 days, but the setup flow lets you enter your own starting amount and commitments. The Health Score considers spending pace, savings progress, recurring commitments, emergency buffer, and unexpected expenses.

The forecast and score are budgeting estimates based on the information entered by the user. They are not financial advice or a connection to a bank account.

## Tech stack

- React 18, TypeScript, Vite, and React Router
- Tailwind CSS and Radix UI components
- Recharts for charts and Framer Motion for animations
- Zod and React Hook Form for validation and forms
- Zite for authentication, database access, and server endpoints

## Project structure

```text
src/
├── api/          # Authenticated backend endpoints
├── components/   # Shared UI and app shell
├── lib/
│   ├── engine.ts # Shared budget calculations and simulations
│   ├── finance.tsx
│   ├── importers.ts
│   └── sms.ts
└── pages/        # Dashboard, spending, goals, import, and other screens
```

## Run the project

Runway uses Zite for its auth, database, and backend. The repository contains the app source, while Zite supplies project-specific generated modules and runtime configuration. For the complete app, import or open the project in a Zite workspace and run it there.

In an environment with the Zite project bindings available, install dependencies and start Vite:

```sh
corepack yarn install
corepack yarn dev
```

Vite uses port `8080` by default. The app's backend endpoints and sign-in flow require the connected Zite project configuration; a plain checkout by itself does not provide those services.

## Available scripts

```sh
corepack yarn dev        # Start the Vite development server
corepack yarn build      # Type-check and build for production
corepack yarn preview    # Preview the production build
corepack yarn typecheck  # Run the project type check
```

## Data and privacy

Runway stores budget cycles, transactions, savings goals, subscriptions, simulations, and SMS capture keys in the Zite database. Backend endpoints associate records with the signed-in user and check ownership when accessing them.

Live SMS capture is optional and requires the app owner to configure a capture webhook. A bank statement or pasted SMS is reviewed in the app before imported transactions are saved. Check the imported details before adding them to your budget.

## License

This project is licensed under the [MIT License](LICENSE).
