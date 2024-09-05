import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerImageService from './prisonerImageService'

jest.mock('../data/prisonApiClient')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prisoner image service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerImageService: PrisonerImageService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    prisonerImageService = new PrisonerImageService(prisonApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getImage', () => {
    it('should get the prisoner image', async () => {
      prisonApiClient.getImage.mockResolvedValue(Readable.from('image'))
      await prisonerImageService.getImage('ABC123', user)
      expect(prisonApiClient.getImage).toHaveBeenCalledWith('ABC123', user)
    })
  })
})
