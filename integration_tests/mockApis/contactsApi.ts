import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  STUBBED_DOMESTIC_STATUS_OPTIONS,
  STUBBED_LANGUAGE_OPTIONS,
  STUBBED_PHONE_TYPE_OPTIONS,
  STUBBED_RELATIONSHIP_OPTIONS,
  STUBBED_IDENTITY_OPTIONS,
  STUBBED_TITLE_OPTIONS,
} from '../../server/routes/testutils/stubReferenceData'
import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'

export type StubContactDetails = components['schemas']['ContactDetails']
export type StubPhoneDetails = components['schemas']['ContactPhoneDetails']
export type StubIdentityDetails = components['schemas']['ContactIdentityDetails']
export type StubContactSearchResultItem = components['schemas']['ContactSearchResultItem']
export type StubPatchContactResponse = components['schemas']['PatchContactResponse']

export default {
  stubCreateContact: (createdContact: StubContactDetails): SuperAgentRequest => {
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
  stubIdentityTypeReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/ID_TYPE',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_IDENTITY_OPTIONS,
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

  stubPatchContactById: ({
    contactId,
    response,
  }: {
    contactId: number
    response: StubPatchContactResponse
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPath: `/contact/${contactId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: response,
      },
    })
  },

  stubGetDomesticStatuses: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/DOMESTIC_STS',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_DOMESTIC_STATUS_OPTIONS,
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
  stubCreateContactIdentity: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubIdentityDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/identity`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },
  stubUpdateContactIdentity: ({
    contactId,
    contactIdentityId,
    updated,
  }: {
    contactId: number
    contactIdentityId: number
    updated: StubIdentityDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/contact/${contactId}/identity/${contactIdentityId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },
  stubDeleteContactIdentity: ({
    contactId,
    contactIdentityId,
  }: {
    contactId: number
    contactIdentityId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/identity/${contactIdentityId}`,
      },
      response: {
        status: 204,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },

  stubUpdateContactPhone: ({
    contactId,
    contactPhoneId,
    updated,
  }: {
    contactId: number
    contactPhoneId: number
    updated: StubPhoneDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/contact/${contactId}/phone/${contactPhoneId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },
  stubDeleteContactPhone: ({
    contactId,
    contactPhoneId,
  }: {
    contactId: number
    contactPhoneId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/phone/${contactPhoneId}`,
      },
      response: {
        status: 204,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
}
