'use client'

import { useEffect } from 'react'
import { trackPageLoad } from '@/lib/performance-monitoring'

type PageLoadTrackerProps = {
	page: string
}

export function PageLoadTracker({ page }: PageLoadTrackerProps) {
	useEffect(() => {
		const done = trackPageLoad(page)
		return () => done()
	}, [page])

	return null
}


