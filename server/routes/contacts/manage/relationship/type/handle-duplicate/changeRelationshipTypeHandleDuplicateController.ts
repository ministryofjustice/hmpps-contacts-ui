import { Request, Response } from 'express'
import { Page } from '../../../../../../services/auditService'
import { PageHandler } from '../../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../../services/referenceDataService'
import { ContactsService } from '../../../../../../services'
import { Navigation } from '../../../../common/navigation'
import Urls from '../../../../../urls'
import ReferenceCodeType from '../../../../../../enumeration/referenceCodeType'
import Permission from '../../../../../../enumeration/permission'
import { HandleDuplicateRelationshipSchema } from '../../../../common/relationship/handleDuplicateRelationshipSchemas'

export default class ChangeRelationshipTypeHandleDuplicateController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_HANDLE_DUPLICATE_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!

    const groupCodeForRelationshipType =
      journey.relationshipType === 'S' ? ReferenceCodeType.SOCIAL_RELATIONSHIP : ReferenceCodeType.OFFICIAL_RELATIONSHIP
    const relationshipTypeDescription = await this.referenceDataService.getReferenceDescriptionForCode(
      groupCodeForRelationshipType,
      journey.relationshipToPrisoner,
      user,
    )
    const existingRelationships = await this.contactsService.getAllSummariesForPrisonerAndContact(
      prisonerNumber,
      Number(contactId),
      user,
    )

    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-to-prisoner/${journey.id}`,
    }
    const viewModel = {
      isNewContact: false,
      navigation,
      relationshipTypeDescription,
      names: journey.names,
      existingRelationships: existingRelationships.sort((a, b) => {
        if (a.isRelationshipActive !== b.isRelationshipActive) {
          return !a.isRelationshipActive ? 1 : -1
        }
        return a.relationshipToPrisonerDescription.localeCompare(b.relationshipToPrisonerDescription)
      }),
    }
    res.render('pages/contacts/manage/contactDetails/relationship/handleDuplicateRelationship', viewModel)
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
      HandleDuplicateRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { duplicateAction } = req.body

    const journey = req.session.changeRelationshipTypeJourneys![journeyId]!
    if (duplicateAction === 'GO_TO_CONTACT_LIST') {
      delete req.session.changeRelationshipTypeJourneys![journeyId]
      res.redirect(Urls.contactList(prisonerNumber))
    } else {
      delete req.session.changeRelationshipTypeJourneys![journeyId]
      const existingRelationships = await this.contactsService.getAllSummariesForPrisonerAndContact(
        prisonerNumber,
        Number(contactId),
        user,
      )
      const existingRelationship = existingRelationships.find(
        relationship => relationship.relationshipToPrisonerCode === journey.relationshipToPrisoner,
      )
      res.redirect(
        Urls.contactDetails(prisonerNumber, contactId, existingRelationship?.prisonerContactId ?? prisonerContactId),
      )
    }
  }
}
