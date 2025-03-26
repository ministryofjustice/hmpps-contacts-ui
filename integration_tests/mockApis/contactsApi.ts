import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  STUBBED_ADDRESS_TYPE_OPTIONS,
  STUBBED_CITY_OPTIONS,
  STUBBED_COUNTRY_OPTIONS,
  STUBBED_COUNTY_OPTIONS,
  STUBBED_DOMESTIC_STATUS_OPTIONS,
  STUBBED_GENDER_OPTIONS,
  STUBBED_IDENTITY_OPTIONS,
  STUBBED_LANGUAGE_OPTIONS,
  STUBBED_OFFICIAL_RELATIONSHIP_OPTIONS,
  STUBBED_PHONE_TYPE_OPTIONS,
  STUBBED_RELATIONSHIP_TYPE_OPTIONS,
  STUBBED_RESTRICTION_OPTIONS,
  STUBBED_SOCIAL_RELATIONSHIP_OPTIONS,
  STUBBED_TITLE_OPTIONS,
} from '../../server/routes/testutils/stubReferenceData'
import { components } from '../../server/@types/contactsApi'
import TestData from '../../server/routes/testutils/testData'

export type StubContactCreationResult = components['schemas']['ContactCreationResult']
export type StubPhoneDetails = components['schemas']['ContactPhoneDetails']
export type StubAddressPhoneDetails = components['schemas']['ContactAddressPhoneDetails']
export type StubContactRestrictionDetails = components['schemas']['ContactRestrictionDetails']
export type StubPrisonerContactRestrictionDetails = components['schemas']['PrisonerContactRestrictionDetails']
export type StubIdentityDetails = components['schemas']['ContactIdentityDetails']
export type StubContactSearchResultItem = components['schemas']['ContactSearchResultItem']
export type StubPatchContactResponse = components['schemas']['PatchContactResponse']
export type StubPrisonerContactRelationshipDetails = components['schemas']['PrisonerContactRelationshipDetails']
export type StubPrisonerContactRestrictionsResponse = components['schemas']['PrisonerContactRestrictionsResponse']
export type StubContactEmailDetails = components['schemas']['ContactEmailDetails']
export type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
export type ContactRestrictionDetails = components['schemas']['ContactRestrictionDetails']
export type StubContactAddressDetails = components['schemas']['ContactAddressDetails']
type StubLinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']

export default {
  stubCreateContact: (result: StubContactCreationResult): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/contact',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: result,
      },
    })
  },

  stubAddContactRelationship: (params: { contactId: number; createdPrisonerContactId: number }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerContactId: params.createdPrisonerContactId,
          contactId: params.contactId,
        },
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

  stubGetContactNameById: (contact: {
    id: number
    titleCode?: string | undefined
    titleDescription?: string | undefined
    lastName?: string | undefined
    firstName?: string | undefined
    middleNames?: string | undefined
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/contact/${contact.id}/name`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          titleCode: contact.titleCode,
          titleDescription: contact.titleDescription,
          lastName: contact.lastName,
          firstName: contact.firstName,
          middleNames: contact.middleNames,
        },
      },
    })
  },

  stubGetGlobalRestrictions: (globalRestrictions: ContactRestrictionDetails[]): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/contact/${globalRestrictions[0].contactId}/restriction`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: globalRestrictions,
      },
    })
  },

  stubGetPrisonerContactRestrictions: (params: {
    prisonerContactId: number
    response: StubPrisonerContactRestrictionsResponse
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-contact/${params.prisonerContactId}/restriction`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: params.response,
      },
    })
  },

  stubGetPrisonerContactRelationshipById: (params: {
    id: number
    response: StubPrisonerContactRelationshipDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-contact/${params.id}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: params.response,
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
        urlPath: '/reference-codes/group/SOCIAL_RELATIONSHIP',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_SOCIAL_RELATIONSHIP_OPTIONS,
      },
    })
  },
  stubOfficialRelationshipReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/OFFICIAL_RELATIONSHIP',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_OFFICIAL_RELATIONSHIP_OPTIONS,
      },
    })
  },
  stubRelationshipTypeReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/RELATIONSHIP_TYPE',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_RELATIONSHIP_TYPE_OPTIONS,
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
  stubAddressTypeReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/ADDRESS_TYPE',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_ADDRESS_TYPE_OPTIONS,
      },
    })
  },
  stubCityReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/CITY',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_CITY_OPTIONS,
      },
    })
  },
  stubCountyReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/COUNTY',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_COUNTY_OPTIONS,
      },
    })
  },
  stubCountryReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/COUNTRY',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_COUNTRY_OPTIONS,
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

  stubLanguagesReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/LANGUAGE',
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

  stubUpdateContactRelationshipById: ({ prisonerContactId }: { prisonerContactId: number }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
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

  stubGetGenders: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/GENDER',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_GENDER_OPTIONS,
      },
    })
  },
  stubRestrictionTypeReferenceData: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/reference-codes/group/RESTRICTION',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: STUBBED_RESTRICTION_OPTIONS,
      },
    })
  },
  stubCreateContactPhones: ({ contactId }: { contactId: number }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/phones`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },
  stubCreateAddressPhones: ({
    contactId,
    contactAddressId,
  }: {
    contactId: number
    contactAddressId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phones`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },
  stubCreateContactIdentities: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubIdentityDetails[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/identities`,
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
  stubUpdateAddressPhone: ({
    contactId,
    contactAddressId,
    contactAddressPhoneId,
    updated,
  }: {
    contactId: number
    contactAddressId: number
    contactAddressPhoneId: number
    updated: StubAddressPhoneDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
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
  stubDeleteAddressPhone: ({
    contactId,
    contactAddressId,
    contactAddressPhoneId,
  }: {
    contactId: number
    contactAddressId: number
    contactAddressPhoneId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
      },
      response: {
        status: 204,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubCreateContactEmails: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubContactEmailDetails[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/emails`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },

  stubUpdateContactEmail: ({
    contactId,
    contactEmailId,
    updated,
  }: {
    contactId: number
    contactEmailId: number
    updated: UpdateEmailRequest
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/contact/${contactId}/email/${contactEmailId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },

  stubDeleteContactEmail: ({
    contactId,
    contactEmailId,
  }: {
    contactId: number
    contactEmailId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/email/${contactEmailId}`,
      },
      response: {
        status: 204,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubCreateContactRestriction: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubContactRestrictionDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/restriction`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },
  stubUpdateContactRestriction: ({
    contactId,
    updated,
    restrictionId,
  }: {
    contactId: number
    restrictionId: number
    updated: StubContactRestrictionDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/contact/${contactId}/restriction/${restrictionId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },
  stubCreatePrisonerContactRestriction: ({
    prisonerContactId,
    created,
  }: {
    prisonerContactId: number
    created: StubPrisonerContactRestrictionDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },
  stubUpdatePrisonerContactRestriction: ({
    prisonerContactId,
    updated,
    restrictionId,
  }: {
    prisonerContactId: number
    restrictionId: number
    updated: StubPrisonerContactRestrictionDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: `/prisoner-contact/${prisonerContactId}/restriction/${restrictionId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },
  stubCreateContactAddress: ({
    contactId,
    created,
  }: {
    contactId: number
    created: StubContactAddressDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: `/contact/${contactId}/address`,
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: created,
      },
    })
  },
  stubUpdateContactAddress: ({
    contactId,
    contactAddressId,
    updated,
  }: {
    contactId: number
    contactAddressId: number
    updated: StubContactAddressDetails
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: updated,
      },
    })
  },

  stubGetLinkedPrisoners: (args: {
    contactId: number
    linkedPrisoners: StubLinkedPrisonerDetails[]
    pageNumber?: number
    totalElements?: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/contact/${args.contactId}/linked-prisoners`,
        queryParameters: {
          page: {
            equalTo: `${args.pageNumber ?? 0}`,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          content: args.linkedPrisoners,
          totalElements: args.totalElements ?? args.linkedPrisoners.length,
        },
      },
    })
  },

  stubPatchEmployments: () =>
    stubFor({
      request: {
        method: 'PATCH',
        urlPattern: '/contact/[0-9]+/employment',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    }),
}
