import ContactsApiClient from '../data/contactsApiClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode

export default class ReferenceDataService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async getReferenceData(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    return this.contactsApiClient.getReferenceCodes(type, user)
  }

  async getReferenceDescriptionForCode(type: ReferenceCodeType, code: string, user: Express.User): Promise<string> {
    return this.contactsApiClient
      .getReferenceCodes(type, user)
      .then(values => values.find(val => val.code === code)?.description ?? '')
  }
}
