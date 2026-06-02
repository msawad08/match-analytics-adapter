// ─── v1 API shapes (snake_case — as returned by the NestJS backend) ──────────

export interface V1Child {
  child_id: string
  first_name: string
  last_name: string
  academy_id: string
  team: { team_id: string; team_name: string }
  jersey_number: number
  primary_position: string
}

export interface V1Session {
  session_id: string
  kind: string
  session_date: string       // ISO datetime e.g. "2026-04-17T15:00:00Z"
  opponent_name: string
  competition_label: string
  venue: string
  analysis: {
    status: string           // "completed" in v1 (maps to "analysed" in v2)
    composite_score: number
    scored_at: string
    categories: Record<string, number>
    minutes_played: number
    team_outcome: string
  }
  media: {
    full_match_url: string | null
    ai_overlay_url: string | null
    thumbnail_url: string | null
  }
}

export interface V1Highlight {
  highlight_uuid: string
  event_label: string        // uppercase: "GOAL", "KEY_PASS"
  ts_seconds_in_session: number
  clip_seconds: number
  clip_url: string
  privacy_setting: string
  ai_confidence: number
  flagged_by_coach: boolean
}

export interface V1ApiError {
  status_code: number
  error_code: string
  message: string
}

// ─── v2 Internal types (camelCase — what the component consumes) ──────────────

export interface Child {
  id: string
  firstName: string
  lastName: string
  academyId: string
  team: { teamId: string; teamName: string }
  jerseyNumber: number
  primaryPosition: string
}

export interface Session {
  id: string
  kind: string
  date: string               // date-only: "2026-04-17"
  opponent: string
  competitionLabel: string
  venue: string
  status: 'analysed' | 'pending'
  matchVideoUrl: string | null
  thumbnailUrl: string | null
}

export interface Analysis {
  compositeScore: number
  categories: Record<string, number>
  minutesPlayed: number
  teamOutcome: string
  scoredAt: string
}

export interface Highlight {
  id: string
  eventType: string          // lowercase: "goal", "key_pass"
  timestampSeconds: number
  durationSeconds: number
  clipUrl: string
  aiConfidence: number
  flaggedByCoach: boolean
}

export interface UnifiedHeroData {
  kid: Child
  session: Session
  analysis: Analysis
  bestClip: Highlight | null
}
