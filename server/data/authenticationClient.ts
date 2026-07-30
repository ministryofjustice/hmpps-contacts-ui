import superagent from 'superagent'

import { URLSearchParams } from 'url'
import logger from '../../logger'
import config from '../config'
import generateOauthClientToken from '../authentication/clientCredentials'
import TokenStore from './tokenStore/tokenStore'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import { createRedisClient } from './redisClient'

function getSystemClientTokenFromHmppsAuth(username: string): Promise<superagent.Response> {
  const timeoutSpec = config.apis.hmppsAuth.timeout
  const hmppsAuthUrl = config.apis.hmppsAuth.url

  const clientToken = generateOauthClientToken(
    config.apis.hmppsAuth.systemClientId,
    config.apis.hmppsAuth.systemClientSecret,
  )

  const grantRequest = new URLSearchParams({
    grant_type: 'client_credentials',
    username,
  }).toString()

  logger.info(`${grantRequest} HMPPS Auth request for client id '${config.apis.hmppsAuth.systemClientId}''`)

  return superagent
    .post(`${hmppsAuthUrl}/oauth/token`)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(grantRequest)
    .timeout(timeoutSpec)
}

/**
 * Legacy system-token acquisition, kept as-is from the previous bespoke `RestClient`
 * (proxy-aware Phase 1). Satisfies the minimal `AuthenticationClient` shape required by
 * `@ministryofjustice/hmpps-rest-client`'s `RestClient`, so domain API clients can move onto the
 * proxy-aware transport without a behavioural change to token acquisition yet.
 *
 * This will be replaced by `@ministryofjustice/hmpps-auth-clients`'s `AuthenticationClient` in
 * Phase 2 of the proxy-aware migration.
 */
export default class AuthenticationClient {
  tokenStore: TokenStore

  constructor() {
    this.tokenStore = config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore()
  }

  async getToken(username?: string): Promise<string> {
    if (!username) {
      throw new Error('Anonymous system tokens are not supported by this legacy authentication client')
    }

    const token = await this.tokenStore.getToken(username)
    if (token) {
      return token
    }

    const newToken = await getSystemClientTokenFromHmppsAuth(username)

    // set TTL slightly less than expiry of token. Async but no need to wait
    await this.tokenStore.setToken(username, newToken.body.access_token, newToken.body.expires_in - 60)

    return newToken.body.access_token
  }
}
