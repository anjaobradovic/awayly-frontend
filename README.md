# Awayly

**Awayly** is a web app for managing employee absences — vacations, sick leave, days off,
delegations and approvals — in one place.

> **Status: frontend only.** There is no backend yet. The app runs entirely on
> **mock data**: every API call is intercepted in the browser (`src/mocks`) and answered with
> realistic fake data. Changes you make (new requests, teams, holidays…) live in memory until
> you refresh the page.

🇷🇸 [Na srpskom ↓](#na-srpskom)

---

## Features

- **Dashboards** — personal (leave balance, request stats, upcoming absences), team (heatmap,
  who is away, utilization) and company-wide.
- **Absences** — calendar (month / year view), submitting and approving requests, delegations,
  public & company holidays, configurable absence types.
- **Organization** — employees (add, edit, import from CSV / template), teams, roles &
  permissions, interactive **org-chart hierarchy**.
- **Settings** — leave policies, **approval chains**, activity log, company profile,
  Active Directory integration screen.
- **Reports** — generate and download reports.
- **Sign-in flow** — login, password reset, two-factor authentication (QR code), backup codes
  with PDF export.
- **Three languages** — Serbian (Latin), Serbian (Cyrillic, generated automatically from Latin)
  and English, switchable at runtime.
- **Themes** — light / dark / follow-system mode, plus five accent colors that the company admin
  can pick in *Company profile*.
- **Responsive** — works from phones to large desktop screens.

## Tech stack

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- [Vite](https://vite.dev/)
- [Pinia](https://pinia.vuejs.org/) for state, [Vue Router](https://router.vuejs.org/)
- SCSS design tokens compiled to CSS custom properties (runtime theming)
- A tiny custom i18n layer (`src/i18n`) with plural rules and Latin → Cyrillic transliteration
- jsPDF + qrcode for backup codes

No UI framework — all components (`src/components/V*.vue`) are hand-written.

## Getting started

Requirements: **Node.js 20+** and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. You're signed in automatically as a demo company admin.
After logging out, **any email and password** will sign you in again.

Other scripts:

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run build`   | production build into `dist/`        |
| `npm run preview` | serve the production build locally   |
| `npm run format`  | format the code with Prettier        |

### Demo tricks (mock backend)

| Try this                              | Result                               |
| ------------------------------------- | ------------------------------------ |
| email containing `2fa`                | goes through QR-code 2FA setup       |
| email containing `locked`             | account temporarily locked (423)     |
| password `pogresna`                   | wrong password (401)                 |
| 2FA code `000000`                     | invalid code                         |

### Connecting a real backend (later)

Copy `.env.example` to `.env` and set:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1/
VITE_USE_MOCKS=false
```

## Project structure

```
src/
├── main.js            # app bootstrap (theme, language, mocks, router)
├── config.js          # app name, API URL, mock switch
├── router/            # all routes + auth guard
├── i18n/              # t(), plurals, Cyrillic transliteration, messages/*.js
├── mocks/             # fake backend: fetch interceptor + seed data
├── assets/scss/       # palette, design tokens, mixins, global styles
├── components/        # reusable V* components (no store access)
├── composables/       # reusable logic (use*)
├── layouts/           # main layout (sidebar, navbar, drawers) and auth layout
├── stores/            # Pinia stores, one per domain
├── utils/             # pure helper functions
└── views/             # one folder per screen
```

Code conventions are described in [CONVENTIONS.md](CONVENTIONS.md).

## Roadmap

- [ ] Backend (REST API) and real authentication
- [ ] Email notifications
- [ ] Unit & end-to-end tests

---

## Na srpskom

**Awayly** je veb aplikacija za upravljanje odsustvima zaposlenih: godišnji odmori, bolovanja,
slobodni dani, delegacije i odobravanje zahteva.

> **Za sada je ovo samo frontend.** Backend još ne postoji, pa aplikacija radi na
> **lažnim (mock) podacima**. Svaki poziv API-ja presreće se u pregledaču (`src/mocks`) i vraća
> izmišljene podatke. Izmene traju dok ne osvežiš stranicu.

### Pokretanje

```bash
npm install
npm run dev
```

Otvori <http://localhost:5173>. Automatski si prijavljen kao demo administrator. Posle odjave
prolazi **bilo koji email i lozinka**.

Jezik (srpski latinica / ćirilica / engleski) i tema (svetla / tamna) menjaju se u gornjoj
traci. Boju akcenta bira administrator u *Podešavanja → Profil kompanije*.

---

Author: **Anja Obradović**
