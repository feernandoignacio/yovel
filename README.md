# Operação Yovel

Personal finance desktop app by **Rign Studio**.

Yovel (Jubilee) comes from Leviticus 25: every fifty years debts were forgiven and every family got back what it had lost. The app is built around that idea: getting each bill back in order, one day at a time.

## Features

- **Today**: log income and expenses for each day. The daily target for obligations is the month's bills minus what was already left over on previous days, split across the remaining workdays (Monday to Saturday). If a day falls short, the difference is spread over the next days; if it goes over, the next targets drop. Goals have a separate target, so they never feel like an obligation
- **Bills up to date**: open bills sorted by due date, with a warning when a bill is due in the next 3 days
- **Overdue**: bills move here automatically once the due date passes, with the total owed
- **Recurring bills**: paying a fixed bill creates next month's one automatically
- Data is saved locally in a JSON file (`%APPDATA%/yovel/yovel-dados.json`), nothing goes to a server

### Coming next

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
