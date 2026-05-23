export const appConfig = {
  name: 'Kudwa Ledger Connect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
} as const
