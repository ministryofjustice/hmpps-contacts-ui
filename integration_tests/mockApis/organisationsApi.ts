import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import { components } from '../../server/@types/organisationsApi'

type OrganisationDetails = components['schemas']['OrganisationDetails']

export default {
  stubOrganisationSearch: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/organisations-api/organisation/search.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          content: [
            TestData.organisation({
              organisationName: 'Corp A',
              organisationId: 201,
              street: 'Some Street',
              businessPhoneNumber: '1234 1234',
              businessPhoneNumberExtension: '222',
            }),
            TestData.organisation({
              organisationName: 'Corp B',
              organisationId: 202,
            }),
          ],
          totalElements: 11,
        },
      },
    }),

  stubGetOrganisation: (organisationDetails: OrganisationDetails) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/organisations-api/organisation/${organisationDetails.organisationId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: organisationDetails,
      },
    }),
}
