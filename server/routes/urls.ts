export default class Urls {
  static contactList = (prisonerNumber: string) => {
    return `/prisoner/${prisonerNumber}/contacts/list`
  }

  static contactDetails = (
    prisonerNumber: string,
    contactId: string | number,
    prisonerContactId: string | number,
    tab?: 'contact-details' | 'contact-methods' | 'restrictions' | undefined,
  ) => {
    return `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}${tab ? `#${tab}` : ''}`
  }

  static editContactDetails = (
    prisonerNumber: string,
    contactId: string | number,
    prisonerContactId: string | number,
  ) => {
    return `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-contact-details`
  }

  static editContactMethods = (
    prisonerNumber: string,
    contactId: string | number,
    prisonerContactId: string | number,
  ) => {
    return `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-contact-methods`
  }
}
