export default class Urls {
  static contactDetails = (
    prisonerNumber: string,
    contactId: string | number,
    prisonerContactId: string | number,
    tab?: string | undefined,
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
}
