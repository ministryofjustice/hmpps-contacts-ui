import { Request } from 'express'
import { NotFound } from 'http-errors'
import EmploymentDetails = journeys.EmploymentDetails
import { organisationAddressSorter } from '../../../../../utils/sorters'
import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails
import OrganisationAddressDetails = organisationsApiClientTypes.OrganisationAddressDetails

export type CreateContactEmploymentParam = {
  prisonerNumber: string
  journeyId: string
  employmentIdx: string
}

export const getEmploymentAndUrl = (req: Request<CreateContactEmploymentParam>) => {
  const { prisonerNumber, employmentIdx, journeyId } = req.params
  const journey = req.session.addContactJourneys![journeyId]!

  let employment: EmploymentDetails | undefined
  const isNew = employmentIdx === 'new'

  if (!isNew) {
    const idx = Number(employmentIdx) - 1
    if (Number.isNaN(idx) || !journey.pendingEmployments?.[idx]) {
      throw new NotFound()
    }
    employment = journey.pendingEmployments[idx]
  }

  const bounceBackUrl = `/prisoner/${prisonerNumber}/contacts/create/employments/${journeyId}`

  const employmentUrl = ({ subPath }: { subPath: string }) =>
    `/prisoner/${prisonerNumber}/contacts/create/employments/${employmentIdx}/${subPath}/${journeyId}`

  const bounceBackOrEmploymentUrl = ({ subPath }: { subPath: string }) =>
    isNew ? employmentUrl({ subPath }) : bounceBackUrl

  return {
    isNew,
    journey,
    employment,
    employmentUrl,
    bounceBackUrl,
    bounceBackOrEmploymentUrl,
  }
}

export const EmploymentUtils = {
  getActiveAddresses: (organisation: OrganisationDetails) =>
    organisation.addresses
      .filter(({ endDate }: OrganisationAddressDetails) => !endDate || endDate > new Date().toISOString())
      .sort(organisationAddressSorter),

  getInactiveAddresses: (organisation: OrganisationDetails) =>
    organisation.addresses
      .filter(({ endDate }: OrganisationAddressDetails) => endDate && endDate < new Date().toISOString())
      .sort(organisationAddressSorter),
}
