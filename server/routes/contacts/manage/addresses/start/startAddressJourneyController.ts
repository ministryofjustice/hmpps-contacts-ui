import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { NotFound } from 'http-errors'
import { parseISO } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ContactsService from '../../../../../services/contactsService'
import ReturnPoint = journeys.ReturnPoint
import ContactNames = journeys.ContactNames
import AddressJourney = journeys.AddressJourney
import AddressLines = journeys.AddressLines
import AddressMetadata = journeys.AddressMetadata
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

export default class StartAddressJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADDRESS_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        contactAddressId?: string
      },
      unknown,
      unknown,
      { returnUrl: string }
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, contactAddressId } = req.params
    const { returnUrl } = req.query
    const { user } = res.locals
    const returnPoint: ReturnPoint = { url: returnUrl }
    const contact = await this.contactService.getContact(Number(contactId), user)
    const contactNames: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const mode = contactAddressId ? 'EDIT' : 'ADD'
    const contactAddressIdNumber = Number(contactAddressId)
    let addressType: string
    let addressLines: AddressLines
    let addressMetadata: AddressMetadata
    if (mode === 'EDIT') {
      const existingAddress = contact.addresses.find(
        (address: ContactAddressDetails) => address.contactAddressId === contactAddressIdNumber,
      )
      if (!existingAddress) {
        throw new NotFound()
      }
      addressType = existingAddress.addressType ?? 'DO_NOT_KNOW'
      addressLines = {
        noFixedAddress: existingAddress.noFixedAddress,
        flat: existingAddress.flat,
        premises: existingAddress.property,
        street: existingAddress.street,
        locality: existingAddress.area,
        town: existingAddress.cityCode,
        county: existingAddress.countyCode,
        postcode: existingAddress.postcode,
        country: existingAddress.countryCode,
      }
      const fromDate = parseISO(existingAddress.startDate)
      const toDate = existingAddress.endDate ? parseISO(existingAddress.endDate) : undefined

      addressMetadata = {
        fromMonth: (fromDate.getMonth() + 1).toString(),
        fromYear: fromDate.getFullYear().toString(),
        toMonth: toDate ? (toDate.getMonth() + 1).toString() : undefined,
        toYear: toDate?.getFullYear()?.toString(),
        primaryAddress: existingAddress.primaryAddress ? 'YES' : 'NO',
        mailAddress: existingAddress.mailFlag ? 'YES' : 'NO',
        comments: existingAddress.comments,
      }
    }
    const journey: AddressJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      returnPoint,
      prisonerNumber,
      contactId: Number(contactId),
      contactAddressId: contactAddressIdNumber,
      isCheckingAnswers: false,
      mode,
      contactNames,
      addressType,
      addressLines,
      addressMetadata,
    }
    if (!req.session.addressJourneys) {
      req.session.addressJourneys = {}
    }
    req.session.addressJourneys[journey.id] = journey
    if (Object.entries(req.session.addressJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.addressJourneys)
        .sort(
          (a: AddressJourney, b: AddressJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.addressJourneys[journeyToRemove.id])
    }
    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journey.id}`)
  }
}
