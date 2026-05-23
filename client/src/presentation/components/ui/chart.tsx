import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = {
  [key: string]: {
    color?: string
    label?: React.ReactNode
  }
}

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

function ChartContainer({
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
  config: ChartConfig
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn('flex min-h-0 min-w-0 justify-center text-xs', className)}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer height="100%" minWidth={0} width="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  className,
  payload,
}: React.ComponentProps<'div'> & {
  active?: boolean
  payload?: ReadonlyArray<{
    dataKey?: unknown
    name?: unknown
    value?: unknown
  }>
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-28 gap-1 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? 'value')
        const label = config[key]?.label ?? formatTooltipValue(item.name)

        return (
          <div className="flex items-center justify-between gap-3" key={key}>
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formatTooltipValue(item.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function formatTooltipValue(value: unknown) {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
