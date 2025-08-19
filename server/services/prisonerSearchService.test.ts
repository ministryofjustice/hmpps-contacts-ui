import { BadRequest, NotFound } from 'http-errors'
import PrisonerSearchService from './prisonerSearchService'
import TestData from '../routes/testutils/testData'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

jest.mock('../data/prisonerSearchApiClient')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prisoner search service', () => {
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  let prisonerSearchService: PrisonerSearchService

  const prisonId = 'HEI'
  const prisoner = TestData.prisoner()

  beforeEach(() => {
    prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
    prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getByPrisonerNumber', () => {
    it('should return prisoner details', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockResolvedValue(prisoner)
      const result = await prisonerSearchService.getByPrisonerNumber('A1234BC', user)
      expect(result).toBe(prisoner)
    })

    it('should handle prisoner not found', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockRejectedValue(NotFound())
      await expect(prisonerSearchService.getByPrisonerNumber(prisoner.prisonerNumber, user)).rejects.toEqual(NotFound())
    })

    it('should handle a bad request', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockRejectedValue(BadRequest())
      await expect(prisonerSearchService.getByPrisonerNumber(prisoner.prisonerNumber, user)).rejects.toEqual(
        BadRequest(),
      )
    })

    it('should handle a prisoner being found in another establishment', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockResolvedValue({ ...prisoner, inOutStatus: 'IN', prisonId: 'MDI' })
      const result = await prisonerSearchService.getByPrisonerNumber(prisoner.prisonerNumber, user)
      expect(result.prisonerNumber).toBe(prisoner.prisonerNumber)
      expect(result.prisonId).not.toEqual(prisonId)
      expect(result.inOutStatus).toEqual('IN')
    })

    it('should handle a prisoner who has been released', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockResolvedValue({ ...prisoner, inOutStatus: 'OUT' })
      const result = await prisonerSearchService.getByPrisonerNumber(prisoner.prisonerNumber, user)
      expect(result.inOutStatus).toEqual('OUT')
    })

    it('should handle a prisoner who is being transferred', async () => {
      prisonerSearchApiClient.getByPrisonerNumber.mockResolvedValue({ ...prisoner, inOutStatus: 'TRN' })
      const result = await prisonerSearchService.getByPrisonerNumber(prisoner.prisonerNumber, user)
      expect(result.inOutStatus).toEqual('TRN')
    })
  })
})
