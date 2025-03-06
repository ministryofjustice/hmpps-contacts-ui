import { components } from '../@types/contactsApi'
import { formatNameLastNameFirst } from './formatName'

type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']

export const sortLinkedPrisoners = (linkedPrisoners: LinkedPrisonerDetails[]): LinkedPrisonerDetails[] => {
  return linkedPrisoners.sort((a, b) => {
    const comparison = formatNameLastNameFirst(a).localeCompare(formatNameLastNameFirst(b))
    if (comparison === 0) {
      a.prisonerNumber.localeCompare(b.prisonerNumber)
    }
    return comparison
  })
}
