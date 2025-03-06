import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { formatDate } from '../../../../../utils/utils'
import { ContactsService } from '../../../../../services'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'

export default class AddressCheckAnswersController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactsService: ContactsService,
  ) {}

  public PAGE_NAME = Page.ADDRESS_CHECK_ANSWERS_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!
    journey.isCheckingAnswers = true

    let addressTypeDescription
    if (journey.addressType !== 'DO_NOT_KNOW') {
      addressTypeDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.ADDRESS_TYPE,
        journey.addressType!,
        user,
      )
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
    const formattedFromDate = formatDate(
      new Date(`${journey.addressMetadata!.fromYear}-${journey.addressMetadata!.fromMonth}-01Z`),
      'MMMM yyyy',
    )
    let formattedToDate
    if (journey.addressMetadata!.toMonth && journey.addressMetadata!.toYear) {
      formattedToDate = formatDate(
        new Date(`${journey.addressMetadata!.toYear}-${journey.addressMetadata!.toMonth}-01Z`),
        'MMMM yyyy',
      )
    }
    const typeLabel = addressTypeDescription?.toLowerCase() ?? 'address'
    const navigation: Navigation = {
      breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
      cancelButton: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      ...req.params,
      journey,
      navigation,
      addressTypeDescription,
      typeLabel,
      formattedAddress,
      formattedFromDate,
      formattedToDate,
    }
    res.render('pages/contacts/manage/contactMethods/address/addressCheckAnswers', viewModel)
  }

  POST = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      journeyId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!
    await this.contactsService
      .createContactAddress(journey, user)
      .then(_ => delete req.session.addressJourneys![journeyId])
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
