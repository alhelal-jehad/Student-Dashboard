# Studynet Dashboard

Vite + TypeScript + Tailwind. Node 22+.

```
cp .env.example .env
npm ci
npm run dev        # http://localhost:5173, /api proxied to :8080
npm run build      # typecheck + build; then node scripts/check-budget.mjs
npm run typecheck | lint | test | format:check
```

Layering (model / view / controller per feature) is enforced by ESLint, see `eslint.config.js`.
Production CSP is set as an HTTP header; the `<meta>` in `index.html` is the dev fallback.
