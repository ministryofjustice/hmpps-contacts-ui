import ContactsApiClient from '../data/contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode

export default class ReferenceDataService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async getReferenceData(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    return this.contactsApiClient.getReferenceCode(type, user)
  }
}
