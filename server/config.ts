const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

const auditConfig = () => {
  const auditEnabled = get('AUDIT_ENABLED', 'false') === 'true'
  return {
    enabled: auditEnabled,
    queueUrl: get('AUDIT_SQS_QUEUE_URL', 'http://localhost:4566/000000000000/mainQueue', {
      requireInProduction: auditEnabled,
    }),
    serviceName: get('AUDIT_SERVICE_NAME', 'UNASSIGNED', { requireInProduction: auditEnabled }),
    region: get('AUDIT_SQS_REGION', 'eu-west-2'),
  }
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    enabled: get('REDIS_ENABLED', 'false', requiredInProduction) === 'true',
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 720)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      healthPath: '/health/ping',
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      signInClientId: get('SIGN_IN_CLIENT_ID', 'clientid', requiredInProduction),
      signInClientSecret: get('SIGN_IN_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonerSearchApi: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000))),
      pageSize: 20,
      pagesLinksToShow: 3,
    },
    alertsApi: {
      url: get('ALERTS_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('ALERTS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('ALERTS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('ALERTS_API_TIMEOUT_RESPONSE', 10000))),
      pageSize: 20,
      pagesLinksToShow: 3,
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('PRISON_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISON_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISON_API_TIMEOUT_RESPONSE', 10000))),
    },
    contactsApi: {
      url: get('CONTACTS_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('CONTACTS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('CONTACTS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('CONTACTS_API_TIMEOUT_RESPONSE', 10000))),
      pageSize: 10,
      referenceDataCacheTTL: Number(get('CONTACTS_API_REFERENCE_DATA_CACHE_TTL', 5 * 60)),
    },
    organisationsApi: {
      url: get('ORGANISATIONS_API_URL', 'http://localhost:8080', requiredInProduction),
      healthPath: '/health/ping',
      timeout: {
        response: Number(get('ORGANISATIONS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('ORGANISATIONS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('ORGANISATIONS_API_TIMEOUT_RESPONSE', 10000))),
      pageSize: 10,
    },
    componentApi: {
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_DEADLINE', 5000)),
      },
    },
  },
  serviceUrls: {
    digitalPrison: get('DPS_HOME_PAGE_URL', 'http://localhost:3001', requiredInProduction),
    prisonerProfileUrl: get('PRISONER_PROFILE_PAGE_URL', 'http://localhost:3001', requiredInProduction),
  },
  sqs: {
    audit: auditConfig(),
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  environmentName: get('ENVIRONMENT_NAME', ''),
  featureEnabledPrisons: get('FEATURE_ENABLED_PRISONS', ''),
  sentry: {
    dsn: process.env['SENTRY_DSN'],
    loaderScriptId: process.env['SENTRY_LOADER_SCRIPT_ID'],
    environment: get('SENTRY_ENVIRONMENT', 'local', requiredInProduction),
    tracesSampleRate: Number(get('SENTRY_TRACES_SAMPLE_RATE', 0.05)),
    replaySampleRate: Number(get('SENTRY_REPLAY_SAMPLE_RATE', 0.0)),
    replayOnErrorSampleRate: Number(get('SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE', 0.1)),
  },
}
