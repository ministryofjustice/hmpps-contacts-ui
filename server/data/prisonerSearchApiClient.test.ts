import nock from 'nock'
import config from '../config'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import TestData from '../routes/testutils/testData'

describe('prisonSearchClientBuilder', () => {
  let fakePrisonerSearchApi: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient

  const prisonId = 'HEI'
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearchApi.url)
    prisonerSearchApiClient = new PrisonerSearchApiClient(token)
  })

  afterEach(() => {
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
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonerSearchApiClient.getPrisoners('test', prisonId)

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
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonerSearchApiClient.getPrisoner('test', prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getPrisonerById', () => {
    it('should return data for single prisoner by prisoner ID', async () => {
      const prisoner = TestData.prisoner()

      fakePrisonerSearchApi
        .get('/prisoner/A1234BC')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisoner)

      const output = await prisonerSearchApiClient.getPrisonerById('A1234BC')

      expect(output).toEqual(prisoner)
    })
  })
})
