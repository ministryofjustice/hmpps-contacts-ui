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
    ...journey.addressLines!,
    cityDescription:
      journey.addressLines!.cityCode &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.CITY,
        journey.addressLines!.cityCode,
        user,
      )),
    countyDescription:
      journey.addressLines!.countyCode &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.COUNTY,
        journey.addressLines!.countyCode,
        user,
      )),
    countryDescription:
      journey.addressLines!.countryCode &&
      (await referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.COUNTRY,
        journey.addressLines!.countryCode,
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
    property: existingAddress.property,
    street: existingAddress.street,
    area: existingAddress.area,
    cityCode: existingAddress.cityCode,
    countyCode: existingAddress.countyCode,
    postcode: existingAddress.postcode,
    countryCode: existingAddress.countryCode,
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
    formattedAddress: existingAddress,
    contact,
    addressType,
    addressLines,
    addressMetadata,
  }
}
