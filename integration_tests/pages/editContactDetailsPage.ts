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

  private titleHeading = (): PageElement => cy.findByText('Title')

  private titleValue = (): PageElement => this.titleHeading().next()

  private changeTitleLink = (): PageElement => this.titleHeading().next().next().find('a')

  private nameHeading = (): PageElement => cy.findByText('Name')

  private nameValue = (): PageElement => this.nameHeading().next()

  private changeNameLink = (): PageElement => this.nameHeading().next().next().find('a')

  // there are 2 DOB as the prisoner's is in the mini profile. The 2nd one is the summary card
  private dateOfBirthHeading = (): PageElement => cy.findAllByText('Date of birth').last()

  private dateOfBirthValue = (): PageElement => this.dateOfBirthHeading().next()

  private changeDateOfBirthLink = (): PageElement => this.dateOfBirthHeading().next().next().find('a')

  private genderHeading = (): PageElement => cy.findByText('Gender')

  private genderValue = (): PageElement => this.genderHeading().next()

  private changeGenderLink = (): PageElement => this.genderHeading().next().next().find('a')

  private staffMemberHeading = (): PageElement => cy.findByText('Staff member')

  private staffMemberValue = (): PageElement => this.staffMemberHeading().next()

  private changeStaffMemberLink = (): PageElement => this.staffMemberHeading().next().next().find('a')

  private relationshipToPrisonerHeading = (): PageElement => cy.findAllByText('Relationship to prisoner').last()

  private relationshipToPrisonerValue = (): PageElement => this.relationshipToPrisonerHeading().next()

  private changeRelationshipToPrisonerLink = (): PageElement =>
    this.relationshipToPrisonerHeading().next().next().find('a')

  private relationshipStatusHeading = (): PageElement => cy.findAllByText('Relationship status').last()

  private relationshipStatusValue = (): PageElement => this.relationshipStatusHeading().next()

  private changeRelationshipStatusLink = (): PageElement => this.relationshipStatusHeading().next().next().find('a')

  private emergencyContactHeading = (): PageElement => cy.findAllByText('Emergency contact').last()

  private emergencyContactValue = (): PageElement => this.emergencyContactHeading().next()

  private changeEmergencyContactLink = (): PageElement => this.emergencyContactHeading().next().next().find('a')

  private nextOfKinHeading = (): PageElement => cy.findAllByText('Next of kin').last()

  private nextOfKinValue = (): PageElement => this.nextOfKinHeading().next()

  private changeNextOfKinLink = (): PageElement => this.nextOfKinHeading().next().next().find('a')

  private approvedForVisitsHeading = (): PageElement => cy.findAllByText('Approved for visits').last()

  private approvedForVisitsValue = (): PageElement => this.approvedForVisitsHeading().next()

  private changeApprovedForVisitsLink = (): PageElement => this.approvedForVisitsHeading().next().next().find('a')

  private commentsHeading = (): PageElement => cy.findAllByText('Comments on the relationship').last()

  private commentsValue = (): PageElement => this.commentsHeading().next()

  private changeCommentsLink = (): PageElement => this.commentsHeading().next().next().find('a')
}
