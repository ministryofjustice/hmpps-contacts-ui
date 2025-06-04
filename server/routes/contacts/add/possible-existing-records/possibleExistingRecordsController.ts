import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'
import { ContactsService } from '../../../../services'
import { ContactSearchRequest, ContactSearchResultItem } from '../../../../@types/contactsApiClient'
import { formatDateForApi } from '../../../../utils/utils'

export default class PossibleExistingRecordsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.ADD_CONTACT_POSSIBLE_EXISTING_RECORDS_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  private TABLE_ROW_COUNT = 100

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const nextUrl = nextPageForAddContactJourney(this.PAGE_NAME, journey, user)
    let matches: ContactSearchResultItem[] = []
    if (journey.possibleExistingRecords) {
      matches = journey.possibleExistingRecords
    } else if (journey.dateOfBirth?.isKnown === 'YES') {
      const contactSearchRequest: ContactSearchRequest = {
        lastName: journey.names?.lastName,
        firstName: journey.names?.firstName,
        dateOfBirth: formatDateForApi(journey.dateOfBirth),
      }
      const result = await this.contactsService.searchContact(
        contactSearchRequest,
        {
          page: 0,
          size: this.TABLE_ROW_COUNT,
          sort: 'lastName,asc',
        },
        user,
      )
      matches = result.content as ContactSearchResultItem[]
    }
    journey.possibleExistingRecords = matches

    if (matches.length > 0) {
      const viewModel = {
        journey,
        navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
        nextUrl,
        matches,
      }
      res.render('pages/contacts/add/possibleExistingRecords', viewModel)
    } else {
      res.redirect(nextUrl)
    }
  }
}
