import { createProxyRequestHandler, isProxyEnabled } from './proxySupport'

describe('proxySupport', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NODE_USE_ENV_PROXY
    delete process.env.NODE_OPTIONS
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.NO_PROXY
    delete process.env.no_proxy
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isProxyEnabled', () => {
    it('should be false when nothing is set', () => {
      expect(isProxyEnabled()).toBe(false)
    })

    it('should be true when NODE_USE_ENV_PROXY is "1"', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      expect(isProxyEnabled()).toBe(true)
    })

    it('should be true when NODE_USE_ENV_PROXY is "true" (case-insensitive)', () => {
      process.env.NODE_USE_ENV_PROXY = 'TRUE'
      expect(isProxyEnabled()).toBe(true)
    })
  })

  describe('createProxyRequestHandler', () => {
    it('should return an empty object when proxy support is not enabled', () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:3128'
      expect(createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')).toEqual({})
    })

    it('should return an empty object when enabled but no proxy env var is set', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      expect(createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')).toEqual({})
    })

    it('should return a request handler when enabled and a proxy is configured', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = 'http://proxy.example.com:3128'

      const result = createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')

      expect(result.requestHandler).toBeDefined()
    })

    it('should not proxy a target URL matched by NO_PROXY', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = 'http://proxy.example.com:3128'
      process.env.NO_PROXY = '.amazonaws.com'

      const result = createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')

      expect(result).toEqual({})
    })

    it('should still proxy a target URL not matched by NO_PROXY', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = 'http://proxy.example.com:3128'
      process.env.NO_PROXY = 'other.example.com'

      const result = createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')

      expect(result.requestHandler).toBeDefined()
    })

    it('should not proxy anything when NO_PROXY is "*"', () => {
      process.env.NODE_USE_ENV_PROXY = '1'
      process.env.HTTPS_PROXY = 'http://proxy.example.com:3128'
      process.env.NO_PROXY = '*'

      const result = createProxyRequestHandler('https://sqs.eu-west-2.amazonaws.com')

      expect(result).toEqual({})
    })
  })
})
