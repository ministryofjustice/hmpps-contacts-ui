import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import Urls from '../../urls'
import { Navigation } from '../../contacts/common/navigation'
import Permission from '../../../enumeration/permission'

export default class CancelAddRestrictionController implements PageHandler {
  public PAGE_NAME = Page.CANCEL_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_RESTRICTIONS

  GET = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: string
      },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const journey = req.session.addRestrictionJourneys![journeyId]!
    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
    }
    return res.render('pages/contacts/restrictions/cancel', {
      journey,
      navigation,
    })
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: string
      },
      unknown,
      { action: 'YES' | 'NO' }
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { action } = req.body
    if (action === 'YES') {
      delete req.session.addRestrictionJourneys![journeyId]
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } else {
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
      )
    }
  }
}
