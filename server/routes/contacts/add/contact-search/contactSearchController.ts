import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactSearchSchemaType } from './contactSearchSchema'
import { ContactsService } from '../../../../services'
import { formatDateForApi } from '../../../../utils/utils'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'
import {
  AdvancedContactSearchRequest,
  ContactIdPartialSearchRequest,
  PagedModelContactSearchResultItem,
} from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'
import { ContactNames } from '../../../../@types/journeys'
import { NAME_REGEX } from '../../common/name/nameSchemas'

export default class ContactSearchController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_SEARCH_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  private TABLE_ROW_COUNT = 10

  GET = async (
    req: Request<{ journeyId: string }, unknown, unknown, { clear?: string; page?: string; sort?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { user, prisonerPermissions } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!

    delete journey.isContactMatched
    if (journey.searchContact) {
      const { clear, sort, page } = req.query

      if (clear === 'filter') {
        delete journey.searchContact.dateOfBirth
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}#`)
      }
      if (sort) {
        journey.searchContact.sort = sort
        journey.searchContact.page = 1
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}#pagination`)
      }
      if (page) {
        const pageNumber = Number(page)
        journey.searchContact.page = Number.isNaN(pageNumber) ? 1 : pageNumber
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}#pagination`)
      }
    }

    const { day, month, year } = journey?.searchContact?.dateOfBirth ?? {}
    const hasDob = !!(day && month && year)
    const dobError =
      !!res.locals.validationErrors &&
      (Boolean(res.locals?.formResponses?.['day']) ||
        Boolean(res.locals?.formResponses?.['month']) ||
        Boolean(res.locals?.formResponses?.['year']))

    let results: PagedModelContactSearchResultItem | undefined
    const searchingContactId = this.trim(journey.searchContact?.contactId)
    if (journey.searchContact && searchingContactId) {
      // Contact ID search takes precedence and ignores other fields
      const dateOfBirth = formatDateForApi(journey.searchContact.dateOfBirth)
      const contactSearchRequest: ContactIdPartialSearchRequest = {
        contactId: searchingContactId,
        dateOfBirth,
        includeAnyExistingRelationshipsToPrisoner: journey.prisonerNumber,
      }
      results = await this.contactsService.partialContactIdSearch(
        contactSearchRequest,
        {
          page: (journey.searchContact.page ?? 1) - 1,
          size: this.TABLE_ROW_COUNT,
          sort: journey.searchContact.sort ?? 'lastName,asc',
        },
        user,
      )
      setPaginationLocals(
        res,
        this.TABLE_ROW_COUNT,
        journey.searchContact.page ?? 1,
        results?.page?.totalElements ?? 0,
        results?.content?.length ?? 0,
      )
    } else if (journey.searchContact?.contact && this.namesAreValid(journey.searchContact.contact) && !dobError) {
      // Advanced name search (only when names are valid and no DOB validation errors)
      const contactSearchRequest: AdvancedContactSearchRequest = {
        lastName: journey.searchContact.contact.lastName!,
        firstName: journey.searchContact.contact.firstName,
        middleNames: journey.searchContact.contact.middleNames,
        dateOfBirth: formatDateForApi(journey.searchContact.dateOfBirth),
        includeAnyExistingRelationshipsToPrisoner: journey.prisonerNumber,
        soundsLike: journey.searchContact.soundsLike,
      }

      results = await this.contactsService.advancedSearchContact(
        contactSearchRequest,
        {
          page: (journey.searchContact.page ?? 1) - 1,
          size: this.TABLE_ROW_COUNT,
          sort: journey.searchContact.sort ?? 'lastName,asc',
        },
        user,
      )
      setPaginationLocals(
        res,
        this.TABLE_ROW_COUNT,
        journey.searchContact.page ?? 1,
        results?.page?.totalElements ?? 0,
        results?.content?.length ?? 0,
      )
    }

    const view = {
      lastName: res.locals?.formResponses?.['lastName'] ?? journey?.searchContact?.contact?.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? journey?.searchContact?.contact?.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? journey?.searchContact?.contact?.middleNames,
      soundsLike: res.locals?.formResponses?.['soundsLike'] ?? journey?.searchContact?.soundsLike,
      contactId: res.locals?.formResponses?.['contactId'] ?? journey?.searchContact?.contactId,
      day: res.locals?.formResponses?.['day'] ?? day,
      month: res.locals?.formResponses?.['month'] ?? month,
      year: res.locals?.formResponses?.['year'] ?? year,
      filter: dobError ? 'Filter cannot be applied' : hasDob && `${day}/${month}/${year}`,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
      sort: journey.searchContact?.sort,
      journey,
      results,
      dobError,
    }
    return res.render('pages/contacts/manage/contactSearch', view)
  }

  POST = async (req: Request<{ journeyId: string }, ContactSearchSchemaType>, res: Response): Promise<void> => {
    const { lastName, firstName, middleNames, day, month, year, soundsLike, contactId } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    const contactIdTrim = this.trim(contactId)

    const soundsLikeFlag = Boolean(soundsLike)

    if (contactIdTrim) {
      // If contactId provided
      journey.searchContact = {
        contactId: contactIdTrim,
        page: 1,
      }
    } else {
      journey.searchContact = {
        contact: {
          lastName,
          middleNames: middleNames || undefined,
          firstName: firstName || undefined,
        },
        contactId: undefined,
        soundsLike: soundsLikeFlag,
        page: 1,
      }
    }

    if (day && month && year) {
      journey.searchContact.dateOfBirth = { day, month, year }
      journey.searchContact.page = 1
      delete journey.searchContact.sort
    }

    res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}#`)
  }

  private namesAreValid(contact: Partial<ContactNames>): boolean {
    // last name is required
    if (!contact.lastName || !this.isValidName(contact.lastName)) {
      return false
    }
    if (contact.middleNames?.length && !this.isValidName(contact.middleNames)) {
      return false
    }
    if (contact.firstName?.length && !this.isValidName(contact.firstName)) {
      return false
    }
    return true
  }

  private isValidName(name: string): boolean {
    return NAME_REGEX.test(name)
  }

  private trim(value?: string): string | undefined {
    return value?.trim()
  }
}
