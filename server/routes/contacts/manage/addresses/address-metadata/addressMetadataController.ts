import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { AddressMetadataSchema } from './addressMetadataSchemas'
import { Navigation } from '../../../common/navigation'
import YesOrNo = journeys.YesOrNo

export default class AddressMetadataController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_METADATA_PAGE

  GET = async (
    req: Request<{
      journeyId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys[journeyId]

    let typeLabel
    if (journey.addressType !== 'DO_NOT_KNOW') {
      typeLabel = await this.referenceDataService
        .getReferenceDescriptionForCode(ReferenceCodeType.ADDRESS_TYPE, journey.addressType, user)
        .then(code => code?.toLowerCase())
    }
    typeLabel = typeLabel ?? 'address'
    const navigation: Navigation = {
      backLink: `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/enter-address/${journeyId}`,
    }
    const viewModel = {
      journey,
      navigation,
      typeLabel,
      fromMonth: res.locals?.formResponses?.fromMonth ?? journey.addressMetadata?.fromMonth,
      fromYear: res.locals?.formResponses?.fromYear ?? journey.addressMetadata?.fromYear,
      toMonth: res.locals?.formResponses?.toMonth ?? journey.addressMetadata?.toMonth,
      toYear: res.locals?.formResponses?.toYear ?? journey.addressMetadata?.toYear,
      primaryAddress: res.locals?.formResponses?.primaryAddress ?? journey.addressMetadata?.primaryAddress,
      mailAddress: res.locals?.formResponses?.mailAddress ?? journey.addressMetadata?.mailAddress,
      comments: res.locals?.formResponses?.comments ?? journey.addressMetadata?.comments,
    }
    res.render('pages/contacts/manage/address/addressMetadata', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
      },
      unknown,
      AddressMetadataSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addressJourneys[journeyId]
    const form: AddressMetadataSchema = req.body
    journey.addressMetadata = {
      fromMonth: form.fromMonth,
      fromYear: form.fromYear,
      toMonth: form.toMonth,
      toYear: form.toYear,
      primaryAddress: form.primaryAddress as YesOrNo,
      mailAddress: form.mailAddress as YesOrNo,
      comments: form.comments,
    }
    res.redirect(
      `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/check-answers/${journeyId}`,
    )
  }
}
