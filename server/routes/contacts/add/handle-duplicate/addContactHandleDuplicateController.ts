import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../services/referenceDataService'
import { ContactsService } from '../../../../services'
import Urls from '../../../urls'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import Permission from '../../../../enumeration/permission'
import { HandleDuplicateRelationshipSchema } from '../../common/relationship/handleDuplicateRelationshipSchemas'
import { navigationForAddContactJourney } from '../addContactFlowControl'

export default class AddContactHandleDuplicateController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ADD_CONTACT_HANDLE_DUPLICATE_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<{ prisonerNumber: string; journeyId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    const groupCodeForRelationshipType =
      journey.relationship!.relationshipType === 'S'
        ? ReferenceCodeType.SOCIAL_RELATIONSHIP
        : ReferenceCodeType.OFFICIAL_RELATIONSHIP
    const relationshipTypeDescription = await this.referenceDataService.getReferenceDescriptionForCode(
      groupCodeForRelationshipType,
      journey.relationship!.relationshipToPrisoner!,
      user,
    )
    const existingRelationships = await this.contactsService.getAllSummariesForPrisonerAndContact(
      prisonerNumber,
      journey.contactId!,
      user,
    )

    const viewModel = {
      isNewContact: true,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
      relationshipTypeDescription,
      journey,
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
        journeyId: string
      },
      unknown,
      HandleDuplicateRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, journeyId } = req.params
    const { duplicateAction } = req.body

    const journey = req.session.addContactJourneys![journeyId]!
    const contactId = journey.contactId!
    if (duplicateAction === 'GO_TO_CONTACT_LIST') {
      delete req.session.addContactJourneys![journeyId]
      res.redirect(Urls.contactList(prisonerNumber))
    } else {
      delete req.session.addContactJourneys![journeyId]
      const existingRelationships = await this.contactsService.getAllSummariesForPrisonerAndContact(
        prisonerNumber,
        contactId,
        user,
      )
      const existingRelationship = existingRelationships.find(
        relationship => relationship.relationshipToPrisonerCode === journey.relationship!.relationshipToPrisoner,
      )!
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, existingRelationship.prisonerContactId))
    }
  }
}
