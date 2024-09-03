import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import TestData from '../routes/testutils/testData'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prisoner search', () => {
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

  describe('searchInCaseload', () => {
    it('should return expected data', async () => {
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
          page: 0,
          size: 20,
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, results)

      const output = await prisonerSearchApiClient.searchInCaseload('test', prisonId, user, { page: 0, size: 20 })

      expect(output).toEqual(results)
    })
  })

  describe('getByPrisonerNumber', () => {
    it('should return a single prisoner by prisoner number', async () => {
      const prisoner = TestData.prisoner()

      fakePrisonerSearchApi
        .get('/prisoner/A1234BC')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, prisoner)

      const output = await prisonerSearchApiClient.getByPrisonerNumber('A1234BC', user)

      expect(output).toEqual(prisoner)
    })
  })
})
