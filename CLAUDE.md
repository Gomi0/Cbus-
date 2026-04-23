# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build
npm run lint       # ESLint on all .js/.jsx files
npm run preview    # Preview production build
```

No test runner is configured.

## Architecture

**Stack:** React 19, React Router DOM 7, Vite 8, Tailwind CSS 4, Lucide React icons. JavaScript only — no TypeScript.

**Frontend-only prototype:** No backend API. All data lives in `src/data/mockData.js` (classrooms, time slots, reservations, floors). Auth state is persisted in `localStorage` (`spu_users`, `spu_user`). Default admin credentials: `admin@spu.ac.th` / `password`.

### Routing (`src/App.jsx`)

- Public: `/login`, `/forgot-password`
- Protected (any logged-in user): `/dashboard`, `/booking`
- Protected + admin-only: `/building`
- Default `/` redirects to `/dashboard`

`ProtectedRoute` component checks `AuthContext.user`; admin-only routes additionally check `user.role === 'admin'`.

### State Management (`src/context/`)

- **AuthContext** — login, register, logout, updateProfile, forgotPassword. User object stripped of password before storage.
- **ToastContext** — global toast system; call `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()` from any component.

Both contexts are provided at the root in `src/main.jsx`.

### Pages (`src/pages/`)

| Route | File | Notes |
|---|---|---|
| `/login` | `Login.jsx` | Sign-in / sign-up tabs |
| `/forgot-password` | `ForgotPassword.jsx` | UI only, no logic |
| `/dashboard` | `CheckReserved.jsx` | Reservation list with search, delete, pagination |
| `/booking` | `Booking.jsx` | Classroom search form |
| `/building` | `BuildingControl.jsx` | Admin: per-floor AC/lights toggle |

`src/pages/` also contains subdirectories (`auth/`, `booking/`, `building/`, `reserved/`, `settings/`) with duplicate/alternative implementations — these are **not routed** in `App.jsx`.

### Styling

Primary brand color: `#E91E8C` (pink/magenta) used for buttons, active nav links, and accents. Tailwind CSS utility classes throughout — no `tailwind.config.js` (uses defaults via `@tailwindcss/vite` plugin).

### ESLint

Variables matching `/^[A-Z_]/` are excluded from `no-unused-vars` to allow importing components without triggering the rule.
