import EmploymentDetails = journeys.EmploymentDetails

export const employmentSorter = (a: EmploymentDetails, b: EmploymentDetails) =>
  Number(b.isActive) - Number(a.isActive) ||
  a.employer.organisationName.localeCompare(b.employer.organisationName) ||
  (b.employmentId ?? 0) - (a.employmentId ?? 0)
