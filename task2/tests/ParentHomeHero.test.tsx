import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ParentHomeHero } from '../src/components/ParentHomeHero'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const childrenResponse = {
  data: [
    {
      child_id: 'player-001',
      first_name: 'Kiyan',
      last_name: 'Makkawi',
      academy_id: 'academy-001',
      team: { team_id: 'team-001', team_name: 'Under 12s' },
      jersey_number: 7,
      primary_position: 'MID',
    },
  ],
  pagination: { page: 1, page_size: 10, total: 1 },
}

const sessionResponse = {
  session_id: 'session-001',
  kind: 'match',
  session_date: '2026-04-17T15:00:00Z',
  opponent_name: 'Al Wasl Academy',
  competition_label: 'UAE Youth League',
  venue: 'Al Rais Academy Pitch',
  analysis: {
    status: 'completed',
    composite_score: 66.4,
    scored_at: '2026-04-17T17:42:00Z',
    categories: { physical: 73.1, passing: 64.0 },
    minutes_played: 55,
    team_outcome: 'win',
  },
  media: {
    full_match_url: 'https://media.fairpl.ai/sessions/full.mp4',
    ai_overlay_url: null,
    thumbnail_url: 'https://media.fairpl.ai/sessions/thumb.jpg',
  },
}

const highlightsResponse = {
  data: [
    {
      highlight_uuid: 'h-001',
      event_label: 'KEY_PASS',
      ts_seconds_in_session: 1560,
      clip_seconds: 16,
      clip_url: 'https://media.fairpl.ai/clips/h-001.mp4',
      privacy_setting: 'parent_visible',
      ai_confidence: 0.89,
      flagged_by_coach: false,
    },
    {
      highlight_uuid: 'h-002',
      event_label: 'GOAL',
      ts_seconds_in_session: 840,
      clip_seconds: 14,
      clip_url: 'https://media.fairpl.ai/clips/h-002.mp4',
      privacy_setting: 'parent_visible',
      ai_confidence: 0.95,
      flagged_by_coach: true,
    },
  ],
  pagination: { page: 1, page_size: 50, total: 2 },
}

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

type FetchResponse = object | 'error'

function mockFetch(...responses: FetchResponse[]) {
  let callIndex = 0
  global.fetch = jest.fn().mockImplementation(() => {
    const body = responses[callIndex++]
    if (body === 'error') {
      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ status_code: 500, error_code: 'SERVER_ERROR', message: 'Server error' }),
      } as Response)
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body ?? {}),
    } as Response)
  })
}

afterEach(() => {
  // @ts-expect-error resetting jsdom fetch mock
  delete global.fetch
})

// ─── Tests ────────────────────────────────────────────────────────────────────

test('1. shows loading indicator while fetch is in-flight', () => {
  global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}))

  render(<ParentHomeHero parentId="parent-001" />)

  expect(screen.getByText('Loading match data…')).toBeInTheDocument()
})

test('2. shows error when the children API call fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('No player exists with the supplied id.'))

  render(<ParentHomeHero parentId="bad-parent" />)

  await waitFor(() =>
    expect(screen.getByText(/No player exists with the supplied id\./)).toBeInTheDocument(),
  )
})

test('3. renders name, score, GOAL clip (priority over KEY_PASS), and Watch CTA', async () => {
  mockFetch(childrenResponse, sessionResponse, highlightsResponse)

  render(<ParentHomeHero parentId="parent-001" />)

  await waitFor(() => expect(screen.getByText('Kiyan Makkawi')).toBeInTheDocument())

  // Score
  expect(screen.getByText('66.4')).toBeInTheDocument()
  // Clip button — GOAL wins over KEY_PASS per priority logic
  expect(screen.getByText(/GOAL/)).toBeInTheDocument()
  // Watch CTA present because full_match_url is set
  expect(screen.getByText('Watch full match')).toBeInTheDocument()
})

test('4. hides Watch CTA when session has no video URL', async () => {
  const noVideoSession = {
    ...sessionResponse,
    media: { ...sessionResponse.media, full_match_url: null },
  }
  mockFetch(childrenResponse, noVideoSession, highlightsResponse)

  render(<ParentHomeHero parentId="parent-001" />)

  await waitFor(() => expect(screen.getByText('Kiyan Makkawi')).toBeInTheDocument())

  expect(screen.queryByText('Watch full match')).not.toBeInTheDocument()
})

test('5. hides clip button when highlights list is empty', async () => {
  const emptyHighlights = { data: [], pagination: { page: 1, page_size: 50, total: 0 } }
  mockFetch(childrenResponse, sessionResponse, emptyHighlights)

  render(<ParentHomeHero parentId="parent-001" />)

  await waitFor(() => expect(screen.getByText('Kiyan Makkawi')).toBeInTheDocument())

  expect(screen.queryByText(/GOAL|KEY_PASS/)).not.toBeInTheDocument()
})

test('6. highlights fetch failure is non-fatal — hero card still renders without clip', async () => {
  // Calls 1 & 2 succeed; call 3 (highlights) returns a server error
  mockFetch(childrenResponse, sessionResponse, 'error')

  render(<ParentHomeHero parentId="parent-001" />)

  await waitFor(() => expect(screen.getByText('Kiyan Makkawi')).toBeInTheDocument())

  // Core hero data is present
  expect(screen.getByText('66.4')).toBeInTheDocument()
  expect(screen.getByText('Watch full match')).toBeInTheDocument()
  // Clip button is absent — graceful degradation
  expect(screen.queryByText(/GOAL|KEY_PASS/)).not.toBeInTheDocument()
  // No error state shown — component did NOT crash
  expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
})
