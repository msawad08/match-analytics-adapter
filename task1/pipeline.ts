import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawEvent {
  event_id: string;
  type: string;
  player_id: string;
  timestamp_seconds: number;
  duration_seconds: number;
  confidence: number;
  pitch_x: number;
  pitch_y: number;
  ball_in_box: boolean;
  secondary_player_id: string | null;
}

interface Player {
  player_id: string;
  name: string;
  team: string;
  jersey: number;
  position: string;
}

interface MatchData {
  match_id: string;
  players_in_match: Player[];
  events: RawEvent[];
}

interface Cluster {
  cluster_id: string;
  start_timestamp_seconds: number;
  end_timestamp_seconds: number;
  events: RawEvent[];
}

interface Clip {
  clip_id: string;
  start_timestamp_seconds: number;
  end_timestamp_seconds: number;
  headline: string;
  curator_score: number;
  primary_players: string[];
  justification: string;
}

interface HighlightOutput {
  match_id: string;
  total_clips_curated: number;
  clips: Clip[];
}

// ─── Stage 1: Rule-Based Clustering ─────────────────────────────────────────

const MIN_CONFIDENCE = 0.6;
const WINDOW_SECONDS = 35;

function clusterEvents(events: RawEvent[]): Cluster[] {
  const filtered = events
    .filter((e) => e.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

  const clusters: Cluster[] = [];
  let group: RawEvent[] = [];

  for (const event of filtered) {
    if (group.length === 0 || event.timestamp_seconds - group[0].timestamp_seconds <= WINDOW_SECONDS) {
      group.push(event);
    } else {
      clusters.push(toCluster(clusters.length + 1, group));
      group = [event];
    }
  }

  if (group.length > 0) {
    clusters.push(toCluster(clusters.length + 1, group));
  }

  return clusters;
}

function toCluster(index: number, events: RawEvent[]): Cluster {
  const last = events[events.length - 1];
  return {
    cluster_id: `cluster_${String(index).padStart(3, "0")}`,
    start_timestamp_seconds: events[0].timestamp_seconds,
    end_timestamp_seconds: last.timestamp_seconds + last.duration_seconds,
    events,
  };
}

// ─── Stage 2: LLM Curation via Claude API ───────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert youth sports highlight curator for a football platform used by parents and coaches.

Your task is to review candidate highlight clips from a U12 match and select the best 6 to 10 clips that a parent would love to share.

Prioritize clips that contain:
- Action inside the 18-yard box (ball_in_box: true)
- High-confidence shots or goals
- Big saves by the goalkeeper
- Great team build-ups (key passes leading to shots)
- High-intensity sprint recoveries in dangerous moments

Respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.`;
}

function buildUserPrompt(clusters: Cluster[], players: Player[], matchId: string): string {
  const playerMap = Object.fromEntries(players.map((p) => [p.player_id, p.name]));

  // Enrich events with resolved player names before sending to LLM
  const enriched = clusters.map((c) => ({
    ...c,
    events: c.events.map((e) => ({
      ...e,
      player_name: playerMap[e.player_id] ?? e.player_id,
      secondary_player_name: e.secondary_player_id
        ? (playerMap[e.secondary_player_id] ?? e.secondary_player_id)
        : null,
    })),
  }));

  return `Below are ${clusters.length} candidate highlight clips extracted from match "${matchId}".
Player IDs have been resolved to real names in each event.

Candidate clips:
${JSON.stringify(enriched, null, 2)}

Select the best 6 to 10 clips and return ONLY this JSON structure (no other text):
{
  "match_id": "${matchId}",
  "total_clips_curated": <number>,
  "clips": [
    {
      "clip_id": "clip_001",
      "start_timestamp_seconds": <number>,
      "end_timestamp_seconds": <number>,
      "headline": "<catchy headline using the player's real name, e.g. 'Great Save by Omar Al-Sayed'>",
      "curator_score": <0-10>,
      "primary_players": ["<real player name>"],
      "justification": "<one sentence explaining why parents will love this clip>"
    }
  ]
}`;
}

async function curateWithClaude(
  clusters: Cluster[],
  players: Player[],
  matchId: string
): Promise<HighlightOutput> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildUserPrompt(clusters, players, matchId),
      },
    ],
  });

  const text = (response.content[0] as { type: string; text: string }).text;

  try {
    return JSON.parse(text) as HighlightOutput;
  } catch {
    throw new Error(`Claude returned non-JSON response:\n${text}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const inputFile = process.argv[2] ?? resolve(__dirname, "raw_events.json");
  const outputFile = process.argv[3] ?? resolve(__dirname, "highlights.json");

  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}\n`);

  const data: MatchData = JSON.parse(readFileSync(inputFile, "utf-8"));
  console.log(`Raw events loaded: ${data.events.length}`);

  const clusters = clusterEvents(data.events);
  console.log(`Candidate clips after filter & clustering: ${clusters.length}`);

  console.log("\nSending to Claude for curation...");
  const highlights = await curateWithClaude(clusters, data.players_in_match, data.match_id);

  writeFileSync(outputFile, JSON.stringify(highlights, null, 2));

  console.log(`\nCurated ${highlights.total_clips_curated} highlights → ${outputFile}`);
  console.log("\nTop clips:");
  highlights.clips.forEach((c) =>
    console.log(`  [${c.curator_score}/10] ${c.headline}`)
  );
}

main().catch((err) => {
  console.error("Error:", (err as Error).message);
  process.exit(1);
});
