import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import logger from '../../../../../../logger'
import Permission from '../../../../../enumeration/permission'

export default class DeleteAddressPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.DELETE_ADDRESS_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      phoneIdx: string
      journeyId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { journey, addressUrl } = getAddressJourneyAndUrl(req)
    const { phoneIdx } = req.params
    const phone = journey.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(`Couldn't find phone at index ${phoneIdx} for the new address. URL probably entered manually.`)
      throw new NotFound()
    }
    const navigation: Navigation = {
      backLink: addressUrl({ subPath: 'check-answers' }),
      cancelButton: addressUrl({ subPath: 'check-answers' }),
    }
    const viewModel = {
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
      phone: {
        ...phone,
        extNumber: phone.extension,
        phoneTypeDescription:
          phone.type &&
          (await this.referenceDataService.getReferenceDescriptionForCode(
            ReferenceCodeType.PHONE_TYPE,
            phone.type,
            res.locals.user,
          )),
      },
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/confirmDeleteAddressPhone', viewModel)
  }

  POST = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      phoneIdx: string
      journeyId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { journey, addressUrl } = getAddressJourneyAndUrl(req)
    const { phoneIdx } = req.params

    const phone = journey.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(`Couldn't find phone at index ${phoneIdx} for the new address. URL probably entered manually.`)
      throw new NotFound()
    }

    journey.phoneNumbers = journey.phoneNumbers?.filter(itm => itm !== phone)
    if (journey.phoneNumbers?.length === 0) delete journey.phoneNumbers

    res.redirect(addressUrl({ subPath: 'check-answers' }))
  }
}
