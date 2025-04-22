import sortRestrictions from './sortRestrictions'
import { ContactRestrictionDetails, PrisonerContactRestrictionDetails } from '../@types/contactsApiClient'

const minimalGlobalRestriction: ContactRestrictionDetails = {
  contactRestrictionId: 1,
  contactId: 1,
  restrictionType: 'BANNED',
  restrictionTypeDescription: 'Banned',
  startDate: '2024-01-01',
  enteredByUsername: 'USER1',
  enteredByDisplayName: 'User One',
  createdTime: '2024-09-20T10:30:00.000000',
  createdBy: 'USER1',
}

const minimalRelationshipRestriction: PrisonerContactRestrictionDetails = {
  prisonerContactRestrictionId: 1,
  contactId: 1,
  prisonerContactId: 1,
  prisonerNumber: 'A1234BC',
  restrictionType: 'BANNED',
  restrictionTypeDescription: 'Banned',
  startDate: '2024-01-01',
  enteredByUsername: 'USER1',
  enteredByDisplayName: 'User One',
  createdTime: '2024-09-20T10:30:00.000000',
  createdBy: 'USER1',
}

describe('sortRestrictions', () => {
  describe('global', () => {
    it('should sort with expired last, unexpired sorted by start date, expired sorted by expiry date', () => {
      const oldestUnexpired = { ...minimalGlobalRestriction, contactRestrictionId: 1, startDate: '2024-01-01' }
      const newestUnexpired = { ...minimalGlobalRestriction, contactRestrictionId: 2, startDate: '2024-01-03' }
      const middleUnexpiredWithExpiryInFuture = {
        ...minimalGlobalRestriction,
        contactRestrictionId: 3,
        startDate: '2024-01-02',
        expiryDate: '2050-01-01',
      }
      const expiredLongestAgo = {
        ...minimalGlobalRestriction,
        contactRestrictionId: 4,
        startDate: '2024-01-03',
        expiryDate: '2024-01-01',
      }
      const expiredMostRecently = {
        ...minimalGlobalRestriction,
        contactRestrictionId: 5,
        startDate: '2024-01-01',
        expiryDate: '2024-01-02',
      }
      const original: ContactRestrictionDetails[] = [
        oldestUnexpired,
        newestUnexpired,
        middleUnexpiredWithExpiryInFuture,
        expiredLongestAgo,
        expiredMostRecently,
      ]
      expect(sortRestrictions(original)).toStrictEqual([
        newestUnexpired,
        middleUnexpiredWithExpiryInFuture,
        oldestUnexpired,
        expiredMostRecently,
        expiredLongestAgo,
      ])
    })
  })
  describe('global', () => {
    it('should sort with expired last, unexpired sorted by start date, expired sorted by expiry date', () => {
      const oldestUnexpired = { ...minimalRelationshipRestriction, contactRestrictionId: 1, startDate: '2024-01-01' }
      const newestUnexpired = { ...minimalRelationshipRestriction, contactRestrictionId: 2, startDate: '2024-01-03' }
      const middleUnexpiredWithExpiryInFuture = {
        ...minimalRelationshipRestriction,
        contactRestrictionId: 3,
        startDate: '2024-01-02',
        expiryDate: '2050-01-01',
      }
      const expiredLongestAgo = {
        ...minimalRelationshipRestriction,
        contactRestrictionId: 4,
        startDate: '2024-01-03',
        expiryDate: '2024-01-01',
      }
      const expiredMostRecently = {
        ...minimalRelationshipRestriction,
        contactRestrictionId: 5,
        startDate: '2024-01-01',
        expiryDate: '2024-01-02',
      }
      const original: PrisonerContactRestrictionDetails[] = [
        oldestUnexpired,
        newestUnexpired,
        middleUnexpiredWithExpiryInFuture,
        expiredLongestAgo,
        expiredMostRecently,
      ]
      expect(sortRestrictions(original)).toStrictEqual([
        newestUnexpired,
        middleUnexpiredWithExpiryInFuture,
        oldestUnexpired,
        expiredMostRecently,
        expiredLongestAgo,
      ])
    })
  })
})
