import type { PagedModelPrisonerRestrictionDetails } from '../@types/contactsApiClient'

export default function pagedPrisonerRestrictionDetails(overrides = {}): PagedModelPrisonerRestrictionDetails {
  return {
    content: [
      {
        prisonerRestrictionId: 175317,
        prisonerNumber: 'G4793VF',
        restrictionType: 'BAN',
        restrictionTypeDescription: 'BAN',
        effectiveDate: '2024-10-02',
        authorisedUsername: 'PBalasuriya',
        authorisedByDisplayName: 'Prabash Balasuriya',
        commentText: 'Test comment',
        expiryDate: '2024-10-31',
        currentTerm: true,
        createdBy: 'JDIMBLEBY_GEN',
        createdTime: '2024-10-02T11:58:01.285998',
        updatedBy: 'JDIMBLEBY_GEN',
        updatedTime: '2024-10-02T11:58:01.285998',
      },
    ],
    ...overrides,
  }
}
