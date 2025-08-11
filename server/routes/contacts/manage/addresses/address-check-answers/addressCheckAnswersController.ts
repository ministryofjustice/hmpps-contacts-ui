import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { ContactsService } from '../../../../../services'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import { PrisonerJourneyParams } from '../../../../../@types/journeys'
import Permission from '../../../../../enumeration/permission'

export default class AddressCheckAnswersController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactsService: ContactsService,
  ) {}

  public PAGE_NAME = Page.ADDRESS_CHECK_ANSWERS_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey, addressUrl } = getAddressJourneyAndUrl(req)
    journey.isCheckingAnswers = true

    const navigation: Navigation = {
      backLinkLabel: 'Back to address comments',
      backLink: addressUrl({ subPath: 'comments' }),
      cancelButton: addressUrl({ subPath: 'cancel' }),
    }

    const phoneTypeDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )

    const viewModel = {
      ...req.params,
      navigation,
      contact: journey.contactNames,
      address: {
        ...journey,
        ...journey.addressMetadata,
        ...journey.addressLines,
        addressTypeDescription:
          journey.addressType &&
          (journey.addressType !== 'DO_NOT_KNOW'
            ? await this.referenceDataService.getReferenceDescriptionForCode(
                ReferenceCodeType.ADDRESS_TYPE,
                journey.addressType!,
                user,
              )
            : undefined),
        phoneNumbers: journey.phoneNumbers?.map(phone => ({
          phoneNumber: phone.phoneNumber,
          extNumber: phone.extension,
          phoneTypeDescription: phoneTypeDescriptions.get(phone.type),
        })),
      },
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
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
      .createContactAddress(journey, user, req.id)
      .then(_ => delete req.session.addressJourneys![journeyId])
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
