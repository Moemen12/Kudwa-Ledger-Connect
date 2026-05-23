import { Skeleton } from '@/presentation/components/ui/skeleton'

const SKELETON_PERIODS = Array.from({ length: 8 }, (_, index) => `period-${index}`)
const SKELETON_ROWS = Array.from({ length: 12 }, (_, index) => `row-${index}`)
const SKELETON_SUMMARY_ITEMS = ['status', 'periods', 'rows', 'currency']

export function LedgerReportSkeleton() {
  return (
    <>
      <header className="mb-5 flex flex-col items-start justify-between gap-6 lg:flex-row">
        <div className="w-full max-w-3xl">
          <Skeleton className="mb-3.5 h-3 w-32" />
          <Skeleton className="mb-3 h-11 w-full max-w-[420px]" />
          <Skeleton className="h-6 w-full max-w-[620px]" />
        </div>

        <div className="grid w-full min-w-0 justify-items-stretch gap-2.5 lg:w-auto lg:min-w-[260px] lg:justify-items-end">
          <Skeleton className="h-9 w-full lg:w-40" />
          <Skeleton className="h-5 w-full lg:w-52" />
        </div>
      </header>

      <section
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Loading report summary"
      >
        {SKELETON_SUMMARY_ITEMS.map((item) => (
          <div
            className="min-h-20 rounded-lg border border-slate-200 bg-white p-3.5"
            key={item}
          >
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </section>

      <section
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(22,27,36,0.08)]"
        aria-label="Loading profit and loss report"
      >
        <div className="max-h-[calc(100svh-360px)] overflow-hidden sm:max-h-[calc(100svh-260px)]">
          <div className="min-w-[1180px]">
            <div className="grid h-10 grid-cols-[360px_repeat(8,1fr)] border-b border-slate-200 bg-slate-100">
              <div className="px-3 py-2">
                <Skeleton className="h-4 w-24" />
              </div>
              {SKELETON_PERIODS.map((period) => (
                <div className="px-3 py-2" key={period}>
                  <Skeleton className="ml-auto h-4 w-20" />
                </div>
              ))}
            </div>

            {SKELETON_ROWS.map((row, index) => (
              <div
                className="grid h-10 grid-cols-[360px_repeat(8,1fr)] border-b border-slate-200"
                key={row}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="size-[22px]" />
                  <Skeleton
                    className="h-4"
                    style={{ width: `${Math.max(120, 260 - index * 8)}px` }}
                  />
                </div>
                {SKELETON_PERIODS.map((period) => (
                  <div className="px-3 py-2" key={`${row}-${period}`}>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
