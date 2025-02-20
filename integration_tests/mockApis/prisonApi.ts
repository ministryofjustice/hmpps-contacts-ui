import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { components } from '../../server/@types/prison-api'

export type StubPrisonApiAddress = components['schemas']['AddressDto']
export default {
  stubPrisonApiHealth: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    }),
  stubOffenderAddresses: (args: { prisonerNumber: string; addresses: StubPrisonApiAddress[] }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/api/offenders/${args.prisonerNumber}/addresses`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: args.addresses,
      },
    })
  },
}
