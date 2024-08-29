import createError, { BadRequest } from 'http-errors'
import PrisonerSearchService from './prisonerSearchService'
import TestData from '../routes/testutils/testData'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

jest.mock('../data/prisonerSearchApiClient')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prisoner search service', () => {
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  let prisonerSearchService: PrisonerSearchService

  // Test data
  const prisonId = 'HEI'
  const prisonName = 'Hewell (HMP)'
  const search = 'some search'
  const prisoner = TestData.prisoner()

  beforeEach(() => {
    prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
    prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisoner', () => {
    it('should return null if no matching prisoner', async () => {
      prisonerSearchApiClient.getPrisoner.mockResolvedValue({ content: [] })
      const result = await prisonerSearchService.getPrisoner('test', prisonId, user)
      expect(result).toBe(null)
    })

    it('should return matching prisoner', async () => {
      prisonerSearchApiClient.getPrisoner.mockResolvedValue({ content: [prisoner] })
      const result = await prisonerSearchService.getPrisoner('A1234BC', prisonId, user)
      expect(result).toBe(prisoner)
    })
  })

  describe('getPrisonerById', () => {
    it('should return prisoner details for given prisoner ID', async () => {
      prisonerSearchApiClient.getPrisonerById.mockResolvedValue(prisoner)
      const result = await prisonerSearchService.getPrisonerById('A1234BC', user)
      expect(result).toBe(prisoner)
    })
  })

  describe('getPrisonerNotFoundMessages', () => {
    it('should handle prisoner not found in any establishment', async () => {
      prisonerSearchApiClient.getPrisonerById.mockRejectedValue(createError.NotFound())
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, user)
      expect(message).toBe(
        'There are no results for this prison number at any establishment. Check the number is correct and try again.',
      )
    })

    it('should handle bad requests', async () => {
      prisonerSearchApiClient.getPrisonerById.mockRejectedValue(createError.BadRequest())
      await expect(
        prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, user),
      ).rejects.toBeInstanceOf(BadRequest)
    })

    it('should handle a prisoner being found in another establishment', async () => {
      prisonerSearchApiClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'IN' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, user)
      expect(message).toBe(
        'This prisoner is located at another establishment. The visitor should contact the prisoner to find out their location.',
      )
    })

    it('should handle a prisoner who has been released', async () => {
      prisonerSearchApiClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'OUT' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, user)
      expect(message).toBe(
        `This prisoner is not in ${prisonName}. They might be being moved to another establishment or have been released.`,
      )
    })

    it('should handle a prisoner who is being transferred', async () => {
      prisonerSearchApiClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'TRN' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, user)
      expect(message).toBe(
        `This prisoner is not in ${prisonName}. They might be being moved to another establishment or have been released.`,
      )
    })
  })

  describe('getPrisoners', () => {
    it('Retrieves and formats the prisoner name correctly', async () => {
      const prisoners = { totalPages: 1, totalElements: 1, content: [prisoner] }
      prisonerSearchApiClient.getPrisoners.mockResolvedValue(prisoners)

      const { results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisoners(search, prisonId,0, user)

      expect(results).toEqual([
        [
          { html: `<a href="#" class="govuk-link--no-visited-state bapv-result-row">Smith, John</a>` },
          { html: 'A1234BC' },
          { html: '2 April 1975' },
        ],
      ])
      expect(numberOfResults).toEqual(1)
      expect(numberOfPages).toEqual(1)
      expect(next).toEqual(1)
      expect(previous).toEqual(1)
    })

    it('Propagates errors', async () => {
      prisonerSearchApiClient.getPrisoners.mockRejectedValue(new Error('some error'))
      await expect(prisonerSearchService.getPrisoners(search, prisonId, 0, user))
        .rejects.toEqual(new Error('some error') )
    })
  })
})
