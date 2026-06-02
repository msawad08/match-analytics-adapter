import { NextResponse } from 'next/server'

const FIXTURE = {
  data: [
    {
      highlight_uuid: 'h-2026-04-17-001',
      event_label: 'GOAL',
      ts_seconds_in_session: 840,
      clip_seconds: 14,
      clip_url: 'https://media.fairpl.ai/clips/h-2026-04-17-001.mp4',
      privacy_setting: 'parent_visible',
      ai_confidence: 0.95,
      flagged_by_coach: true,
    },
    {
      highlight_uuid: 'h-2026-04-17-002',
      event_label: 'KEY_PASS',
      ts_seconds_in_session: 1560,
      clip_seconds: 16,
      clip_url: 'https://media.fairpl.ai/clips/h-2026-04-17-002.mp4',
      privacy_setting: 'parent_visible',
      ai_confidence: 0.89,
      flagged_by_coach: false,
    },
  ],
  pagination: { page: 1, page_size: 50, total: 2 },
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ playerId: string; sessionId: string }> },
) {
  const { playerId, sessionId } = await context.params

  if (!process.env.V1_API_BASE_URL) {
    return NextResponse.json(FIXTURE)
  }

  const res = await fetch(
    `${process.env.V1_API_BASE_URL}/api/v1/players/${playerId}/sessions/${sessionId}/highlights`,
    { headers: { Authorization: `Bearer ${process.env.FAIRPLAI_TOKEN ?? ''}` } },
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
