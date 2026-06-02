import type { V1ApiError, V1Child, V1Highlight, V1Session } from '../types'

// Calls our own Next.js API routes (/api/v1/*).
// Auth token lives server-side in the route handlers — never exposed to the browser.
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)

  if (!res.ok) {
    const err: V1ApiError = await res.json()
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function fetchChildren(parentId: string): Promise<V1Child[]> {
  const { data } = await apiFetch<{ data: V1Child[] }>(
    `/api/v1/parents/${parentId}/children`,
  )
  return data
}

export async function fetchLatestSession(playerId: string): Promise<V1Session> {
  return apiFetch<V1Session>(
    `/api/v1/players/${playerId}/sessions/latest-analysed`,
  )
}

export async function fetchHighlights(
  playerId: string,
  sessionId: string,
): Promise<V1Highlight[]> {
  const { data } = await apiFetch<{ data: V1Highlight[] }>(
    `/api/v1/players/${playerId}/sessions/${sessionId}/highlights`,
  )
  return data
}
