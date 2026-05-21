import { Readable } from 'stream'

import nock from 'nock'

import { AgentConfig } from '../config'
import RestClient, { Client } from './restClient'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'

jest.mock('./tokenStore/inMemoryTokenStore')
jest.mock('node:fs', () => ({ createReadStream: jest.fn() }))

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

class TestRestClient extends RestClient {
  constructor() {
    super('api-name', {
      url: 'http://localhost:8080/api',
      timeout: {
        response: 1000,
        deadline: 1000,
      },
      agent: new AgentConfig(1000),
    })
  }
}

const restClient = new TestRestClient()

describe.each(['get', 'patch', 'post', 'put', 'delete'] as const)('Method: %s', method => {
  it('should return response body', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toStrictEqual({
      success: true,
    })
  })

  it('should return raw response body', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
        headers: { header1: 'headerValue1' },
        raw: true,
      },
      user,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toMatchObject({
      req: { method: method.toUpperCase() },
      status: 200,
      text: '{"success":true}',
    })
  })

  if (method === 'get' || method === 'delete') {
    it('should retry by default', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
  } else {
    it('should not retry by default', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })

    it('should retry if configured to do so', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
            retry: true,
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
  }

  it('can recover through retries', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
        headers: { header1: 'headerValue1' },
        retry: true,
      },
      user,
    )

    expect(result).toStrictEqual({ success: true })
    expect(nock.isDone()).toBe(true)
  })

  it("should use the user's token if configured to do so", async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer userToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
      Client.USER_TOKEN,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toStrictEqual({
      success: true,
    })
  })

  it('should fetch a new system client token and cache it if one is not already cached', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue(null)
    const setToken = jest.spyOn(InMemoryTokenStore.prototype, 'setToken')

    nock('http://localhost:9090').post('/auth/oauth/token').reply(200, { access_token: 'newToken', expires_in: 220 })

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer newToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
    )

    expect(nock.isDone()).toBe(true)
    expect(setToken).toHaveBeenCalledWith('jbloggs', 'newToken', 160)

    expect(result).toStrictEqual({
      success: true,
    })
  })
})

describe('prisonerThumbnail', () => {
  beforeEach(() => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  it('should return a readable stream containing the response body on a 200 response', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      .get('/api/thumbnail')
      .reply(200, Buffer.from('image data'), { 'Content-Type': 'image/jpeg' })

    const result = await restClient.prisonerThumbnail({ path: '/thumbnail' }, user)

    expect(nock.isDone()).toBe(true)
    expect(result).toBeInstanceOf(Readable)
  })

  it('should return a placeholder image stream on a 404 response', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      .get('/api/thumbnail')
      .reply(404)

    const placeholderData = Buffer.from('placeholder image data')
    const mockFileStream = new Readable({
      read() {
        /* empty */
      },
    })
    const { createReadStream } = jest.requireMock('node:fs') as { createReadStream: jest.Mock }
    createReadStream.mockImplementation(() => {
      process.nextTick(() => {
        mockFileStream.emit('data', placeholderData)
        mockFileStream.emit('close')
      })
      return mockFileStream
    })

    const result = await restClient.prisonerThumbnail({ path: '/thumbnail' }, user)

    expect(nock.isDone()).toBe(true)
    expect(result).toBeInstanceOf(Readable)
  })

  it('should reject with an error on a 500 response', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      .get('/api/thumbnail')
      .reply(500)
      .get('/api/thumbnail')
      .reply(500)
      .get('/api/thumbnail')
      .reply(500)

    await expect(restClient.prisonerThumbnail({ path: '/thumbnail' }, user)).rejects.toThrow()

    expect(nock.isDone()).toBe(true)
  })
})
