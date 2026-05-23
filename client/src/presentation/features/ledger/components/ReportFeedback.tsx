type ReportFeedbackProps = {
  children: string
  tone?: 'danger' | 'muted'
}

export function ReportFeedback({
  children,
  tone = 'muted',
}: ReportFeedbackProps) {
  if (tone === 'danger') {
    return (
      <div className="mb-4 rounded-lg border border-red-700 bg-red-50 px-3.5 py-3 text-red-700">
        {children}
      </div>
    )
  }

  return <div className="px-5 py-12 text-center text-slate-600">{children}</div>
}
