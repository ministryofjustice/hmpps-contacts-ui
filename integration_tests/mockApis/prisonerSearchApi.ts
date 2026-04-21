import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import { PagedModelPrisonerRestrictionDetails } from '../../server/@types/contactsApiClient'
import { PageAlert } from '../../server/data/alertsApiTypes'

const getFirstPagedItem = <T>(items: T[] | undefined, message: string): T => {
  const firstItem = items?.[0]

  if (!firstItem) {
    throw new Error(message)
  }

  return firstItem
}

export default {
  stubPrisoners: ({
    results = {
      totalPages: 0,
      totalElements: 0,
      content: [],
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
            equalTo: `${term}`,
          },
          page: {
            equalTo: `${page}`,
          },
          size: {
            equalTo: `${size}`,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },

  stubPrisonerById: (prisoner: Prisoner): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner/${prisoner.prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisoner,
      },
    })
  },
  stubPrisonerRestrictionsById: (restrictionDetails: PagedModelPrisonerRestrictionDetails): SuperAgentRequest => {
    const { content: restrictionContent = [] } = restrictionDetails
    const firstRestriction = getFirstPagedItem(
      restrictionContent,
      'Expected prisoner restriction details to include at least one record',
    )

    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-restrictions/${firstRestriction.prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: restrictionDetails,
      },
    })
  },
  stubPrisonerAlertsById: (pageAlert: PageAlert): SuperAgentRequest => {
    const { content: alertContent = [] } = pageAlert
    const firstAlert = getFirstPagedItem(alertContent, 'Expected prisoner alerts to include at least one record')

    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoners/${firstAlert.prisonNumber}/alerts`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: pageAlert,
      },
    })
  },
  stubPrisonerByIdReturnsError: ({
    prisonerNumber = 'A1234BC',
    httpStatusCode = 404,
  }: {
    prisonerNumber: string
    httpStatusCode: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner/${prisonerNumber}`,
      },
      response: {
        status: httpStatusCode,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
}
