import { ContactAuditEntry } from '../@types/contactsApiClient'
import ContactsApiClient from '../data/contactsApiClient'

export default class ContactAuditHistoryService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  // Get name change history for a contact
  async getNameChangeHistory(contactId: string, user: Express.User) {
    const rawHistory: ContactAuditEntry[] = await this.getContactHistory(Number(contactId), user)

    const sortedHistory = this.sortHistoryByLatest(rawHistory)
    return this.createNameChangeHistory(sortedHistory)
  }

  private createNameChangeHistory(history: ContactAuditEntry[]) {
    const contactNameChanges = []
    for (let i = 0; i < history.length - 1; i += 1) {
      const curr = history[i]
      const prev = history[i + 1]
      const nameChanged =
        curr?.firstName !== prev?.firstName ||
        curr?.middleNames !== prev?.middleNames ||
        curr?.lastName !== prev?.lastName

      if (nameChanged) {
        contactNameChanges.push({
          // new values (from current revision)
          newFirstName: curr?.firstName,
          newMiddleNames: curr?.middleNames,
          newLastName: curr?.lastName,
          // previous values (from previous revision)
          previousFirstName: prev?.firstName,
          previousMiddleNames: prev?.middleNames,
          previousLastName: prev?.lastName,
          // audit meta
          updatedBy: curr?.updatedBy || curr?.username || curr?.createdBy,
          changedOn: curr?.updatedTime || curr?.revisionTimestamp || curr?.createdTime,
        })
      }
    }
    return contactNameChanges
  }

  // Derive name change entries from consecutive revisions (latest first)
  private sortHistoryByLatest(rawHistory: ContactAuditEntry[]) {
    return [...(rawHistory as ContactAuditEntry[])].sort((a, b) => {
      const aTs = new Date(a?.updatedTime || a?.revisionTimestamp || a?.createdTime || 0).getTime()
      const bTs = new Date(b?.updatedTime || b?.revisionTimestamp || b?.createdTime || 0).getTime()
      return bTs - aTs
    })
  }

  private async getContactHistory(contactId: number, user: Express.User): Promise<ContactAuditEntry[]> {
    return this.contactsApiClient.getContactHistory(contactId, user)
  }
}
