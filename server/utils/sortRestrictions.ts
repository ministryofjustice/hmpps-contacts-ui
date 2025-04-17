import { isDateAndInThePast } from './utils'
import {
  ContactAddressDetails,
  ContactRestrictionDetails,
  PrisonerContactRestrictionDetails,
} from '../@types/contactsApiClient'

function sortRestrictions(
  restrictions: ContactRestrictionDetails[] | PrisonerContactRestrictionDetails[],
): ContactAddressDetails[] | PrisonerContactRestrictionDetails[] {
  return (
    restrictions?.sort((a, b) => {
      const aExpired = isDateAndInThePast(a.expiryDate)
      const bExpired = isDateAndInThePast(b.expiryDate)
      if (aExpired !== bExpired) {
        return !aExpired ? -1 : 1
      }

      if (!aExpired && a.startDate !== b.startDate) {
        return (
          (b?.startDate ? new Date(b.startDate).getTime() : 0) - (a?.startDate ? new Date(a.startDate).getTime() : 0)
        )
      }
      if (aExpired && a.expiryDate !== b.expiryDate) {
        return (
          (b?.expiryDate ? new Date(b.expiryDate).getTime() : 0) -
          (a?.expiryDate ? new Date(a.expiryDate).getTime() : 0)
        )
      }

      return (
        (b?.createdTime ? new Date(b.createdTime).getTime() : 0) -
        (a?.createdTime ? new Date(a.createdTime).getTime() : 0)
      )
    }) ?? []
  )
}

export default sortRestrictions
