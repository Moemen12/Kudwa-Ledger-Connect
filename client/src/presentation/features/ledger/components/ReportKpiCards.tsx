import {
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts'
import {
  formatCurrency,
  getReportKpis,
  type ReportKpi,
  type ReportPeriod,
  type UnifiedProfitAndLossReport,
} from '@/features/ledger'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/presentation/components/ui/chart'

type ReportKpiCardsProps = {
  periods: ReportPeriod[]
  report: UnifiedProfitAndLossReport | null
}

export function ReportKpiCards({ periods, report }: ReportKpiCardsProps) {
  const kpis = getReportKpis(report, periods)

  return (
    <section
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Profit and loss key metrics"
    >
      {kpis.map((kpi) => (
        <ReportKpiCard
          currency={report?.currency ?? 'USD'}
          key={kpi.id}
          kpi={kpi}
        />
      ))}
    </section>
  )
}

function ReportKpiCard({ currency, kpi }: { currency: string; kpi: ReportKpi }) {
  const changeLabel =
    kpi.changePercent === null
      ? 'New activity'
      : `${kpi.direction === 'down' ? '' : '+'}${Math.round(kpi.changePercent)}% YTD`

  return (
    <article className="min-h-[146px] rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-2">
        <p className="text-sm text-slate-600">{kpi.label}</p>
        <strong className="mt-1 block text-2xl font-semibold tracking-normal text-slate-950">
          {formatCurrency(kpi.value, currency)}
        </strong>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-xs font-medium ${getChangeClassName(kpi)}`}>
            {getChangePrefix(kpi.direction)}
            {changeLabel}
          </span>
          {kpi.sourceRowLabel !== kpi.label ? (
            <span className="text-xs text-slate-500">
              using {kpi.sourceRowLabel}
            </span>
          ) : null}
          {kpi.valuePeriodLabel ? (
            <span className="text-xs text-slate-500">
              latest {kpi.valuePeriodLabel}
            </span>
          ) : null}
        </div>
      </div>

      <KpiTrendChart kpi={kpi} />
    </article>
  )
}

function KpiTrendChart({ kpi }: { kpi: ReportKpi }) {
  const chartColor = kpi.tone === 'danger' ? '#b91c1c' : '#0f766e'
  const chartConfig = {
    value: {
      color: chartColor,
      label: kpi.label,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer className="h-14 w-full" config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={getChartData(kpi)}
        margin={{ bottom: 0, left: 0, right: 0, top: 4 }}
      >
        <defs>
          <linearGradient id={`${kpi.id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.22} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="transparent" />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Area
          dataKey="value"
          fill={`url(#${kpi.id}-fill)`}
          fillOpacity={1}
          isAnimationActive={false}
          stroke={chartColor}
          strokeWidth={2.4}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  )
}

function getChartData(kpi: ReportKpi) {
  const nonZeroPoints = kpi.trend.filter(
    (point) => point.hasValue && point.value !== 0,
  )

  if (nonZeroPoints.length > 0) {
    return nonZeroPoints
  }

  return kpi.trend.filter((point) => point.hasValue)
}

function getChangeClassName(kpi: ReportKpi) {
  if (kpi.direction === 'flat') {
    return 'text-slate-500'
  }

  if (kpi.tone === 'danger') {
    return kpi.direction === 'down' ? 'text-emerald-700' : 'text-red-700'
  }

  return kpi.direction === 'up' ? 'text-emerald-700' : 'text-red-700'
}

function getChangePrefix(direction: ReportKpi['direction']) {
  if (direction === 'up') {
    return '+ '
  }

  if (direction === 'down') {
    return '- '
  }

  return ''
}
