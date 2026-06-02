import { NextResponse } from 'next/server'

const FIXTURE = {
  session_id: '0fdb4280-9223-44b8-a1f3-39fb8e95158f',
  kind: 'match',
  session_date: '2026-04-17T15:00:00Z',
  opponent_name: 'Al Wasl Academy',
  competition_label: 'UAE Youth League',
  venue: 'Al Rais Academy Pitch',
  analysis: {
    status: 'completed',
    composite_score: 66.4,
    scored_at: '2026-04-17T17:42:00Z',
    categories: {
      physical: 73.1,
      passing: 64.0,
      dribbling: 63.2,
      defending: 83.5,
      control: 58.7,
      impact: 61.0,
    },
    minutes_played: 55,
    team_outcome: 'win',
  },
  media: {
    full_match_url: 'https://media.fairpl.ai/sessions/0fdb4280/full.mp4',
    ai_overlay_url: null,
    thumbnail_url: 'https://media.fairpl.ai/sessions/0fdb4280/thumb.jpg',
  },
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await context.params

  if (!process.env.V1_API_BASE_URL) {
    return NextResponse.json(FIXTURE)
  }

  const res = await fetch(
    `${process.env.V1_API_BASE_URL}/api/v1/players/${playerId}/sessions/latest-analysed`,
    { headers: { Authorization: `Bearer ${process.env.FAIRPLAI_TOKEN ?? ''}` } },
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
