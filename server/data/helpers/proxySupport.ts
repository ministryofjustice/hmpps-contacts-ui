import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { getProxyForUrl } from 'proxy-from-env'

/**
 * Determines if proxy support should be enabled based on Node proxy configuration.
 *
 * Returns true when any of the following are set:
 * - NODE_USE_ENV_PROXY is '1' or 'true' (case-insensitive)
 * - NODE_OPTIONS contains '--use-env-proxy'
 * - process.execArgv includes '--use-env-proxy'
 */
export function isProxyEnabled(): boolean {
  const nodeUseEnvProxy = process.env.NODE_USE_ENV_PROXY?.toLowerCase()
  return (
    nodeUseEnvProxy === '1' ||
    nodeUseEnvProxy === 'true' ||
    process.env.NODE_OPTIONS?.includes('--use-env-proxy') ||
    process.execArgv.includes('--use-env-proxy')
  )
}

/**
 * Creates an SQS client request handler with proxy support if configured.
 *
 * `@aws-sdk/client-sqs`'s `SQSClient` does not read `HTTP_PROXY`/`HTTPS_PROXY` env vars on its
 * own, unlike `@ministryofjustice/hmpps-rest-client`'s outbound HTTP clients. When proxy support
 * is enabled and a proxy is configured via environment variables, this returns a `NodeHttpHandler`
 * configured with an `HttpsProxyAgent`. Otherwise it returns an empty object so `SQSClient` falls
 * back to its default handler.
 *
 * `targetUrl` (the SQS queue URL that will actually be called) is passed through `proxy-from-env`'s
 * `getProxyForUrl`, which correctly honours `NO_PROXY`/`no_proxy` (exact hostnames, suffix-matched
 * `.example.com`-style entries, and the `*` wildcard to disable proxying entirely) - a manual
 * HTTP_PROXY/HTTPS_PROXY env var read alone would ignore NO_PROXY and force traffic through the
 * proxy even for hosts it's meant to bypass (for example a local/test SQS endpoint).
 */
export function createProxyRequestHandler(targetUrl: string): { requestHandler?: NodeHttpHandler } {
  if (!isProxyEnabled()) {
    return {}
  }

  const proxyUrl = getProxyForUrl(targetUrl)
  if (!proxyUrl) {
    return {}
  }

  const agent = new HttpsProxyAgent(proxyUrl)
  return {
    requestHandler: new NodeHttpHandler({
      httpsAgent: agent,
    }),
  }
}
