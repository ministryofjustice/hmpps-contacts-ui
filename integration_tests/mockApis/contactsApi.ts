import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { STUBBED_RELATIONSHIP_OPTIONS, STUBBED_TITLE_OPTIONS } from '../../server/routes/testutils/stubReferenceData'
import { components } from '../../server/@types/contactsApi'

export type StubGetContactResponse = components['schemas']['GetContactResponse']
export type StubContactSearchResultItem = components['schemas']['ContactSearchResultItem']

export default {
  stubCreateContact: (createdContact: StubGetContactResponse): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/contact',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: createdContact,
      },
    })
  },

  stubAddContactRelationship: (contactId: number): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/relationship`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
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
        jsonBody: {
          content: [
            {
              prisonerContactId: 100,
              contactId: 200,
              prisonerNumber: 'G9381UV',
              lastName: 'Adams',
              firstName: 'Claire',
              middleNames: 'Elizabeth',
              dateOfBirth: new Date('1973-01-10'),
              relationshipCode: 'code here',
              relationshipDescription: 'Friend',
              flat: 'Flat 1',
              property: '',
              street: '123 High Street',
              area: 'Mayfair',
              cityCode: '',
              cityDescription: '',
              countyCode: 'LON',
              countyDescription: 'Greater London',
              postCode: 'W1 1AA',
              countryCode: 'ENG',
              countryDescription: 'England',
              approvedVisitor: true,
              nextOfKin: true,
              emergencyContact: true,
              awareOfCharges: true,
              comments: 'comments here',
            },
          ],
        },
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
        jsonBody: { content: [] },
      },
    })
  },

  stubGetContactById: (contact: { id: number }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/contact/${contact.id}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: contact,
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
  stubRelationshipReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/RELATIONSHIP',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_RELATIONSHIP_OPTIONS,
      },
    })
  },

  stubContactSearch: ({
    results = {
      totalPages: 0,
      totalElements: 0,
      content: [],
    },
    lastName,
    middleNames,
    firstName,
    dateOfBirth,
    page = '0',
    size = '10',
  }: {
    results: { totalPages: number; totalElements: number; content: StubContactSearchResultItem[] }
    lastName: string
    middleNames: string
    firstName: string
    dateOfBirth: string
    page: string
    size: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/contact/search`,
        queryParameters: {
          lastName: {
            equalTo: lastName,
          },
          firstName: {
            equalTo: firstName,
          },
          middleNames: {
            or: [
              {
                equalTo: middleNames,
              },
              {
                absent: true,
              },
            ],
          },
          dateOfBirth: {
            equalTo: dateOfBirth,
          },
          page: {
            equalTo: page,
          },
          size: {
            equalTo: size,
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
}
