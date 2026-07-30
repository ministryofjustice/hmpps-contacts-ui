import { Readable } from 'stream'
import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonApiClient from './prisonApiClient'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prison api client tests', () => {
  let prisonApiClient: PrisonApiClient
  const stream = jest.spyOn(RestClient.prototype, 'stream')

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient(new AuthenticationClient(config.apis.hmppsAuth, console))
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Get prisoner image', async () => {
    stream.mockResolvedValue(Readable.from('image'))
    const result = await prisonApiClient.getImage('ABC1234', user)
    expect(stream).toHaveBeenCalledWith(
      { path: '/api/bookings/offenderNo/ABC1234/image/data' },
      { tokenType: 'SYSTEM_TOKEN', user: { username: 'user1' } },
    )
    expect(result.read()).toEqual('image')
  })

  it('Falls back to a placeholder image when the prisoner has no image', async () => {
    stream.mockRejectedValue({ responseStatus: 404 })
    const result = await prisonApiClient.getImage('ABC1234', user)
    expect(result).toBeDefined()
  })
})
