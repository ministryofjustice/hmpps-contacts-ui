import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { employmentSorter } from '../../../../utils/sorters'
import { ContactsService } from '../../../../services'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { Navigation } from '../../common/navigation'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import { PatchEmploymentsRequest } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'
import Urls from '../../../urls'

export default class UpdateEmploymentsController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; journeyId: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ) => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { contactNames, employments } = req.session.updateEmploymentsJourneys![journeyId]!
    employments.sort(employmentSorter)

    // clear search term whenever user comes back to this page
    req.session.updateEmploymentsJourneys![journeyId]!.organisationSearch = { page: 1 }
    const contactDetailsUrl = Urls.contactDetails(prisonerNumber, contactId, prisonerContactId)
    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: contactDetailsUrl,
      cancelButton: contactDetailsUrl,
    }
    res.render('pages/contacts/manage/employments/index', {
      updateEmploymentBaseLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/update-employments/`,
      journeyId,
      contactNames,
      employments,
      navigation,
      hasExistingEmployment: employments.find(employment => employment.employmentId),
    })
  }

  POST = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ) => {
    const { journeyId, contactId, prisonerNumber, prisonerContactId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    const request: PatchEmploymentsRequest = {
      createEmployments: journey.employments
        .filter(details => !details.employmentId)
        .map(({ employer, isActive }) => ({ organisationId: employer.organisationId, isActive: isActive ?? false })),
      updateEmployments: journey.employments
        .filter(details => details.employmentId)
        .map(({ employmentId, employer, isActive }) => ({
          employmentId: employmentId!,
          organisationId: employer.organisationId,
          isActive: isActive ?? false,
        })),
      deleteEmployments: journey.employmentIdsToDelete ?? [],
    }

    await this.contactService.patchEmployments(Number(contactId), request, res.locals.user, req.id)
    req.flash(
      FLASH_KEY__SUCCESS_BANNER,
      `You’ve updated the professional information for ${formatNameFirstNameFirst(journey.contactNames)}.`,
    )
    delete req.session.updateEmploymentsJourneys![journeyId]

    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
