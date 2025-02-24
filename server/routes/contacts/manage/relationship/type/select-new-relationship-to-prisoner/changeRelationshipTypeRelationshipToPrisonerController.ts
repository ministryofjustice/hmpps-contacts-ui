import { Request, Response } from 'express'
import { Page } from '../../../../../../services/auditService'
import { PageHandler } from '../../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../../services/referenceDataService'
import { ContactsService } from '../../../../../../services'
import { SelectRelationshipSchema } from '../../../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../../../common/navigation'
import { formatNameFirstNameFirst } from '../../../../../../utils/formatName'
import Urls from '../../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../../middleware/setUpSuccessNotificationBanner'
import { relationshipToPrisonerOptionsForRelationshipType } from '../../../../../../utils/relationshipTypeUtils'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest

export default class ChangeRelationshipTypeRelationshipToPrisonerController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!

    const formattedName = formatNameFirstNameFirst(journey.names)
    const currentRelationship = res.locals?.formResponses?.['relationship'] ?? journey.relationshipToPrisoner

    const { groupCodeForRelationshipType, hintText, defaultSelectLabel } =
      relationshipToPrisonerOptionsForRelationshipType(journey.relationshipType, formattedName)

    const relationshipOptions = await this.referenceDataService
      .getReferenceData(groupCodeForRelationshipType, user)
      .then(val => this.getSelectedOptions(val, currentRelationship, defaultSelectLabel))

    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-type/${journey.id}`,
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      hintText,
      navigation,
      relationshipOptions,
      relationship: currentRelationship,
      names: journey.names,
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
        journeyId: string
      },
      unknown,
      SelectRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { relationship } = req.body
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    const request: UpdateRelationshipRequest = {
      relationshipType: journey.relationshipType,
      relationshipToPrisoner: relationship,
      updatedBy: user.username,
    }
    await this.contactsService
      .updateContactRelationshipById(Number(prisonerContactId), request, user)
      .then(_ => this.contactsService.getContact(Number(contactId), user))
      .then(response => {
        delete req.session.changeRelationshipTypeJourneys![journeyId]
        return req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the relationship information for contact ${formatNameFirstNameFirst(response)} and prisoner ${formatNameFirstNameFirst(prisonerDetails, { excludeMiddleNames: true })}.`,
        )
      })

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
