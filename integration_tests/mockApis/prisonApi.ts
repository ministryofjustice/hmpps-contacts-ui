import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { PrisonApiAddress } from '../../server/data/prisonApiTypes'

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
  stubOffenderAddresses: (args: { prisonerNumber: string; addresses: PrisonApiAddress[] }): SuperAgentRequest => {
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
