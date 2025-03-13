import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import Urls from '../../../../urls'
import { Navigation } from '../../../common/navigation'
import { getAddressJourneyAndUrl } from '../common/utils'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class CancelAddAddressController implements PageHandler {
  public PAGE_NAME = Page.CANCEL_ADD_ADDRESS_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journey, addressUrl } = getAddressJourneyAndUrl(req)
    const navigation: Navigation = {
      backLink: addressUrl({ subPath: 'check-answers' }),
    }
    return res.render('pages/contacts/manage/contactMethods/address/cancel', {
      contact: journey.contactNames,
      navigation,
    })
  }

  POST = async (
    req: Request<
      PrisonerJourneyParams & { contactId: string; prisonerContactId: string },
      unknown,
      { action: 'YES' | 'NO' }
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { addressUrl } = getAddressJourneyAndUrl(req)
    const { action } = req.body
    if (action === 'YES') {
      delete req.session.addressJourneys![journeyId]
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } else {
      res.redirect(addressUrl({ subPath: 'check-answers' }))
    }
  }
}
