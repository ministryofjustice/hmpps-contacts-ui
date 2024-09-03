import superagent, { Response, SuperAgentRequest } from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = body => superagent.post(`${url}/requests/find`).send(body)

const getLastAPICallMatching = async (matching: string | object): Promise<unknown> => {
  const wiremockApiResponse: Response = await superagent.post(`${url}/requests/find`).send(matching)
  const responses = (wiremockApiResponse.body || '[]').requests
  const last = responses[responses.length - 1]
  return JSON.parse(last.body)
}

const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])

const stubGet = (urlPattern, jsonBody?) =>
  stubFor({
    request: { method: 'GET', urlPattern },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody,
    },
  })

const stubPost = (urlPattern, jsonBody?) =>
  stubFor({
    request: { method: 'POST', urlPattern },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: jsonBody || undefined,
      body: !jsonBody ? 1 : undefined,
    },
  })

const stubPut = (urlPattern, jsonBody?) =>
  stubFor({
    request: { method: 'PUT', urlPattern },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: jsonBody || undefined,
      body: !jsonBody ? 1 : undefined,
    },
  })

const stubDelete = (urlPattern, jsonBody?) =>
  stubFor({
    request: { method: 'DELETE', urlPattern },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody,
    },
  })

export { stubFor, getMatchingRequests, resetStubs, stubGet, stubPost, stubPut, stubDelete, getLastAPICallMatching }
