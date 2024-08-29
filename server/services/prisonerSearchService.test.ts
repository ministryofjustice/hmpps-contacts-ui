import createError, { BadRequest } from 'http-errors'
import PrisonerSearchService from './prisonerSearchService'
import TestData from '../routes/testutils/testData'
import HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

const token = 'some token'

export const createMockHmppsAuthClient = () => new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
export const createMockPrisonerSearchClient = () => new PrisonerSearchApiClient(null) as jest.Mocked<PrisonerSearchApiClient>

describe('Prisoner search service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const prisonerSearchClient = createMockPrisonerSearchClient()

  let prisonerSearchService: PrisonerSearchService

  const PrisonerSearchClientFactory = jest.fn()

  const prisonId = 'HEI'
  const prisonName = 'Hewell (HMP)'
  const search = 'some search'

  const prisoner = TestData.prisoner()

  beforeEach(() => {
    PrisonerSearchClientFactory.mockReturnValue(prisonerSearchClient)
    prisonerSearchService = new PrisonerSearchService(PrisonerSearchClientFactory, hmppsAuthClient)
    jest.spyOn(hmppsAuthClient, 'getSystemClientToken').mockImplementation(() => Promise.resolve(token))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisoners', () => {
    describe('prisoner search', () => {
      it('Retrieves and formats user name', async () => {
        const prisoners = {
          totalPages: 1,
          totalElements: 1,
          content: [prisoner],
        }
        jest.spyOn(prisonerSearchClient, 'getPrisoners').mockImplementation(() => Promise.resolve(prisoners))

        const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
          search,
          prisonId,
          'user',
          0,
        )

        expect(results).toEqual([
          [
            {
              html: `<a href="#" class="govuk-link--no-visited-state bapv-result-row">Smith, John</a>`,
            },
            {
              html: 'A1234BC',
            },
            {
              html: '2 April 1975',
            },
          ],
        ])
        expect(numberOfResults).toEqual(1)
        expect(numberOfPages).toEqual(1)
        expect(next).toEqual(1)
        expect(previous).toEqual(1)
      })
      it('Propagates error', async () => {
        prisonerSearchClient.getPrisoners.mockRejectedValue(new Error('some error'))

        await expect(prisonerSearchService.getPrisoners(search, prisonId, 'user', 0)).rejects.toEqual(
          new Error('some error'),
        )
      })
    })
  })

  describe('getPrisoner', () => {
    it('should return null if no matching prisoner', async () => {
      jest.spyOn(prisonerSearchClient, 'getPrisoner').mockImplementation(() => Promise.resolve({ content: [] }))
      const result = await prisonerSearchService.getPrisoner('test', prisonId, 'user')
      expect(result).toBe(null)
    })

    it('should return matching prisoner', async () => {
      prisonerSearchClient.getPrisoner.mockResolvedValue({ content: [prisoner] })
      const result = await prisonerSearchService.getPrisoner('A1234BC', prisonId, 'user')

      expect(result).toBe(prisoner)
    })
  })

  describe('getPrisonerById', () => {
    it('should return prisoner details for given prisoner ID', async () => {
      jest.spyOn(prisonerSearchClient, 'getPrisonerById').mockImplementation(() => Promise.resolve(prisoner))

      const result = await prisonerSearchService.getPrisonerById('A1234BC', 'user')

      expect(result).toBe(prisoner)
    })
  })

  describe('getPrisonerNotFoundMessage', () => {
    it('should handle prisoner not found in any establishment', async () => {
      jest
        .spyOn(prisonerSearchClient, 'getPrisonerById')
        .mockImplementation(() => Promise.reject(createError.NotFound()))

      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, 'user')

      expect(message).toBe(
        'There are no results for this prison number at any establishment. Check the number is correct and try again.',
      )
    })

    it('should propagate errors other than NotFound (404) ', async () => {
      prisonerSearchClient.getPrisonerById.mockRejectedValue(createError.BadRequest())
      await expect(
        prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, 'user'),
      ).rejects.toBeInstanceOf(BadRequest)
    })

    it('should handle a prisoner being found in another establishment', async () => {
      prisonerSearchClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'IN' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, 'user')

      expect(message).toBe(
        'This prisoner is located at another establishment. The visitor should contact the prisoner to find out their location.',
      )
    })

    it('should handle a prisoner who has been released', async () => {
      prisonerSearchClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'OUT' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, 'user')

      expect(message).toBe(
        `This prisoner is not in ${prisonName}. They might be being moved to another establishment or have been released.`,
      )
    })

    it('should handle a prisoner who is being transferred', async () => {
      prisonerSearchClient.getPrisonerById.mockResolvedValue({ ...prisoner, inOutStatus: 'TRN' })
      const message = await prisonerSearchService.getPrisonerNotFoundMessage('A1234BC', prisonName, 'user')

      expect(message).toBe(
        `This prisoner is not in ${prisonName}. They might be being moved to another establishment or have been released.`,
      )
    })
  })
})
