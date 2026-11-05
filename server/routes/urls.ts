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

  static prisonerRestrictions = (prisonerNumber: string) => {
    return `/prisoner/${prisonerNumber}/alerts-restrictions`
  }

  static addPrisonerRestriction = (prisonerNumber: string) => {
    return `/prisoner/${prisonerNumber}/restrictions/add`
  }

  static updatePrisonerRestriction = (prisonerNumber: string, prisonerRestrictionId: string | number) => {
    return `/prisoner/${prisonerNumber}/restrictions/${prisonerRestrictionId}/update`
  }

  static deletePrisonerRestriction = (prisonerNumber: string, prisonerRestrictionId: string | number) => {
    return `/prisoner/${prisonerNumber}/restrictions/${prisonerRestrictionId}/delete`
  }
}
