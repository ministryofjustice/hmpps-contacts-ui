import ContactsApiClient from '../data/contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import TokenStore from '../data/tokenStore/tokenStore'
import config from '../config'
import RedisTokenStore from '../data/tokenStore/redisTokenStore'
import { createRedisClient } from '../data/redisClient'
import InMemoryTokenStore from '../data/tokenStore/inMemoryTokenStore'
import logger from '../../logger'

export default class ReferenceDataService {
  private referenceDataCache: TokenStore

  constructor(private readonly contactsApiClient: ContactsApiClient) {
    this.referenceDataCache = config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore()
  }

  async getReferenceData(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    const cached = await this.referenceDataCache.getToken(`Ref-data:${type}`)

    let refData
    if (cached) {
      try {
        refData = JSON.parse(cached)
      } catch (e) {
        logger.error(`Invalid reference data data for type: ${type} for error: ${e}`)
      }
      if (refData) return refData
    }

    refData = await this.contactsApiClient.getReferenceCodes(type, user)
    await this.referenceDataCache.setToken(
      `Ref-data:${type}`,
      JSON.stringify(refData),
      config.apis.contactsApi.cacheTTL,
    )
    return refData
  }

  async getReferenceDescriptionForCode(type: ReferenceCodeType, code: string, user: Express.User): Promise<string> {
    return this.contactsApiClient
      .getReferenceCodes(type, user)
      .then(values => values.find(val => val.code === code)?.description ?? '')
  }
}
