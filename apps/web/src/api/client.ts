export class ApiError extends Error {
  status: number
  code?: string
  orderId?: string

  constructor(message: string, status: number, code?: string, orderId?: string) {
    super(message)
    this.status = status
    this.code = code
    this.orderId = orderId
  }
}

export function apiUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

let authToken = ''

export function setApiAuth(token: string) {
  authToken = token
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set('content-type', 'application/json')
  if (authToken) headers.set('authorization', `Bearer ${authToken}`)

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('没发出去，留在这一页再试一次', 0, 'NETWORK')
  }

  const text = await response.text()
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  if (!response.ok) {
    const raw = data.message
    const message = Array.isArray(raw)
      ? raw.map(String).join('，')
      : typeof raw === 'string'
        ? raw
        : '没发出去，再试一次'
    throw new ApiError(
      message,
      response.status,
      typeof data.code === 'string' ? data.code : undefined,
      typeof data.orderId === 'string' ? data.orderId : undefined,
    )
  }
  return data as T
}
