# Task 2 — ParentHomeHero: Frontend/Backend Integration

Replaces the static mock data in `parent-home-snippet.tsx` with a real fetch pipeline against the v1 NestJS API, using an Anti-Corruption Layer to insulate the UI from legacy snake_case shapes.

---

## Architecture

```
ParentHomeHero (UI only)
  └── useParentHome (state: loading / error / data)
        └── getUnifiedParentHeroData (Anti-Corruption Layer)
              ├── fetchChildren        → adaptChild
              ├── fetchLatestSession   → adaptSession + adaptAnalysis
              └── fetchHighlights      → adaptHighlight  [fault-tolerant]
```

The Anti-Corruption Layer (`src/lib/adapters.ts`) is the single place that knows about v1 API shapes. If the backend schema changes, only this file needs updating — the component and hook are untouched.

---

## Folder Structure

```
task2/
├── data/
│   └── v1-api-response.json      # v1 API reference shapes
├── src/
│   ├── components/
│   │   └── ParentHomeHero.tsx    # UI-only component
│   ├── hooks/
│   │   └── useParentHome.ts      # thin state wrapper
│   ├── lib/
│   │   ├── api.ts                # raw v1 fetch wrappers
│   │   └── adapters.ts           # Anti-Corruption Layer
│   └── types/
│       └── index.ts              # all shared TS interfaces
├── tests/
│   ├── __mocks__/
│   │   └── lucide-react.tsx      # jest stub
│   └── ParentHomeHero.test.tsx   # 6 test cases
├── jest.config.js
├── tsconfig.json
└── package.json
```

---

## Setup

```bash
npm install
```

Set environment variables (or create a `.env.local` for Next.js):

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.fairpl.ai
NEXT_PUBLIC_FAIRPLAI_TEST_TOKEN=<your-jwt-token>
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Re-run tests on file change |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | TypeScript type check (no emit) |

---

## Test Cases

| # | Scenario |
|---|----------|
| 1 | Loading indicator shown while fetch is in-flight |
| 2 | Error message shown when children API call fails |
| 3 | Full card renders: name, score, GOAL clip (priority over KEY_PASS), Watch CTA |
| 4 | Watch CTA hidden when `full_match_url` is null |
| 5 | Clip button hidden when highlights list is empty |
| 6 | Highlights fetch failure is non-fatal — card renders without clip (graceful degradation) |

---

## Field Mismatches & Flags for the Team

All mismatches are bridged in `src/lib/adapters.ts`. The following were flagged:

| v1 field | v2 expectation | Resolution |
|----------|---------------|------------|
| `child_id` | `id` | Renamed |
| `first_name` / `last_name` | `firstName` / `lastName` | camelCase |
| `session_date` (ISO datetime) | `date` (YYYY-MM-DD) | `.split('T')[0]` — no timezone handling yet |
| `analysis.status: "completed"` | `status: "analysed"` | Vocabulary mismatch — should align with BE |
| `analysis.composite_score` | `compositeScore` | Un-nested + renamed |
| `media.full_match_url` | `matchVideoUrl` | Un-nested + renamed |
| `event_label: "GOAL"` | `eventType: "goal"` | `.toLowerCase()` — uppercase bug in v1 |
| `ts_seconds_in_session` | `timestampSeconds` | Renamed |
| `clip_seconds` | `durationSeconds` | Renamed |

**Open questions for sprint board:**
1. **Multi-child parents** — current code picks `data[0]` (first child). What's the UX for families with multiple kids?
2. **Timezone handling** — `session_date` is truncated to date-only. Is locale-aware formatting needed?
