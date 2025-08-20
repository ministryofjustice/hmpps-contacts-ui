import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import captionForAddContactJourney from '../addContactsUtils'
import Urls from '../../../urls'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class CancelAddContactController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_CANCEL_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const navigation = navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions)
    const caption = captionForAddContactJourney(journey)
    let title: string
    let showPrisonerAndContact: boolean
    if (journey.mode === 'NEW') {
      title = `Are you sure you want to cancel adding ${formatNameFirstNameFirst(journey.names!)} as a contact?`
      showPrisonerAndContact = false
    } else {
      title = 'Are you sure you want to cancel linking the prisoner and the contact?'
      showPrisonerAndContact = true
    }
    return res.render('pages/contacts/add/cancel', {
      journey,
      navigation,
      caption,
      title,
      showPrisonerAndContact,
    })
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, { action: 'YES' | 'NO' }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const { action } = req.body
    const { prisonerPermissions } = res.locals
    if (action === 'YES') {
      delete req.session.addContactJourneys![journeyId]
      res.redirect(Urls.contactList(prisonerNumber))
    } else {
      const journey = req.session.addContactJourneys![journeyId]!
      const navigation = navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions)
      res.redirect(navigation.backLink!)
    }
  }
}
