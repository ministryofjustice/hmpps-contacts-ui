import { NextFunction, Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import { Page } from '../../../../services/auditService'
import logger from '../../../../../logger'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { employmentSorter } from '../../../../utils/sorters'

export default class UpdateEmploymentsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE

  START = async (
    req: Request<{ contactId: string; prisonerNumber: string }, unknown, unknown, { returnUrl: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { prisonerNumber, contactId } = req.params
    const contact = await this.contactsService.getContact(Number(req.params.contactId), res.locals.user)
    req.journey!.updateEmployments = {
      prisoner: res.locals.prisonerDetails!,
      contactId: contact.id,
      contactNames: {
        title: contact.title,
        lastName: contact.lastName,
        firstName: contact.firstName,
        middleNames: contact.middleNames,
      },
      employments: contact.employments,
      returnPoint: { url: req.query.returnUrl },
    }
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${req.journey!.journeyId}`,
    )
  }

  ensureInJourney = async (req: Request<PrisonerJourneyParams>, res: Response, next: NextFunction) => {
    const { journeyId } = req.params
    if (!req.journey?.updateEmployments) {
      logger.warn(
        `Update employments journey (${journeyId}) not found for user ${res.locals.user?.username}. Rendering not found.`,
      )
      return res.render('pages/errors/notFound')
    }
    res.locals.prisonerDetails = req.journey!.updateEmployments!.prisoner
    return next()
  }

  GET = async (req: Request, res: Response) => {
    const { contactNames, employments, returnPoint } = req.journey!.updateEmployments!
    res.render('pages/contacts/manage/updateEmployments/index', {
      contactNames,
      employments: employments.sort(employmentSorter),
      returnPoint,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { returnPoint } = req.journey!.updateEmployments!
    res.redirect(returnPoint.url)
  }
}
