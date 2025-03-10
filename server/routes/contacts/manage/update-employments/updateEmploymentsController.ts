import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { employmentSorter } from '../../../../utils/sorters'
import { ContactsService } from '../../../../services'
import PatchEmploymentsRequest = contactsApiClientTypes.PatchEmploymentsRequest
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'

export default class UpdateEmploymentsController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE

  GET = async (req: Request<PrisonerJourneyParams & { contactId: string }>, res: Response) => {
    const { prisonerNumber, contactId, journeyId } = req.params
    const { contactNames, employments, returnPoint } = req.session.updateEmploymentsJourneys![journeyId]!
    employments.sort(employmentSorter)
    res.render('pages/contacts/manage/updateEmployments/index', {
      prisonerNumber,
      contactId,
      journeyId,
      contactNames,
      employments,
      returnPoint,
    })
  }

  POST = async (req: Request<PrisonerJourneyParams & { contactId: string }>, res: Response) => {
    const { journeyId, contactId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    const request: PatchEmploymentsRequest = {
      createEmployments: journey.employments
        .filter(details => !details.employmentId)
        .map(({ employer, isActive }) => ({ organisationId: employer.organisationId, isActive })),
      updateEmployments: journey.employments
        .filter(details => details.employmentId)
        .map(({ employmentId, employer, isActive }) => ({
          employmentId,
          organisationId: employer.organisationId,
          isActive,
        })),
      deleteEmployments: journey.employmentIdsToDelete ?? [],
      requestedBy: res.locals.user.username,
    }

    await this.contactService.patchEmployments(Number(contactId), request, res.locals.user)
    req.flash(
      FLASH_KEY__SUCCESS_BANNER,
      `You’ve updated the professional information for ${formatNameFirstNameFirst(journey.contactNames)}.`,
    )
    delete req.session.updateEmploymentsJourneys![journeyId]

    res.redirect(journey.returnPoint.url)
  }
}
