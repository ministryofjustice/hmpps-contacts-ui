import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import PrisonerAddressService from '../../../../../services/prisonerAddressService'

export default class UsePrisonerAddressController implements PageHandler {
  constructor(private readonly prisonerAddressService: PrisonerAddressService) {}

  public PAGE_NAME = Page.USE_PRISONER_ADDRESS_PAGE

  private DEFAULT_COUNTRY = 'ENG'

  GET = async (
    req: Request<{ journeyId: string; prisonerNumber: string }, unknown, unknown, { returnUrl: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!
    await this.prisonerAddressService.getPrimaryAddress(prisonerNumber, user).then(primaryAddress => {
      if (primaryAddress) {
        journey.addressLines = {
          noFixedAddress: primaryAddress.noFixedAddress,
          flat: primaryAddress.flat,
          property: primaryAddress.premise,
          street: primaryAddress.street,
          area: primaryAddress.locality,
          cityCode: primaryAddress.townCode,
          countyCode: primaryAddress.countyCode,
          postcode: primaryAddress.postalCode,
          countryCode: primaryAddress.countryCode ?? this.DEFAULT_COUNTRY,
        }
      }
    })

    res.redirect(req.query.returnUrl)
  }
}
