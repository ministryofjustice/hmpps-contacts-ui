import EmploymentDetails = journeys.EmploymentDetails
import OrganisationAddressDetails = organisationsApiClientTypes.OrganisationAddressDetails

export const employmentSorter = (a: EmploymentDetails, b: EmploymentDetails) =>
  Number(b.isActive) - Number(a.isActive) ||
  a.employer.organisationName.localeCompare(b.employer.organisationName) ||
  (b.employmentId ?? 0) - (a.employmentId ?? 0)

export const organisationAddressSorter = (a: OrganisationAddressDetails, b: OrganisationAddressDetails) =>
  Number(b.primaryAddress) - Number(a.primaryAddress) || Number(b.mailAddress) - Number(a.mailAddress)
