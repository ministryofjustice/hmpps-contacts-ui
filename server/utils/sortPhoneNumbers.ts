import { components } from '../@types/contactsApi'

export const getReferenceDataOrderDictionary = (phoneTypeReferenceData: components['schemas']['ReferenceCode'][]) =>
  Object.fromEntries(phoneTypeReferenceData.map(refData => [refData.code, refData.displayOrder]))

export const sortPhoneNumbers = (
  phoneNumbers: components['schemas']['ContactPhoneDetails'][],
  phoneTypeOrderDictionary?: { [key: string]: number },
) =>
  phoneTypeOrderDictionary
    ? phoneNumbers.sort(
        (a, b) => (phoneTypeOrderDictionary[a.phoneType] ?? 0) - (phoneTypeOrderDictionary[b.phoneType] ?? 0),
      )
    : phoneNumbers
