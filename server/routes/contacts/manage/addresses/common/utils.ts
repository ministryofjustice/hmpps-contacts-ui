import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { parseISO } from 'date-fns'
import ContactsService from '../../../../../services/contactsService'
import AddressLines = journeys.AddressLines
import AddressMetadata = journeys.AddressMetadata
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import AddressJourney = journeys.AddressJourney
import ReferenceDataService from '../../../../../services/referenceDataService'

export const getAddressJourneyAndUrl = (
  req: Request<{
    prisonerNumber: string
    contactId: string
    prisonerContactId: string
    journeyId: string
  }>,
) => {
  const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
  const journey = req.session.addressJourneys![journeyId]!

  const addressUrl = ({ subPath, fullPath }: { subPath?: string; fullPath?: string }) =>
    fullPath ??
    `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${subPath}/${journeyId}`

  const checkAnswersOrAddressUrl = (params: { subPath?: string; fullPath?: string }) =>
    journey.isCheckingAnswers
      ? `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`
      : addressUrl(params)

  return {
    journey,
    addressUrl,
    checkAnswersOrAddressUrl,
  }
}

export const getFormattedAddress = async (
  referenceDataService: ReferenceDataService,
  journey: AddressJourney,
  user: Express.User,
) => {
  return {
    flat: journey.addressLines!.flat,
    premise: journey.addressLines!.premises,
    street: journey.addressLines!.street,
    area: journey.addressLines!.locality,
    city:
      journey.addressLines!.town &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.CITY,
        journey.addressLines!.town,
        user,
      )),
    county:
      journey.addressLines!.county &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.COUNTY,
        journey.addressLines!.county,
        user,
      )),
    postalCode: journey.addressLines!.postcode,
    country:
      journey.addressLines!.country &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.COUNTRY,
        journey.addressLines!.country,
        user,
      )),
  }
}

export const getUpdateAddressDetails = async (
  contactsService: ContactsService,
  req: Request<{ contactId: string; contactAddressId: string }>,
  res: Response,
) => {
  const { contactId, contactAddressId } = req.params
  const { user } = res.locals
  const contact = await contactsService.getContact(Number(contactId), user)

  const existingAddress = contact.addresses.find(
    (address: ContactAddressDetails) => address.contactAddressId === Number(contactAddressId),
  )
  if (!existingAddress) {
    throw new NotFound()
  }
  const addressType: string = existingAddress.addressType ?? 'DO_NOT_KNOW'
  const addressLines: AddressLines = {
    noFixedAddress: existingAddress.noFixedAddress,
    flat: existingAddress.flat,
    premises: existingAddress.property,
    street: existingAddress.street,
    locality: existingAddress.area,
    town: existingAddress.cityCode,
    county: existingAddress.countyCode,
    postcode: existingAddress.postcode,
    country: existingAddress.countryCode,
  }
  const formattedAddress = {
    flat: existingAddress.flat,
    premise: existingAddress.property,
    street: existingAddress.street,
    area: existingAddress.area,
    city: existingAddress.cityDescription,
    county: existingAddress.countyDescription,
    postalCode: existingAddress.postcode,
    country: existingAddress.countryDescription,
  }
  const fromDate = existingAddress.startDate ? parseISO(existingAddress.startDate) : undefined
  const toDate = existingAddress.endDate ? parseISO(existingAddress.endDate) : undefined

  const addressMetadata: AddressMetadata = {
    fromMonth: fromDate ? (fromDate.getMonth() + 1).toString() : undefined,
    fromYear: fromDate?.getFullYear().toString(),
    toMonth: toDate ? (toDate.getMonth() + 1).toString() : undefined,
    toYear: toDate?.getFullYear()?.toString(),
    primaryAddress: existingAddress.primaryAddress,
    mailAddress: existingAddress.mailFlag,
    comments: existingAddress.comments,
  }

  return {
    address: existingAddress,
    contact,
    addressType,
    addressLines,
    addressMetadata,
    formattedAddress,
  }
}
