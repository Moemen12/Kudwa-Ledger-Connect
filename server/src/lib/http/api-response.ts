export type ApiSuccess<TData> = {
  ok: true;
  data: TData;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export function ok<TData>(data: TData): ApiSuccess<TData> {
  return {
    ok: true,
    data,
  };
}

export function fail(input: {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}): ApiFailure {
  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      ...(input.details ? { details: input.details } : {}),
    },
  };
}
