import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import PrisonerAddressService from '../../../../../services/prisonerAddressService'
import { CreateContactAddressParam } from '../common/utils'

export default class CreateContactUsePrisonerAddressController implements PageHandler {
  constructor(private readonly prisonerAddressService: PrisonerAddressService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_USE_PRISONER_ADDRESS_PAGE

  GET = async (
    req: Request<CreateContactAddressParam, unknown, unknown, { returnUrl: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const { user } = res.locals
    const addressForm = req.session.addContactJourneys![journeyId]!.newAddress!
    addressForm.addressLines =
      (await this.prisonerAddressService.getPrimaryAddress(prisonerNumber, user)) ?? addressForm.addressLines
    res.redirect(req.query.returnUrl)
  }
}
