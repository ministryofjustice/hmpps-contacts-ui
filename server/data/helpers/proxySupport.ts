import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'https-proxy-agent'

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
 * Reads proxy configuration from environment variables (case-insensitive).
 */
export function getProxyUrl(): string | undefined {
  return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
}

/**
 * Creates an SQS client request handler with proxy support if configured.
 *
 * `@aws-sdk/client-sqs`'s `SQSClient` does not read `HTTP_PROXY`/`HTTPS_PROXY` env vars on its
 * own, unlike `@ministryofjustice/hmpps-rest-client`'s outbound HTTP clients. When proxy support
 * is enabled and a proxy is configured via environment variables, this returns a `NodeHttpHandler`
 * configured with an `HttpsProxyAgent`. Otherwise it returns an empty object so `SQSClient` falls
 * back to its default handler.
 */
export function createProxyRequestHandler(): { requestHandler?: NodeHttpHandler } {
  if (!isProxyEnabled()) {
    return {}
  }

  const proxyUrl = getProxyUrl()
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
