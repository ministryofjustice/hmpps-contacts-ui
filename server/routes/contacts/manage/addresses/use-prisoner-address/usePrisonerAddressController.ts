import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import PrisonerAddressService from '../../../../../services/prisonerAddressService'
import Permission from '../../../../../enumeration/permission'

export default class UsePrisonerAddressController implements PageHandler {
  constructor(private readonly prisonerAddressService: PrisonerAddressService) {}

  public PAGE_NAME = Page.USE_PRISONER_ADDRESS_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ journeyId: string; prisonerNumber: string }, unknown, unknown, { returnUrl: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!
    journey.addressLines =
      (await this.prisonerAddressService.getPrimaryAddress(prisonerNumber, user)) ?? journey.addressLines
    res.redirect(req.query.returnUrl)
  }
}
