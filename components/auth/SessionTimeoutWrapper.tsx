'use client'

import { SessionTimeoutHandler } from './SessionTimeoutHandler'

interface SessionTimeoutWrapperProps {
  children: React.ReactNode
  timeoutMinutes?: number
  warningMinutes?: number
}

export function SessionTimeoutWrapper({
  children,
  timeoutMinutes = 60,
  warningMinutes = 5
}: SessionTimeoutWrapperProps) {
  return (
    <>
      <SessionTimeoutHandler 
        timeoutMinutes={timeoutMinutes} 
        warningMinutes={warningMinutes} 
      />
      {children}
    </>
  )
}

