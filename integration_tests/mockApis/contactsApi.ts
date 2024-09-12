import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { STUBBED_TITLE_OPTIONS } from '../../server/routes/testutils/stubReferenceData'

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

  stubContactList: (prisonerNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner/${prisonerNumber}/contact`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            prisonerContactId: 100,
            contactId: 200,
            prisonerNumber: 'G9381UV',
            surname: 'Adams',
            forename: 'Claire',
            middleName: 'Elizabeth',
            dateOfBirth: new Date('1973-01-10'),
            relationshipCode: 'code here',
            relationshipDescription: 'Friend',
            flat: 'Flat 1',
            property: '',
            street: '123 High Street',
            area: 'Mayfair',
            cityCode: '',
            countyCode: 'Greater London',
            postCode: 'W1 1AA',
            countryCode: 'England',
            approvedVisitor: true,
            nextOfKin: true,
            emergencyContact: true,
            awareOfCharges: true,
            comments: 'comments here',
          },
        ],
      },
    })
  },

  stubEmptyContactList: (prisonerNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner/${prisonerNumber}/contact`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },

  stubTitlesReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/TITLE',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_TITLE_OPTIONS,
      },
    })
  },
}
