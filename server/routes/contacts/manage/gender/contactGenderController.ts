import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageGenderController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_GENDER_PAGE

  GET = async (req: Request<PrisonerJourneyParams & { contactId: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { user, journey } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)

    const genderOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.GENDER, user)
      .then(val => this.getSelectedGenderOptions(val, contact.gender))
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    return res.render('pages/contacts/manage/contactDetails/manageGender', {
      contact,
      genderOptions,
      navigation,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      gender: req.body.gender || null,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(journey.returnPoint.url)
  }

  private getSelectedGenderOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    text: string
    value: string
    checked?: boolean
  }> {
    const mappedOptions = options.map((gender: ReferenceCode) => {
      return {
        text: gender.description,
        value: gender.code,
        checked: gender.code === selected,
      }
    })
    return mappedOptions
  }
}
