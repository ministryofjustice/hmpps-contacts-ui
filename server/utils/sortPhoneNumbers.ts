import { ContactPhoneDetails, ReferenceCode } from '../@types/contactsApiClient'

export const getReferenceDataOrderDictionary = (phoneTypeReferenceData: ReferenceCode[]) =>
  Object.fromEntries(phoneTypeReferenceData.map(refData => [refData.code, refData.displayOrder]))

export const sortPhoneNumbers = (
  phoneNumbers: ContactPhoneDetails[],
  phoneTypeOrderDictionary?: { [key: string]: number },
) =>
  phoneTypeOrderDictionary
    ? phoneNumbers.sort(
        (a, b) => (phoneTypeOrderDictionary[a.phoneType] ?? 0) - (phoneTypeOrderDictionary[b.phoneType] ?? 0),
      )
    : phoneNumbers
