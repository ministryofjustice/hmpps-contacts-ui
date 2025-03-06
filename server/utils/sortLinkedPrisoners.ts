import { components } from '../@types/contactsApi'
import { formatNameLastNameFirst } from './formatName'

type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']

export const sortLinkedPrisoners = (linkedPrisoners: LinkedPrisonerDetails[]): LinkedPrisonerDetails[] => {
  return linkedPrisoners.sort(
    (a, b) =>
      formatNameLastNameFirst(a).localeCompare(formatNameLastNameFirst(b)) ||
      a.prisonerNumber.localeCompare(b.prisonerNumber),
  )
}
