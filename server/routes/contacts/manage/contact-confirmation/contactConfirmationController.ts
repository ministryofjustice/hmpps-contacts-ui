import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import ContactsService from '../../../../services/contactsService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'

export default class ContactConfirmationController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { contactId } = req.query
    const { prisonerDetails } = res.locals
    const journey = req.session.addContactJourneys[journeyId]

    if (journey.isContactConfirmed === 'YES') {
      return res.redirect(
        `/prisoner/${journey.prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=${contactId}`,
      )
    }
    if (journey.isContactConfirmed === 'NO') {
      journey.isContactConfirmed = undefined
      return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
    }

    return res.render('pages/contacts/manage/contactConfirmation/confirmation', { prisonerDetails, journey })
  }

  POST = async (req: Request<{ journeyId: string }, IsContactConfirmedSchema>, res: Response): Promise<void> => {
    const { isContactConfirmed } = req.body
    const { journeyId } = req.params
    const { contactId } = req.query
    const journey = req.session.addContactJourneys[journeyId]
    journey.isContactConfirmed = isContactConfirmed
    res.redirect(
      `/prisoner/${journey.prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=${contactId}`,
    )
  }
}
