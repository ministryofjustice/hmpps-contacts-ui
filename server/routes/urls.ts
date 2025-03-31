export default class Urls {
  static contactList = (prisonerNumber: string) => {
    return `/prisoner/${prisonerNumber}/contacts/list`
  }

  static contactDetails = (prisonerNumber: string, contactId: string | number, prisonerContactId: string | number) => {
    return `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`
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

  static editRestrictions = (
    prisonerNumber: string,
    contactId: string | number,
    prisonerContactId: string | number,
  ) => {
    return `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-restrictions`
  }
}
