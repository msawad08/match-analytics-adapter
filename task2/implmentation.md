# Implementation Plan: Frontend / Backend Integration (Task 2)

## Goal
Bridge the gap between the legacy NestJS v1 backend API shapes and the new v2 Next.js frontend component. We need to replace the static mock data in `parent-home-snippet.tsx` with a resilient, sequential fetch pipeline that maps data cleanly into the component's expected structure.

---

## Technical Approach: The Anti-Corruption Layer
Instead of scattering fetch logic and snake-case mappings inside the React component, I am introducing a dedicated data adapter layer (`getUnifiedParentHeroData`). This decouples the UI from legacy API volatility. If the v1 backend schema changes tomorrow, we only fix it in the adapter, leaving the UI completely untouched.

---

## Step-by-Step Execution Plan

### Step 1: Sequential Fetch Orchestration
Because the data required for a single hero card is spread across three different endpoints in `v1-api-response.json`, the adapter will execute them in a strict asynchronous sequence:
1.  **Fetch Child Info:** Query `/api/v1/parents/{parentId}/children` to isolate the student's unique `child_id`.
2.  **Fetch Latest Session:** Use that `child_id` to hit `/api/v1/players/{child_id}/sessions/latest-analysed` to grab performance metrics and full match video URLs.
3.  **Fetch Highlights:** Use both IDs to query `/api/v1/players/{child_id}/sessions/{sessionId}/highlights` to get the clip timeline.

### Step 2: Data Mapping & Normalization
The adapter will transform the raw data into clean, camelCase TypeScript interfaces matching what the v2 component expects. Crucial mappings include:
*   `child_id` ➔ `kid.id`
*   `first_name` / `last_name` ➔ `kid.firstName` / `kid.lastName`
*   `analysis.composite_score` ➔ `matchAnalysis.compositeScore`
*   `media.full_match_url` ➔ `latestMatch.matchVideoUrl`

### Step 3: Bug Resolution (Casing Normalization)
*   **The Mismatch:** The legacy API returns uppercase event tokens (`"GOAL"`, `"KEY_PASS"`). However, the v2 frontend snippet performs a strict lowercase check (`c.eventType === 'goal'`).
*   **The Fix:** The adapter will explicitly call `.toLowerCase()` on the `event_label` fields during mapping to ensure the "best clip" logic evaluates properly and renders the clip button.

### Step 4: Component State & Graceful Degradation
*   **Loading/Error States:** Introduce React standard states (`data`, `loading`, `error`) to replace the rigid static `useMemo` hooks.
*   **Fault Tolerance:** Wrap the Highlights fetch in its own internal `try/catch`. If the highlights API fails or returns an empty array, the application should *not* crash. The hero card will still successfully render the player's name, match date, and composite score—it just elegantly hides the video clip button.

---

## Mismatches & Concerns to Flag for the Team
During development, I noticed a few discrepancies that I'd add to the team's sprint board:
1.  **Strict Array Fallbacks:** The code assumes the parent's *first* child is the default view. We need to discuss how this scales for parents with multiple kids in the academy.
2.  **Date String Discrepancy:** The backend sends a full ISO timestamp (`session_date`), but the frontend treats it as a generic presentation string. The adapter splits this string to show a clean `YYYY-MM-DD` layout for now.