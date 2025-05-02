import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { OptionalEmailsSchemaType } from '../../manage/email/emailSchemas'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddContactAddEmailsController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_ADD_EMAIL_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const existingEmails = journey.emailAddresses ?? []
    if (existingEmails.length === 0) {
      existingEmails.push({ emailAddress: '' })
    }
    const viewModel = {
      isNewContact: true,
      names: journey.names,
      emails: res.locals?.formResponses?.['emails'] ?? existingEmails,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/manage/contactMethods/addEmails', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, OptionalEmailsSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals

    const { emails, save, add, remove } = req.body
    if (save !== undefined) {
      journey.emailAddresses = emails
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
    }

    req.body.emails ??= [{ emailAddress: '' }]
    if (add !== undefined) {
      req.body.emails.push({ emailAddress: '' })
    } else if (remove !== undefined) {
      req.body.emails.splice(Number(remove), 1)
    }

    // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
    // possibility if JS is disabled after a page load or the user somehow removes all identities.
    req.flash('formResponses', JSON.stringify(req.body))
    return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/emails/${journeyId}`)
  }
}
