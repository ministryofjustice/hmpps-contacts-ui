import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService } from '../../../../services'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import formatName from '../../../../utils/formatName'
import ReferenceDataService from '../../../../services/referenceDataService'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import { capitalizeFirstLetter } from '../../../../utils/utils'

export default class ContactConfirmationController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams, unknown, unknown, { contactId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const contact: ContactDetails = await this.contactsService.getContact(journey.contactId, user)
    const formattedFullName = await this.formattedFullName(contact, user)
    const formattedGender = await this.formattedGender(contact, user)
    const mostRelevantAddress = this.findMostRelevantAddress(contact)
    const mostRelevantAddressLabel = this.getLabelForAddress(mostRelevantAddress)

    return res.render('pages/contacts/manage/contactConfirmation/confirmation', {
      contact,
      formattedFullName,
      formattedGender,
      prisonerDetails,
      journey,
      mostRelevantAddress,
      mostRelevantAddressLabel,
      isContactConfirmed: res.locals?.formResponses?.isContactConfirmed ?? journey?.isContactConfirmed,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    })
  }

  POST = async (req: Request<{ journeyId: string }, IsContactConfirmedSchema>, res: Response): Promise<void> => {
    const { isContactConfirmed } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]

    if (isContactConfirmed === 'YES') {
      journey.isContactConfirmed = isContactConfirmed
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
    }
    journey.isContactConfirmed = undefined
    return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
  }

  private async formattedGender(contact: ContactDetails, user: Express.User) {
    let genderDescription: string
    if (contact.genderDescription) {
      genderDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.GENDER,
        contact.gender,
        user,
      )
    }
    return capitalizeFirstLetter(genderDescription)
  }

  private async formattedFullName(contact: ContactDetails, user: Express.User) {
    let titleDescription: string
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return formatName(contact, { customTitle: titleDescription })
  }

  private findMostRelevantAddress(contact: contactsApiClientTypes.ContactDetails) {
    const currentAddresses = contact.addresses?.filter((address: ContactAddressDetails) => !address.endDate)
    let mostRelevantAddress: ContactAddressDetails = currentAddresses?.find(
      (address: ContactAddressDetails) => address.primaryAddress,
    )
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.find((address: ContactAddressDetails) => address.mailFlag)
    }
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
        return (seed && seed.startDate > item.startDate) || !item.startDate ? seed : item
      }, null)
    }
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
        return seed && seed.createdTime > item.createdTime ? seed : item
      }, null)
    }
    return mostRelevantAddress
  }

  private getLabelForAddress(mostRelevantAddress: contactsApiClientTypes.ContactAddressDetails) {
    let mostRelevantAddressLabel
    if (mostRelevantAddress?.primaryAddress) {
      if (mostRelevantAddress?.mailFlag) {
        mostRelevantAddressLabel = 'Primary and mail'
      } else {
        mostRelevantAddressLabel = 'Primary'
      }
    } else if (mostRelevantAddress?.mailFlag) {
      mostRelevantAddressLabel = 'Mail'
    }
    return mostRelevantAddressLabel
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
