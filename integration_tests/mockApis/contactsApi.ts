import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  STUBBED_LANGUAGE_OPTIONS,
  STUBBED_PHONE_TYPE_OPTIONS,
  STUBBED_RELATIONSHIP_OPTIONS,
  STUBBED_TITLE_OPTIONS,
} from '../../server/routes/testutils/stubReferenceData'
import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'

export type StubGetContactResponse = components['schemas']['GetContactResponse']
export type StubPhoneDetails = components['schemas']['ContactPhoneDetails']
export type StubContactSearchResultItem = components['schemas']['ContactSearchResultItem']
export type PatchContactRequest = components['schemas']['PatchContactRequest']

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
        jsonBody: TestData.prisonerContactSummaryPage(),
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
  stubPhoneTypeReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/PHONE_TYPE',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_PHONE_TYPE_OPTIONS,
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

  stubGetLanguages: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/language-reference`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_LANGUAGE_OPTIONS,
      },
    })
  },

  stubUpdateSpokenLanguage: ({
    contactId,
    request,
  }: {
    contactId: number
    request: PatchContactRequest
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: request,
      },
    })
  },

  stubCreateContactPhone: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubPhoneDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/phone`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },
}
