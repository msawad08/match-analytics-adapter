# FairplAI Take-Home

Three tasks completed as part of the FairplAI engineering assessment.

---

## Task 1 — AI Highlight Curation Pipeline

A Node.js/TypeScript script that processes raw match event data into curated highlight clips using a two-stage pipeline: rule-based clustering followed by LLM semantic curation via the Anthropic API.

```bash
cd task1
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm start
```

Output: `task1/highlights.json`

---

## Task 2 — Frontend / Backend Integration

A Next.js app that wires the v2 parent hero component to the v1 NestJS API shape using an Anti-Corruption Layer. Includes API route handlers (BFF pattern), loading/error states, and field-mismatch documentation. Runs in demo mode out of the box with fixture data.

```bash
cd task2
npm install
npm run dev      # http://localhost:3000/parent-home
npm test         # 6 tests
```

Set `V1_API_BASE_URL` and `FAIRPLAI_TOKEN` in `.env.local` to connect to a real backend.

---

## Task 3 — Reflection

Written answers to three questions on trade-offs, evaluation, and week-one priorities.

→ [`task3/notes.md`](task3/notes.md)
