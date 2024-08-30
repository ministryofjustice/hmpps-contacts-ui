import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import TestData from '../routes/testutils/testData'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient

  const prisonId = 'HEI'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearchApi.url)
    prisonerSearchApiClient = new PrisonerSearchApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisoners', () => {
    it('should return data from api', async () => {
      const results = {
        totalPage: 1,
        totalElements: 1,
        content: [
          {
            lastName: 'test',
            firstName: 'test',
            prisonerNumber: 'test',
            dateOfBirth: '2000-01-01',
          },
        ],
      }
      fakePrisonerSearchApi
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
          page: '0',
          size: config.apis.prisonerSearchApi.pageSize,
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, results)

      const output = await prisonerSearchApiClient.getPrisoners('test', prisonId, user, 0)

      expect(output).toEqual(results)
    })
  })

  describe('getPrisoner', () => {
    it('should return data from api', async () => {
      const results = {
        totalPage: 1,
        totalElements: 1,
        content: [
          {
            lastName: 'test',
            firstName: 'test',
            prisonerNumber: 'test',
            dateOfBirth: '2000-01-01',
          },
        ],
      }
      fakePrisonerSearchApi
        .get('/prison/HEI/prisoners')
        .query({
          term: 'test',
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, results)

      const output = await prisonerSearchApiClient.getPrisoner('test', prisonId, user)

      expect(output).toEqual(results)
    })
  })

  describe('getPrisonerById', () => {
    it('should return data for single prisoner by prisoner ID', async () => {
      const prisoner = TestData.prisoner()

      fakePrisonerSearchApi
        .get('/prisoner/A1234BC')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, prisoner)

      const output = await prisonerSearchApiClient.getPrisonerById('A1234BC', user)

      expect(output).toEqual(prisoner)
    })
  })
})
