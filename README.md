# Operação Yovel

Personal finance desktop app by **Rign Studio**.

Yovel (Jubilee) comes from Leviticus 25: every fifty years debts were forgiven and every family got back what it had lost. The app is built around that idea: getting each bill back in order, one day at a time.

## Download

Get the latest Windows installer on the [Releases page](https://github.com/feernandoignacio/yovel/releases/latest).

The app is not code signed, so Windows may show "Windows protected your PC" when you open the installer. Click **More info** and then **Run anyway**.

On first launch the app opens with sample data so you can see how it works. To start using it with your own bills, go to **Ajustes** and click **Apagar tudo**.

## Features

- **Today**: log income and expenses for each day. The daily target for obligations is the month's bills minus what was already left over on previous days, split across the remaining workdays (Monday to Saturday). If a day falls short, the difference is spread over the next days; if it goes over, the next targets drop. Goals have a separate target, so they never feel like an obligation
- **Bills up to date**: open bills sorted by due date, with a warning when a bill is due in the next 3 days
- **Overdue**: bills move here automatically once the due date passes, with the total owed
- **Goals**: personal goals with a deadline, showing how much to set aside per workday. Goals feed the separate goals target on the Today tab
- **Overdue payoff plan**: choose to pay the smallest or the oldest first, pick a deadline and see how much to set aside per workday and when each overdue bill gets paid off
- **Add, edit and delete bills**: single, monthly recurring or split into installments
- **Reports**: weekly and monthly summary with income, expenses, balance, days the target was hit, a daily balance chart with the daily target, expenses by category and bills paid
- **Recurring bills**: paying a fixed bill creates next month's one automatically
- **Windows notifications**: a warning when bills are due in the next 3 days and a stronger one when they are overdue, shown once a day. Clicking it opens the right tab
- **Runs in the system tray**: closing the window keeps the app running next to the clock, with an option to start with Windows (installed version only)
- **Settings**: choose your workdays, save and restore a backup file, start from scratch or load the sample data again
- Data is saved locally in a JSON file (`%APPDATA%/yovel/yovel-dados.json`), nothing goes to a server

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

## Releasing a new version

A GitHub Actions workflow builds the Windows installer and publishes it on the Releases page whenever a version tag is pushed:

```bash
npm version patch
git push --follow-tags
```

---

Developed by Lucas Fernando
