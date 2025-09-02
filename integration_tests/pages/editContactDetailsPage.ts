import Page, { PageElement } from './page'

export default class EditContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Edit contact details for ${name}`)
  }

  verifyShowTitleAs(expected: string): EditContactDetailsPage {
    this.titleValue().should('contain.text', expected)
    return this
  }

  clickChangeTitleLink() {
    this.changeTitleLink().click()
  }

  verifyShowNameAs(expected: string): EditContactDetailsPage {
    this.nameValue().should('contain.text', expected)
    return this
  }

  clickChangeNameLink() {
    this.changeNameLink().click()
  }

  verifyShowDOBValueAs(expected: string): EditContactDetailsPage {
    this.dateOfBirthValue().should('contain.text', expected)
    return this
  }

  clickChangeDateOfBirthLink() {
    this.changeDateOfBirthLink().click()
  }

  verifyShowGenderValueAs(expected: string): EditContactDetailsPage {
    this.genderValue().should('contain.text', expected)
    return this
  }

  clickChangeGenderLink() {
    this.changeGenderLink().click()
  }

  verifyShowStaffStatusValueAs(expected: string): EditContactDetailsPage {
    this.staffMemberValue().should('contain.text', expected)
    return this
  }

  clickChangeStaffStatusLink() {
    this.changeStaffMemberLink().click()
  }

  verifyShowRelationshipToPrisonerAs(expected: string): EditContactDetailsPage {
    this.relationshipToPrisonerValue().should('contain.text', expected)
    return this
  }

  clickChangeRelationshipToPrisonerLink() {
    this.changeRelationshipToPrisonerLink().click()
  }

  verifyShowRelationshipTypeAs(expected: string): EditContactDetailsPage {
    this.relationshipTypeValue().should('contain.text', expected)
    return this
  }

  clickChangeRelationshipTypeLink() {
    this.changeRelationshipTypeLink().click()
  }

  verifyShowRelationshipStatusAs(expected: string): EditContactDetailsPage {
    this.relationshipStatusValue().should('contain.text', expected)
    return this
  }

  clickChangeRelationshipStatusLink() {
    this.changeRelationshipStatusLink().click()
  }

  verifyShowEmergencyContactAs(expected: string): EditContactDetailsPage {
    this.emergencyContactValue().should('contain.text', expected)
    return this
  }

  clickChangeEmergencyContactLink() {
    this.changeEmergencyContactLink().click()
  }

  verifyShowNextOfKinAs(expected: string): EditContactDetailsPage {
    this.nextOfKinValue().should('contain.text', expected)
    return this
  }

  clickChangeNextOfKinLink() {
    this.changeNextOfKinLink().click()
  }

  verifyShowApprovedForVisitsAs(expected: string): EditContactDetailsPage {
    this.approvedForVisitsValue().should('contain.text', expected)
    return this
  }

  clickChangeApprovedForVisitsLink() {
    this.changeApprovedForVisitsLink().click()
  }

  verifyShowCommentsAs(expected: string): EditContactDetailsPage {
    this.commentsValue().should('contain.text', expected)
    return this
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  clickAddIdentityDocumentLink() {
    this.addIdentityDocumentLink().click()
  }

  clickEditIdentityLink(documentNumber: string) {
    this.editIdentityByDocumentNumberLink(documentNumber).click()
  }

  clickDeleteIdentityLink(documentNumber: string) {
    this.deleteIdentityByDocumentNumberLink(documentNumber).click()
  }

  verifyShowLanguageAs(expected: string): EditContactDetailsPage {
    this.languageValue().should('contain.text', expected)
    return this
  }

  clickChangeLanguageLink() {
    this.changeLanguageLink().click()
  }

  verifyShowInterpreterRequiredAs(expected: string): EditContactDetailsPage {
    this.interpreterRequiredValue().should('contain.text', expected)
    return this
  }

  clickChangeInterpreterRequiredLink() {
    this.changeInterpreterRequiredLink().click()
  }

  verifyShowDomesticStatusAs(expected: string): EditContactDetailsPage {
    this.domesticStatusValue().should('contain.text', expected)
    return this
  }

  clickChangeDomesticStatusLink() {
    this.changeDomesticStatusLink().click()
  }

  clickRecordDateOfDeathLink() {
    this.recordDateOfDeathLink().click()
  }

  clickChangeDateOfDeathLink() {
    this.changeDateOfDeathLink().click()
  }

  clickDeleteDateOfDeathLink() {
    this.deleteDateOfDeathLink().click()
  }

  clickDeleteDobLink() {
    cy.findByRole('link', { name: 'Delete the contact’s date of birth (Personal information)' }).click()
  }

  clickDeleteRelationshipLink() {
    this.deleteRelationshipLink().click()
    return this
  }

  private titleHeading = (): PageElement => cy.findByText('Title')

  private titleValue = (): PageElement => this.titleHeading().next()

  private changeTitleLink = (): PageElement => this.titleHeading().next().next().find('a')

  private nameHeading = (): PageElement => cy.findByText('Name')

  private nameValue = (): PageElement => this.nameHeading().next()

  private changeNameLink = (): PageElement => this.nameHeading().next().next().find('a')

  // there are 2 DOB as the prisoner's is in the mini profile. The 2nd one is the summary card
  private dateOfBirthHeading = (): PageElement => cy.findAllByText('Date of birth').last()

  private dateOfBirthValue = (): PageElement => this.dateOfBirthHeading().next()

  private changeDateOfBirthLink = (): PageElement =>
    cy.findByRole('link', { name: /Change the contact’s date of birth/ })

  private genderHeading = (): PageElement => cy.findByText('Gender')

  private genderValue = (): PageElement => this.genderHeading().next()

  private changeGenderLink = (): PageElement => this.genderHeading().next().next().find('a')

  private staffMemberHeading = (): PageElement => cy.findByText('Staff member')

  private staffMemberValue = (): PageElement => this.staffMemberHeading().next()

  private changeStaffMemberLink = (): PageElement => this.staffMemberHeading().next().next().find('a')

  private relationshipToPrisonerHeading = (): PageElement => cy.findByText('Relationship to prisoner')

  private relationshipToPrisonerValue = (): PageElement => this.relationshipToPrisonerHeading().next()

  private changeRelationshipToPrisonerLink = (): PageElement =>
    this.relationshipToPrisonerHeading().next().next().find('a')

  private relationshipTypeHeading = (): PageElement => cy.findByText('Relationship type')

  private relationshipTypeValue = (): PageElement => this.relationshipTypeHeading().next()

  private changeRelationshipTypeLink = (): PageElement => this.relationshipTypeHeading().next().next().find('a')

  private relationshipStatusHeading = (): PageElement => cy.findByText('Relationship status')

  private relationshipStatusValue = (): PageElement => this.relationshipStatusHeading().next()

  private changeRelationshipStatusLink = (): PageElement => this.relationshipStatusHeading().next().next().find('a')

  private emergencyContactHeading = (): PageElement => cy.findByText('Emergency contact')

  private emergencyContactValue = (): PageElement => this.emergencyContactHeading().next()

  private changeEmergencyContactLink = (): PageElement => this.emergencyContactHeading().next().next().find('a')

  private nextOfKinHeading = (): PageElement => cy.findByText('Next of kin')

  private nextOfKinValue = (): PageElement => this.nextOfKinHeading().next()

  private changeNextOfKinLink = (): PageElement => this.nextOfKinHeading().next().next().find('a')

  private approvedForVisitsHeading = (): PageElement => cy.findByText('Approved for visits')

  private approvedForVisitsValue = (): PageElement => this.approvedForVisitsHeading().next()

  private changeApprovedForVisitsLink = (): PageElement => this.approvedForVisitsHeading().next().next().find('a')

  private commentsHeading = (): PageElement => cy.findByText('Comments on the relationship')

  private commentsValue = (): PageElement => this.commentsHeading().next()

  private changeCommentsLink = (): PageElement => this.commentsHeading().next().next().find('a')

  private addIdentityDocumentLink = (): PageElement => cy.findByText('Identity documentation').next().find('a')

  private editIdentityByDocumentNumberLink = (documentNumber: string): PageElement =>
    cy.findByText(documentNumber).next().findByText('Change')

  private deleteIdentityByDocumentNumberLink = (documentNumber: string): PageElement =>
    cy.findByText(documentNumber).next().findByText('Delete')

  private languageHeading = (): PageElement => cy.findByText('Contact’s first language')

  private languageValue = (): PageElement => this.languageHeading().next()

  private changeLanguageLink = (): PageElement => this.languageHeading().next().next().find('a')

  private interpreterHeading = (): PageElement => cy.findByText('Interpreter required')

  private interpreterRequiredValue = (): PageElement => this.interpreterHeading().next()

  private changeInterpreterRequiredLink = (): PageElement => this.interpreterHeading().next().next().find('a')

  private domesticStatusHeading = (): PageElement => cy.findByText('Contact’s domestic status')

  private domesticStatusValue = (): PageElement => this.domesticStatusHeading().next()

  private changeDomesticStatusLink = (): PageElement => this.domesticStatusHeading().next().next().find('a')

  private recordDateOfDeathLink = (): PageElement => cy.findByRole('link', { name: 'Record the death of this contact' })

  private changeDateOfDeathLink = (): PageElement =>
    cy.findByRole('link', { name: 'Change the contact’s date of death (Personal information)' })

  private deleteDateOfDeathLink = (): PageElement =>
    cy.findByRole('link', { name: 'Delete the contact’s date of death (Personal information)' })

  private deleteRelationshipLink = (): PageElement => cy.get('[data-qa="delete-relationship-link"]')
}
