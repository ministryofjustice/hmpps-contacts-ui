import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { PrisonerSearchService, ContactsService } from '../../../../services'
import logger from '../../../../../logger'
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

export default class ListContactsController implements PageHandler {
  constructor(
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly contactsService: ContactsService,
  ) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.query
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]

    const prisonerDetails = await this.prisonerSearchService.getByPrisonerNumber(prisoner as string, user)

    journey.prisoner = {
      firstName: prisonerDetails?.firstName,
      lastName: prisonerDetails?.lastName,
      prisonerNumber: prisonerDetails?.prisonerNumber,
      dateOfBirth: prisonerDetails?.dateOfBirth,
      prisonId: prisonerDetails?.prisonId,
      prisonName: prisonerDetails?.prisonName,
    }

    const activeContacts = await this.contactsService.getPrisonerContacts(prisoner as string, true, user)
    const inactiveContacts = await this.contactsService.getPrisonerContacts(prisoner as string, false, user)

    // const activeContacts: PrisonerContactSummary = [
    //   {
    //     prisonerContactId: 100,
    //     contactId: 200,
    //     prisonerNumber: 'G9381UV',
    //     surname: 'Adams',
    //     forename: 'Claire',
    //     middleName: '',
    //     dateOfBirth: new Date('1973-01-10'),
    //     relationshipCode: 'code here',
    //     relationshipDescription: 'Friend',
    //     flat: '1',
    //     property: 'Proeprty',
    //     street: '123 High Street',
    //     area: 'Mayfair',
    //     cityCode: 'London',
    //     countyCode: 'county code here',
    //     postCode: 'W1 1AA',
    //     countryCode: 'England',
    //     approvedVisitor: true,
    //     nextOfKin: true,
    //     emergencyContact: true,
    //     awareOfCharges: true,
    //     comments: 'comments here',
    //   },
    //   {
    //     prisonerContactId: 100,
    //     contactId: 200,
    //     prisonerNumber: 'G9381UV',
    //     surname: 'Smith',
    //     forename: 'Julia',
    //     middleName: '',
    //     dateOfBirth: new Date('1963-03-15'),
    //     relationshipCode: 'code here',
    //     relationshipDescription: 'Friend',
    //     flat: '1',
    //     property: 'Proeprty',
    //     street: '123 High Street',
    //     area: 'Mayfair',
    //     cityCode: 'London',
    //     countyCode: 'county code here',
    //     postCode: 'W1 1AA',
    //     countryCode: 'England',
    //     approvedVisitor: true,
    //     nextOfKin: true,
    //     emergencyContact: true,
    //     awareOfCharges: true,
    //     comments: 'comments here',
    //   },
    // ]

    // const inactiveContacts: PrisonerContactSummary = [
    //   {
    //     prisonerContactId: 100,
    //     contactId: 200,
    //     prisonerNumber: 'G9381UV',
    //     surname: 'Bloggs',
    //     forename: 'Joseph',
    //     middleName: '',
    //     dateOfBirth: new Date('1950-02-15'),
    //     relationshipCode: 'code here',
    //     relationshipDescription: 'Cousin',
    //     flat: 'FLAT 1',
    //     property: 'Proeprty',
    //     street: '123 High Street',
    //     area: 'Mayfair',
    //     cityCode: 'London',
    //     countyCode: 'county code here',
    //     postCode: 'W1 1AA',
    //     countryCode: 'England',
    //     approvedVisitor: false,
    //     nextOfKin: false,
    //     emergencyContact: false,
    //     awareOfCharges: true,
    //     comments: 'comments here',
    //   },
    //   {
    //     prisonerContactId: 100,
    //     contactId: 200,
    //     prisonerNumber: 'G9381UV',
    //     surname: 'Townsend',
    //     forename: 'Arthur',
    //     middleName: '',
    //     dateOfBirth: new Date('1900-12-15'),
    //     relationshipCode: 'code here',
    //     relationshipDescription: 'Cousin',
    //     flat: 'FLAT 1',
    //     property: 'Proeprty',
    //     street: '123 High Street',
    //     area: 'Mayfair',
    //     cityCode: 'London',
    //     countyCode: 'county code here',
    //     postCode: 'W1 1AA',
    //     countryCode: 'England',
    //     approvedVisitor: true,
    //     nextOfKin: true,
    //     emergencyContact: true,
    //     awareOfCharges: true,
    //     comments: 'comments here',
    //   },
    // ]

    logger.info(`List contacts journey ${JSON.stringify(journey)}`)

    logger.info(`Active contacts ${JSON.stringify(activeContacts)}`)
    logger.info(`Inactive contacts ${JSON.stringify(inactiveContacts)}`)

    res.render('pages/contacts/manage/listContacts', {
      activeContacts,
      inactiveContacts,
      prisonerDetails,
      journey,
    })
  }
}
