import { Readable } from 'stream'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import PrisonApiClient from './prisonApiClient'
import RestClient from './restClient'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prison api client tests', () => {
  let prisonApiClient: PrisonApiClient
  const stream = jest.spyOn(RestClient.prototype, 'stream')

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Get prisoner image', async () => {
    stream.mockResolvedValue(Readable.from('image'))
    const result = await prisonApiClient.getImage('ABC1234', user)
    expect(stream).toHaveBeenCalledWith({ path: '/api/bookings/offenderNo/ABC1234/image/data' }, user)
    expect(result.read()).toEqual('image')
  })
})
