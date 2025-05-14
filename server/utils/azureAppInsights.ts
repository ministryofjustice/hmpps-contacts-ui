import {
  defaultClient,
  DistributedTracingModes,
  getCorrelationContext,
  setup,
  TelemetryClient,
  Contracts,
} from 'applicationinsights'
import { Request, RequestHandler } from 'express'
import { EnvelopeTelemetry } from 'applicationinsights/out/Declarations/Contracts'
import type { ApplicationInfo } from '../applicationInfo'

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(
  { applicationName, buildNumber }: ApplicationInfo,
  overrideName?: string,
): TelemetryClient | null {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = overrideName || applicationName
    defaultClient.context.tags['ai.application.ver'] = buildNumber
    defaultClient.addTelemetryProcessor(addUserDataToRequests)
    defaultClient.addTelemetryProcessor(({ tags, data }, contextObjects) => {
      const operationNameOverride =
        contextObjects?.['correlationContext']?.customProperties?.getProperty('operationName')
      if (operationNameOverride) {
        tags['ai.operation.name'] = operationNameOverride // eslint-disable-line no-param-reassign
        if (data?.baseData) {
          data.baseData['name'] = operationNameOverride // eslint-disable-line no-param-reassign
        }
      }
      return true
    })

    return defaultClient
  }
  return null
}

export function appInsightsMiddleware(): RequestHandler {
  return (req, res, next) => {
    res.prependOnceListener('finish', () => {
      const context = getCorrelationContext()
      if (context && req.route) {
        context.customProperties.setProperty('operationName', `${req.method} ${req.route?.path}`)
      }
    })
    next()
  }
}

function addUserDataToRequests(envelope: EnvelopeTelemetry, contextObjects: Record<string, unknown> | undefined) {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString['Request']
  if (isRequest) {
    const { username, activeCaseLoad } =
      (contextObjects?.['http.ServerRequest'] as Request | undefined)?.res?.locals?.user || {}
    if (username) {
      const properties = envelope.data.baseData?.['properties']
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData ??= {}
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData['properties'] = {
        username,
        activeCaseLoadId: activeCaseLoad?.caseLoadId,
        ...properties,
      }
    }
  }
  return true
}
