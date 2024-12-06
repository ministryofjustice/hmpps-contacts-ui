import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressTypeSchema } from './addressTypeSchemas'
import ReferenceCode = contactsApiClientTypes.ReferenceCode

export default class AddressTypeController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_TYPE_PAGE

  GET = async (
    req: Request<{
      journeyId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys[journeyId]

    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.type ?? journey.addressType))

    const navigation: Navigation = {
      backLink: journey.returnPoint.url,
    }
    const viewModel = {
      journey,
      typeOptions,
      navigation,
    }
    res.render('pages/contacts/manage/address/addressType', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
      },
      unknown,
      AddressTypeSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addressJourneys[journeyId]
    const { addressType } = req.body
    journey.addressType = addressType
    res.redirect(
      `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/enter-address/${journeyId}`,
    )
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    return options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        checked: referenceCode.code === selected,
      }
    })
  }
}
