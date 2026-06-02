# AI Highlight Curation Pipeline

A Node.js/TypeScript script that turns raw sports tracking events into curated highlight clips using a two-stage pipeline:

1. **Rule-Based Clustering** — filters low-confidence noise and groups nearby events into candidate clips
2. **LLM Semantic Curation** — sends candidate clips to Claude to pick the best 6–10 highlights a parent would love to share

---

## How It Works

### Stage 1 — Clustering
- Drops events with `confidence < 0.60`
- Sorts remaining events by timestamp
- Groups events into a "moment" when they fall within a **35-second window** of each other
- Each group becomes a candidate clip

### Stage 2 — Claude Curation
- Sends all candidate clips (with resolved player names) to `claude-sonnet-4-6`
- Claude acts as an expert youth sports curator and selects the best 6–10 clips
- Priorities: box action, high-confidence shots, big saves, team build-ups
- Returns a structured JSON response — no prose

---

## Setup

```bash
cd task1
npm install
```

Copy `.env.example` and fill in your key:
```bash
cp .env.example .env
# then edit .env and set your key
```

Or export it directly:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Run

Default (reads `raw_events.json`, writes `highlights.json` in the same directory):
```bash
npm start
```

Custom input/output paths (both optional):
```bash
npx tsx pipeline.ts /path/to/input.json /path/to/output.json
```

---

## Output Schema

```json
{
  "match_id": "match_2026-05-04_alrais_vs_alwasl",
  "total_clips_curated": 8,
  "clips": [
    {
      "clip_id": "clip_001",
      "start_timestamp_seconds": 540,
      "end_timestamp_seconds": 575,
      "headline": "Box Shot by Hamad Al-Mansoori",
      "curator_score": 8.5,
      "primary_players": ["Hamad Al-Mansoori"],
      "justification": "A powerful shot from inside the box that will keep parents on the edge of their seats."
    }
  ]
}
```

---

## Project Structure

```
task1/
├── pipeline.ts       # Main script
├── raw_events.json   # Input: raw match events
├── highlights.json   # Output: curated highlights (generated)
├── .env.example      # Copy to .env and add your API key
├── tsconfig.json
├── package.json
└── README.md
```
