'use client'

import { useEffect, useState } from 'react'
import { getUnifiedParentHeroData } from '../lib/adapters'
import type { UnifiedHeroData } from '../types'

interface ParentHomeState {
  data: UnifiedHeroData | null
  loading: boolean
  error: string | null
}

export function useParentHome(parentId: string): ParentHomeState {
  const [state, setState] = useState<ParentHomeState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    getUnifiedParentHeroData(parentId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Something went wrong.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [parentId])

  return state
}
