import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { AddressMetadataSchema } from './addressMetadataSchemas'
import { Navigation } from '../../../common/navigation'
import ContactsService from '../../../../../services/contactsService'
import YesOrNo = journeys.YesOrNo
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'

export default class AddressMetadataController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactsService: ContactsService,
  ) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_METADATA_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!

    let typeLabel
    if (journey.addressType !== 'DO_NOT_KNOW') {
      typeLabel = await this.referenceDataService
        .getReferenceDescriptionForCode(ReferenceCodeType.ADDRESS_TYPE, journey.addressType!, user)
        .then(code => code?.toLowerCase())
    }
    typeLabel = typeLabel ?? 'address'
    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    }
    let fromMonth = res.locals?.formResponses?.['fromMonth'] ?? journey.addressMetadata?.fromMonth
    let fromYear = res.locals?.formResponses?.['fromYear'] ?? journey.addressMetadata?.fromYear
    if (!res.locals.formResponses && !fromMonth && !fromYear) {
      const today = new Date()
      fromMonth = String(today.getMonth() + 1)
      fromYear = String(today.getFullYear())
    }

    const formattedAddress = {
      flat: journey.addressLines!.flat,
      premise: journey.addressLines!.premises,
      street: journey.addressLines!.street,
      area: journey.addressLines!.locality,
      city: await this.getReferenceCodeDescriptionIfSet(journey.addressLines!.town, ReferenceCodeType.CITY, user),
      county: await this.getReferenceCodeDescriptionIfSet(journey.addressLines!.county, ReferenceCodeType.COUNTY, user),
      postalCode: journey.addressLines!.postcode,
      country: await this.getReferenceCodeDescriptionIfSet(
        journey.addressLines!.country,
        ReferenceCodeType.COUNTRY,
        user,
      ),
    }

    const viewModel = {
      journey,
      navigation,
      typeLabel,
      fromMonth,
      fromYear,
      formattedAddress,
      continueButtonLabel: journey.mode === 'ADD' ? 'Continue' : 'Confirm and save',
      toMonth: res.locals?.formResponses?.['toMonth'] ?? journey.addressMetadata?.toMonth,
      toYear: res.locals?.formResponses?.['toYear'] ?? journey.addressMetadata?.toYear,
      primaryAddress: res.locals?.formResponses?.['primaryAddress'] ?? journey.addressMetadata?.primaryAddress,
      mailAddress: res.locals?.formResponses?.['mailAddress'] ?? journey.addressMetadata?.mailAddress,
      comments: res.locals?.formResponses?.['comments'] ?? journey.addressMetadata?.comments,
    }
    res.render('pages/contacts/manage/address/addressMetadata', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        journeyId: string
      },
      unknown,
      AddressMetadataSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!
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
    if (journey.mode === 'ADD') {
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`,
      )
    } else if (journey.mode === 'EDIT') {
      await this.contactsService
        .updateContactAddress(journey, user)
        .then(_ => delete req.session.addressJourneys![journeyId])
        .then(_ => req.flash(FLASH_KEY__SUCCESS_BANNER, 'You’ve updated a contact address'))
      await this.contactsService
        .getContact(Number(contactId), user)
        .then(response =>
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
          ),
        )
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    }
  }

  private async getReferenceCodeDescriptionIfSet(
    code: string | undefined,
    type: ReferenceCodeType,
    user: Express.User,
  ): Promise<string | undefined> {
    if (!code) {
      return Promise.resolve(undefined)
    }
    return this.referenceDataService.getReferenceDescriptionForCode(type, code, user)
  }
}
