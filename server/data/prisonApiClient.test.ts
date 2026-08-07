import { Readable } from 'stream'
import * as fs from 'node:fs'
import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonApiClient from './prisonApiClient'

jest.mock('./tokenStore/inMemoryTokenStore')
jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs')
  return { ...actual, createReadStream: jest.fn(actual.createReadStream) }
})

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prison api client tests', () => {
  let prisonApiClient: PrisonApiClient
  const stream = jest.spyOn(RestClient.prototype, 'stream')

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient(new AuthenticationClient(config.apis.hmppsAuth, console))
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    ;(fs.createReadStream as jest.Mock).mockImplementation(jest.requireActual('node:fs').createReadStream)
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

  it('Rejects when the prisoner has no image and the placeholder image cannot be opened', async () => {
    stream.mockRejectedValue({ responseStatus: 404 })
    const brokenStream = new Readable({ read: () => {} })
    ;(fs.createReadStream as jest.Mock).mockReturnValue(brokenStream as unknown as fs.ReadStream)
    setImmediate(() => brokenStream.emit('error', new Error('ENOENT: no such file or directory')))

    await expect(prisonApiClient.getImage('ABC1234', user)).rejects.toThrow('ENOENT: no such file or directory')
  })

  it('Re-throws non-404 errors without falling back to a placeholder image', async () => {
    stream.mockRejectedValue({ responseStatus: 500 })
    await expect(prisonApiClient.getImage('ABC1234', user)).rejects.toEqual({ responseStatus: 500 })
  })
})
