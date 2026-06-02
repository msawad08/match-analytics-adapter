/**
 * Anti-Corruption Layer
 *
 * All v1 API knowledge lives here. The rest of the app speaks only in v2 types.
 * If the backend schema changes, this file is the single place to fix it.
 *
 * Documented mismatches flagged for the team:
 *   1. child_id / first_name / last_name → camelCase rename
 *   2. session_date ISO datetime → date-only string (no timezone handling yet — discuss with BE)
 *   3. analysis.status "completed" ≠ v2 "analysed" — vocabulary divergence, needs alignment
 *   4. media.full_match_url → un-nested as matchVideoUrl
 *   5. event_label "GOAL" → eventType "goal" — uppercase/lowercase bug in v1
 *   6. First-child assumption — no multi-child parent support; discuss UX for families with >1 kid
 */

import { fetchChildren, fetchHighlights, fetchLatestSession } from './api'
import type {
  Analysis,
  Child,
  Highlight,
  Session,
  UnifiedHeroData,
  V1Child,
  V1Highlight,
  V1Session,
} from '../types'

// ─── Individual mappers ───────────────────────────────────────────────────────

function adaptChild(v1: V1Child): Child {
  return {
    id: v1.child_id,
    firstName: v1.first_name,
    lastName: v1.last_name,
    academyId: v1.academy_id,
    team: { teamId: v1.team.team_id, teamName: v1.team.team_name },
    jerseyNumber: v1.jersey_number,
    primaryPosition: v1.primary_position,
  }
}

function adaptSession(v1: V1Session): Session {
  return {
    id: v1.session_id,
    kind: v1.kind,
    date: v1.session_date.split('T')[0],  // "2026-04-17T15:00:00Z" → "2026-04-17"
    opponent: v1.opponent_name,
    competitionLabel: v1.competition_label,
    venue: v1.venue,
    status: v1.analysis.status === 'completed' ? 'analysed' : 'pending',
    matchVideoUrl: v1.media.full_match_url,
    thumbnailUrl: v1.media.thumbnail_url,
  }
}

function adaptAnalysis(v1: V1Session): Analysis {
  return {
    compositeScore: v1.analysis.composite_score,
    categories: v1.analysis.categories,
    minutesPlayed: v1.analysis.minutes_played,
    teamOutcome: v1.analysis.team_outcome,
    scoredAt: v1.analysis.scored_at,
  }
}

function adaptHighlight(v1: V1Highlight): Highlight {
  return {
    id: v1.highlight_uuid,
    eventType: v1.event_label.toLowerCase(),  // "GOAL" → "goal"
    timestampSeconds: v1.ts_seconds_in_session,
    durationSeconds: v1.clip_seconds,
    clipUrl: v1.clip_url,
    aiConfidence: v1.ai_confidence,
    flaggedByCoach: v1.flagged_by_coach,
  }
}

function pickBestClip(clips: Highlight[]): Highlight | null {
  return (
    clips.find((c) => c.eventType === 'goal') ??
    clips.find((c) => c.eventType === 'key_pass') ??
    clips[0] ??
    null
  )
}

// ─── Unified orchestrator (the Anti-Corruption Layer entry point) ─────────────

export async function getUnifiedParentHeroData(
  parentId: string,
): Promise<UnifiedHeroData> {
  // 1. Resolve the parent's first child
  //    ⚠ Assumption: first child is the default view. Needs UX decision for multi-kid parents.
  const v1Children = await fetchChildren(parentId)
  const kid = adaptChild(v1Children[0])

  // 2. Fetch the kid's latest analysed session + performance analysis
  const v1Session = await fetchLatestSession(kid.id)
  const session = adaptSession(v1Session)
  const analysis = adaptAnalysis(v1Session)

  // 3. Fetch highlights — fault tolerant.
  //    If this fails (network blip, empty response), the hero card still renders
  //    with the score and match info; the clip button is simply hidden.
  let bestClip: Highlight | null = null
  try {
    const v1Highlights = await fetchHighlights(kid.id, session.id)
    bestClip = pickBestClip(v1Highlights.map(adaptHighlight))
  } catch {
    // Non-fatal — graceful degradation per implementation spec
  }

  return { kid, session, analysis, bestClip }
}
