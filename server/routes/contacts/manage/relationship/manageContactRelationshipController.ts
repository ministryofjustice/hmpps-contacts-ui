import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { ContactsService } from '../../../../services'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../common/navigation'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactNames = journeys.ContactNames
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import { formatNameFirstNameFirst } from '../../../../utils/formatName'

export default class ManageContactRelationshipController implements PageHandler {
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
    const { contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const relationship: PrisonerContactRelationshipDetails = await this.contactsService.getPrisonerContactRelationship(
      Number(prisonerContactId),
      user,
    )

    const { journey } = res.locals
    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const formattedName = formatNameFirstNameFirst(names)
    const hintText = `For example, if ${formattedName} is the prisoner’s uncle, select ‘Uncle’.`
    const currentRelationship = res.locals?.formResponses?.relationship ?? relationship.relationshipToPrisonerCode
    const relationshipOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.SOCIAL_RELATIONSHIP, user)
      .then(val => this.getSelectedOptions(val, currentRelationship))
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      journey: { ...journey, names },
      hintText,
      navigation,
      relationshipOptions,
      relationship: currentRelationship,
      contact,
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
    const { user } = res.locals
    const { journey } = res.locals
    const { prisonerContactId } = req.params
    const { relationship } = req.body
    const request: UpdateRelationshipRequest = {
      relationshipToPrisoner: relationship,
      updatedBy: user.username,
    }
    await this.contactsService.updateContactRelationshipById(Number(prisonerContactId), request, user)
    res.redirect(journey.returnPoint.url)
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedType?: string,
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
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
