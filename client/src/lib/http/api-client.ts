import { appConfig } from '@/lib/config/app'
import { ApplicationError } from '@/lib/errors/application-error'
import type { ApiResponse } from './api-response.types'

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  const body = (await response.json()) as ApiResponse<TResponse>

  if (!body.ok) {
    throw new ApplicationError(body.error.message, body.error.code)
  }

  if (!response.ok) {
    throw new ApplicationError(
      `Request failed with status ${response.status}`,
      'HTTP_REQUEST_FAILED',
    )
  }

  return body.data
}
