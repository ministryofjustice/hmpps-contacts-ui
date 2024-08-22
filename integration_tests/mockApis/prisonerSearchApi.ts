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
    size = '10',
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
        url: `/prison/${prisonId}/prisoners?term=${term}&page=${page}&size=${size}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
