export const apiRoutes = {
  ai: {
    ledger: {
      insights: '/ai/ledger/insights',
      query: '/ai/ledger/query',
    },
  },
  ledger: {
    report: '/ledger/report',
    integrations: '/ledger/integrations',
  },
} as const
