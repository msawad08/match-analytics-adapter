import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FairplAI — Parent Home',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#020817' }}>{children}</body>
    </html>
  )
}
