import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubCreateContact: (createdContact: {
    id: number
    title?: string | null
    lastName: string
    firstName: string
    middleName?: string | null
    dateOfBirth?: string | null
    createdBy: string
    createdTime: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/contact',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: createdContact,
      },
    })
  },
}
