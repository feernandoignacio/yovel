# Operação Yovel

Personal finance desktop app by **Rign Studio**.

Yovel (Jubilee) comes from Leviticus 25: every fifty years debts were forgiven and every family got back what it had lost. The app is built around that idea: getting each bill back in order, one day at a time.

## Features

- **Bills up to date**: open bills sorted by due date, with a warning when a bill is due in the next 3 days
- **Overdue**: bills move here automatically once the due date passes, with the total owed
- **Recurring bills**: paying a fixed bill creates next month's one automatically
- Data is saved locally in a JSON file (`%APPDATA%/yovel/yovel-dados.json`), nothing goes to a server

### Coming next

- Daily view: income and expenses, daily target for obligations and a separate target for goals, recalculated in real time
- Goals
- Weekly and monthly reports with charts
- Windows notifications for bills about to expire

## Tech stack

- Electron + electron-vite
- React 19 + TypeScript
- Montserrat (via Fontsource)

## Running locally

```bash
npm install
npm run dev
```

## Building the Windows installer

```bash
npm run build:win
```

---

Developed by Lucas Fernando
