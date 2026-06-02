import { ParentHomeHero } from '@/src/components/ParentHomeHero'

export default function ParentHomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#020817',
      display: 'flex',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <ParentHomeHero parentId="parent-001" />
      </div>
    </main>
  )
}
