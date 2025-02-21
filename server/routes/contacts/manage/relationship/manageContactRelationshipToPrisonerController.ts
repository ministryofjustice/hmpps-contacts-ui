import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { ContactsService } from '../../../../services'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../common/navigation'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactNames = journeys.ContactNames
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'

export default class ManageContactRelationshipToPrisonerController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_RELATIONSHIP_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const relationship: PrisonerContactRelationshipDetails = await this.contactsService.getPrisonerContactRelationship(
      Number(prisonerContactId),
      user,
    )

    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const formattedName = formatNameFirstNameFirst(names)
    const currentRelationship = res.locals?.formResponses?.['relationship'] ?? relationship.relationshipToPrisonerCode

    let groupCodeForRelationshipType
    let hintText
    let defaultSelectLabel
    if (relationship.relationshipType === 'S') {
      groupCodeForRelationshipType = ReferenceCodeType.SOCIAL_RELATIONSHIP
      hintText = `For example, if ${formattedName} is the prisoner’s uncle, select ‘Uncle’.`
      defaultSelectLabel = 'Select social relationship'
    } else {
      groupCodeForRelationshipType = ReferenceCodeType.OFFICIAL_RELATIONSHIP
      hintText = `For example, if ${formattedName} is the prisoner’s doctor, select ‘Doctor’.`
      defaultSelectLabel = 'Select official relationship'
    }
    const relationshipOptions = await this.referenceDataService
      .getReferenceData(groupCodeForRelationshipType, user)
      .then(val => this.getSelectedOptions(val, currentRelationship, defaultSelectLabel))

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      hintText,
      navigation,
      relationshipOptions,
      relationship: currentRelationship,
      names,
      caption: 'Edit contact relationship information',
      continueButtonLabel: 'Confirm and save',
    }
    res.render('pages/contacts/common/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      SelectRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { relationship } = req.body
    const request: UpdateRelationshipRequest = {
      relationshipToPrisoner: relationship,
      updatedBy: user.username,
    }
    await this.contactsService
      .updateContactRelationshipById(Number(prisonerContactId), request, user)
      .then(_ => this.contactsService.getContact(Number(contactId), user))
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails, { excludeMiddleNames: true })}.`,
        ),
      )

    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedType: string | null | undefined,
    defaultSelectLabel: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        selected: referenceCode.code === selectedType,
      }
    })
    return [{ text: defaultSelectLabel, value: '' }, ...mappedOptions]
  }
}
