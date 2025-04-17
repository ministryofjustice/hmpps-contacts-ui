import { Request } from 'express'
import { NotFound } from 'http-errors'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { AddressForm } from '../../../../../@types/journeys'

export type CreateContactAddressParam = {
  prisonerNumber: string
  journeyId: string
  addressIndex: string
}

export const getAddressFormAndUrl = (req: Request<CreateContactAddressParam>) => {
  const { prisonerNumber, addressIndex, journeyId } = req.params
  const journey = req.session.addContactJourneys![journeyId]!

  let addressForm: AddressForm
  const isNew = addressIndex === 'new'

  if (isNew) {
    journey.newAddress ??= {}
    addressForm = journey.newAddress
  } else {
    const idx = Number(addressIndex) - 1
    if (Number.isNaN(idx) || !journey.pendingAddresses?.[idx]) {
      throw new NotFound()
    }
    addressForm = journey.pendingAddresses[idx]
  }

  const bounceBackUrl = `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`

  const addressUrl = ({ subPath }: { subPath: string }) =>
    `/prisoner/${prisonerNumber}/contacts/create/addresses/${addressIndex}/${subPath}/${journeyId}`

  const bounceBackOrAddressUrl = ({ subPath }: { subPath: string }) => (isNew ? addressUrl({ subPath }) : bounceBackUrl)

  return {
    isNew,
    journey,
    addressForm,
    addressUrl,
    bounceBackUrl,
    bounceBackOrAddressUrl,
  }
}

export const formatAddresses = async (
  addresses: AddressForm[] | undefined,
  referenceDataService: ReferenceDataService,
  user: Express.User,
) => {
  if (!addresses?.length) {
    return addresses
  }

  const addressTypeDescriptions = new Map(
    (await referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)).map(refData => [
      refData.code,
      refData.description,
    ]),
  )
  const cityDescriptions = new Map(
    (await referenceDataService.getReferenceData(ReferenceCodeType.CITY, user)).map(refData => [
      refData.code,
      refData.description,
    ]),
  )
  const countyDescriptions = new Map(
    (await referenceDataService.getReferenceData(ReferenceCodeType.COUNTY, user)).map(refData => [
      refData.code,
      refData.description,
    ]),
  )
  const countryDescriptions = new Map(
    (await referenceDataService.getReferenceData(ReferenceCodeType.COUNTRY, user)).map(refData => [
      refData.code,
      refData.description,
    ]),
  )
  const phoneTypeDescriptions = new Map(
    (await referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)).map(refData => [
      refData.code,
      refData.description,
    ]),
  )

  return addresses.map(address => ({
    ...address.addressLines,
    ...address.addressMetadata,
    addressTypeDescription: address.addressType && addressTypeDescriptions.get(address.addressType),
    cityDescription: address.addressLines?.cityCode && cityDescriptions.get(address.addressLines.cityCode),
    countyDescription: address.addressLines?.countyCode && countyDescriptions.get(address.addressLines.countyCode),
    countryDescription: address.addressLines?.countryCode && countryDescriptions.get(address.addressLines.countryCode),
    phoneNumbers: address.phoneNumbers?.map(phone => ({
      phoneNumber: phone.phoneNumber,
      extNumber: phone.extension,
      phoneTypeDescription: phoneTypeDescriptions.get(phone.type),
    })),
  }))
}
