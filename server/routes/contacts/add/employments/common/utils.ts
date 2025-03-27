import { Request } from 'express'
import { NotFound } from 'http-errors'
import EmploymentDetails = journeys.EmploymentDetails
import { organisationAddressSorter } from '../../../../../utils/sorters'
import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails
import OrganisationAddressDetails = organisationsApiClientTypes.OrganisationAddressDetails
import OrganisationSummary = contactsApiClientTypes.OrganisationSummary

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

  summariseOrganisationDetails: ({
    organisationId,
    organisationName,
    organisationActive,
    addresses,
  }: OrganisationDetails): OrganisationSummary => {
    const activePrimaryAddress = addresses.find(
      ({ primaryAddress, endDate }: OrganisationAddressDetails) =>
        primaryAddress && (!endDate || endDate > new Date().toISOString()),
    )
    const phoneNumber = activePrimaryAddress?.phoneNumbers.find(
      ({ phoneType }: { phoneType: string }) => phoneType === 'BUS',
    )

    const {
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postcode,
      countryCode,
      countryDescription,
    } = activePrimaryAddress || {}

    const { phoneNumber: businessPhoneNumber, extNumber: businessPhoneNumberExtension } = phoneNumber || {}

    return {
      organisationId,
      organisationName,
      organisationActive,
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postcode,
      countryCode,
      countryDescription,
      businessPhoneNumber,
      businessPhoneNumberExtension,
    }
  },
}
