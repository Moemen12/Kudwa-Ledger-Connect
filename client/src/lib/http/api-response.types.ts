export type ApiSuccess<TData> = {
  ok: true
  data: TData
}

export type ApiFailure = {
  ok: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure
