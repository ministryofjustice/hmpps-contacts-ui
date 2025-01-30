import { components } from '../@types/contactsApi'

export const employmentSorter = (
  a: components['schemas']['EmploymentDetails'],
  b: components['schemas']['EmploymentDetails'],
) =>
  Number(b.isActive) - Number(a.isActive) ||
  a.employer.organisationName.localeCompare(b.employer.organisationName) ||
  b.employmentId - a.employmentId
