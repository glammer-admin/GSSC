/**
 * Cliente HTTP genérico para comunicación con APIs externas
 * Maneja peticiones HTTP, headers, errores y serialización
 */

export interface HttpClientConfig {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  timeout?: number
}

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string>
  timeout?: number
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(`HTTP Error ${status}: ${statusText}`)
    this.name = "HttpError"
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = "NetworkError"
  }
}

export class HttpClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private timeout: number

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "") // Remove trailing slash
    this.defaultHeaders = config.defaultHeaders || {}
    this.timeout = config.timeout || 10000 // 10 seconds default
  }

  /**
   * Construye la URL con query params
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    
    return url.toString()
  }

  /**
   * Método genérico para peticiones HTTP
   */
  async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params)
    
    const headers = {
      ...this.defaultHeaders,
      ...options?.headers,
    }

    // Add Content-Type for requests with body
    if (body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout || this.timeout
    )

    try {
      console.log(`📡 [HTTP] ${method} ${url}`)
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text().catch(() => null)
        console.error(`❌ [HTTP] Error ${response.status}: ${response.statusText}`)
        console.error(`❌ [HTTP] Body:`, errorBody)
        throw new HttpError(response.status, response.statusText, errorBody)
      }

      // Handle empty responses
      const text = await response.text()
      if (!text) {
        return undefined as T
      }

      const data = JSON.parse(text) as T
      console.log(`✅ [HTTP] ${method} ${endpoint} - Success`)
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof HttpError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError("Request timeout", error)
        }
        throw new NetworkError(error.message, error)
      }

      throw new NetworkError("Unknown network error")
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, options)
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", endpoint, body, options)
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PUT", endpoint, body, options)
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PATCH", endpoint, body, options)
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, options)
  }
}

