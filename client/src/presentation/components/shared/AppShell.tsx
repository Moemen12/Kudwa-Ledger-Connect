import type { PropsWithChildren } from 'react'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-svh bg-slate-50 px-3 py-5 text-slate-950 sm:px-5 sm:py-8">
      {children}
    </main>
  )
}
