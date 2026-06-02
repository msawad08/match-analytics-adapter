'use client'

import { useState } from 'react'
import { Play, X, Trophy, Calendar, MapPin } from 'lucide-react'
import { useParentHome } from '../hooks/useParentHome'
import type { Highlight } from '../types'

interface ParentHomeProps {
  parentId: string
}

// ─── Video Modal ──────────────────────────────────────────────────────────────

function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, position: 'relative' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: -40, right: 0,
          background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
        }}>
          <X size={18} /> Close
        </button>
        <p style={{ color: '#ccc', fontSize: 13, marginBottom: 8 }}>{title}</p>
        <video
          src={url}
          controls
          autoPlay
          style={{ width: '100%', borderRadius: 12, background: '#000' }}
          onError={e => {
            const el = e.currentTarget
            el.style.display = 'none'
            const msg = el.nextElementSibling as HTMLElement | null
            if (msg) msg.style.display = 'flex'
          }}
        />
        {/* shown only when video fails to load */}
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          height: 200, borderRadius: 12, background: '#1a1a2e', color: '#888', fontSize: 14,
        }}>
          Video unavailable in demo mode
        </div>
      </div>
    </div>
  )
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────

function StatBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({ clip, onPlay }: { clip: Highlight; onPlay: () => void }) {
  const label = clip.eventType.toUpperCase().replace('_', ' ')
  const mins = Math.floor(clip.timestampSeconds / 60)
  const secs = clip.timestampSeconds % 60
  const isGoal = clip.eventType === 'goal'

  return (
    <button onClick={onPlay} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: `1px solid ${isGoal ? '#f59e0b44' : '#334155'}`,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: isGoal ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={18} fill="#fff" color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {mins}:{String(secs).padStart(2, '0')} · {clip.durationSeconds}s clip
          {clip.flaggedByCoach && <span style={{ marginLeft: 8, color: '#f59e0b' }}>⭐ Coach pick</span>}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#475569' }}>{Math.round(clip.aiConfidence * 100)}% conf.</div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ParentHomeHero({ parentId }: ParentHomeProps) {
  const { data, loading, error } = useParentHome(parentId)
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null)

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Loading match data…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20, borderRadius: 12, background: '#fef2f2', color: '#991b1b', fontSize: 14, border: '1px solid #fecaca' }}>
        {error}
      </div>
    )
  }

  if (!data) {
    return <div style={{ color: '#64748b', fontSize: 14 }}>Nothing to show yet.</div>
  }

  const { kid, session, analysis, bestClip } = data
  const outcome = session.status === 'analysed' ? analysis.teamOutcome : null
  const outcomeColor = outcome === 'win' ? '#22c55e' : outcome === 'loss' ? '#ef4444' : '#f59e0b'

  return (
    <>
      {activeVideo && (
        <VideoModal url={activeVideo.url} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
      )}

      <div style={{ color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header card */}
        <div style={{
          padding: '20px 20px 16px', borderRadius: 16,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          border: '1px solid #1e3a5f',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
                {kid.firstName} {kid.lastName}
              </h2>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                #{kid.jerseyNumber} · {kid.primaryPosition} · {kid.team.teamName}
              </div>
            </div>
            {outcome && (
              <span style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: `${outcomeColor}22`, color: outcomeColor, textTransform: 'uppercase',
              }}>
                {outcome}
              </span>
            )}
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <Trophy size={14} />
              {session.opponent ? `vs ${session.opponent}` : 'Match'} · {session.competitionLabel}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <Calendar size={14} /> {session.date}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <MapPin size={14} /> {session.venue}
            </div>
          </div>
        </div>

        {/* Score + stats */}
        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#0f172a', border: '1px solid #1e293b' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: '#f1f5f9' }}>
              {analysis.compositeScore}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
              Composite Score · {analysis.minutesPlayed} min played
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {Object.entries(analysis.categories).map(([key, val]) => (
              <StatBar key={key} label={key} value={val} />
            ))}
          </div>
        </div>

        {/* Best clip */}
        {bestClip && (
          <div>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 4 }}>
              Best highlight
            </div>
            <ClipCard
              clip={bestClip}
              onPlay={() => setActiveVideo({ url: bestClip.clipUrl, title: `${bestClip.eventType.toUpperCase().replace('_', ' ')} · ${kid.firstName} ${kid.lastName}` })}
            />
          </div>
        )}

        {/* Watch full match */}
        {session.matchVideoUrl && (
          <button
            onClick={() => setActiveVideo({ url: session.matchVideoUrl!, title: `Full match · ${session.opponent ? `vs ${session.opponent}` : 'Match'} · ${session.date}` })}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Play size={16} fill="#fff" /> Watch full match
          </button>
        )}
      </div>
    </>
  )
}
