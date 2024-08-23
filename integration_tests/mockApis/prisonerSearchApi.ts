import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubPrisoners: ({
    results = {
      totalPages: 0,
      totalElements: 0,
      content: [TestData.prisoner()],
    },
    prisonId = 'HEI',
    term,
    page = '0',
    size = '20',
  }: {
    results: { totalPages: number; totalElements: number; content: Partial<Prisoner>[] }
    prisonId: string
    term: string
    page: string
    size: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prison/${prisonId}/prisoners`,
        queryParameters: {
           term: {
             equalTo: `${term}`
           },
           page: {
             equalTo: `${page}`
           },
           size: {
             equalTo: `${size}`
           }
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
