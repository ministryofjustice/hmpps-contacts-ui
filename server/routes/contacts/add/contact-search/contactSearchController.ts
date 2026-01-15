import e, { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactSearchSchemaType } from './contactSearchSchema'
import { ContactsService } from '../../../../services'
import { formatDateForApi } from '../../../../utils/utils'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'
import {
  ContactSearchRequest,
  EnhancedContactSearchRequest,
  PagedModelContactSearchResultItem,
} from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'
import { AddContactJourney, ContactNames } from '../../../../@types/journeys'
import { NAME_REGEX } from '../../common/name/nameSchemas'
import logger from '../../../../../logger'

export default class ContactSearchController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_SEARCH_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  private TABLE_ROW_COUNT = 10

  private TOO_MANY_RESULTS =
    'Your search returned a large number of results. Only the top 2000 are shown. Refine your search to narrow the results.'

  private getEnabledPrisons = () => {
    return new Set(
      (process.env['FEATURE_ENHANCED_CONTACT_SEARCH'] || '')
        .split(',')
        .map(code => code.trim())
        .filter(Boolean),
    )
  }

  GET = async (
    req: Request<{ journeyId: string }, unknown, unknown, { clear?: string; page?: string; sort?: string }>,
    res: Response,
  ): Promise<void> => {
    const prisonerPrisonId = req.middleware?.prisonerData?.prisonId
    const enhancedFeatureEnabled = prisonerPrisonId ? this.getEnabledPrisons().has(prisonerPrisonId) : undefined
    logger.info(`Is enhanced search: ${enhancedFeatureEnabled}`)
    const { journeyId } = req.params
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

    const view = enhancedFeatureEnabled
      ? await this.getEnhancedContactSearchView(req, res)
      : await this.getContactSearchView(req, res)

    const template = enhancedFeatureEnabled
      ? 'pages/contacts/manage/enhancedContactSearch'
      : 'pages/contacts/manage/contactSearch'

    return res.render(template, view)
  }

  private async getContactSearchView(
    req: Request<{ journeyId: string }, unknown, unknown, { clear?: string; page?: string; sort?: string }>,
    res: Response,
  ) {
    const { journeyId } = req.params
    const { user, prisonerPermissions } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!

    const { day, month, year } = journey?.searchContact?.dateOfBirth ?? {}
    const hasDob = !!(day && month && year)
    const dobError =
      res.locals.validationErrors &&
      (res.locals?.formResponses?.['day'] ||
        res.locals?.formResponses?.['month'] ||
        res.locals?.formResponses?.['year'])

    let results: PagedModelContactSearchResultItem | undefined

    if (journey.searchContact?.contact && this.namesAreValid(journey.searchContact?.contact) && !dobError) {
      const contactSearchRequest: ContactSearchRequest = {
        lastName: journey.searchContact.contact.lastName!,
        firstName: journey.searchContact.contact.firstName,
        middleNames: journey.searchContact.contact.middleNames,
        dateOfBirth: formatDateForApi(journey.searchContact.dateOfBirth),
        includeAnyExistingRelationshipsToPrisoner: journey.prisonerNumber,
        soundsLike: journey.searchContact.soundsLike,
        contactId: journey.searchContact.contactId,
      }

      results = await this.contactsService.searchContact(
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
    return view
  }

  private async getEnhancedContactSearchView(req: Request<{ journeyId: string }>, res: Response) {
    const { journeyId } = req.params
    const { user, prisonerPermissions } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!

    const { day, month, year } = this.validateRequest(journey, res)

    let results: PagedModelContactSearchResultItem | undefined

    if (!res.locals.validationErrors && journey.searchContact) {
      const contact = journey.searchContact.contact ?? {}
      const enhancedContactSearchRequest: EnhancedContactSearchRequest = {
        lastName: contact.lastName,
        firstName: contact.firstName,
        middleNames: contact.middleNames,
        dateOfBirth: formatDateForApi(journey.searchContact.dateOfBirth) ?? undefined,
        previousNames: true,
        includePrisonerRelationships: journey.prisonerNumber,
        searchType: journey.searchContact.searchType,
        contactId: journey.searchContact.contactId,
      }

      results = await this.contactsService.searchContactV2(
        enhancedContactSearchRequest,
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

      results = results ?? ({ content: [] } as PagedModelContactSearchResultItem)
    }
    let truncationMessage: string | undefined
    const totalElements = Number(results?.page?.totalElements ?? 0)
    if (totalElements > 2000) {
      truncationMessage = this.TOO_MANY_RESULTS
    }

    const view = {
      lastName: res.locals?.formResponses?.['lastName'] ?? journey?.searchContact?.contact?.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? journey?.searchContact?.contact?.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? journey?.searchContact?.contact?.middleNames,
      day: res.locals?.formResponses?.['day'] ?? day,
      month: res.locals?.formResponses?.['month'] ?? month,
      year: res.locals?.formResponses?.['year'] ?? year,
      searchType: res.locals?.formResponses?.['searchType'] ?? journey?.searchContact?.searchType,
      contactId: res.locals?.formResponses?.['contactId'] ?? journey?.searchContact?.contactId,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
      sort: journey.searchContact?.sort,
      journey,
      results,
      truncationMessage,
    }
    return view
  }

  private validateRequest(journey: AddContactJourney, res: e.Response) {
    const search = journey?.searchContact
    const dob = search?.dateOfBirth ?? {}
    const contact = search?.contact ?? {}

    const { day, month, year } = dob
    const { firstName, lastName, middleNames } = contact
    const { contactId } = search ?? {}

    const CONTACT_ID_REGEX = /^\d+$/

    const hasDob = Boolean(day && month && year)
    const hasContactId = typeof contactId === 'string' && contactId.trim() !== ''
    const hasName = [firstName, middleNames, lastName].some(v => v?.trim())

    const dobError =
      res.locals.validationErrors &&
      (res.locals.formResponses?.['day'] || res.locals.formResponses?.['month'] || res.locals.formResponses?.['year'])

    const addError = (field: string, message: string, value?: string) => {
      res.locals.validationErrors = {
        ...(res.locals.validationErrors || {}),
        [field]: [message],
      }
      if (value !== undefined) {
        res.locals.formResponses = {
          ...(res.locals.formResponses || {}),
          [field]: value,
        }
      }
    }

    /* -------------------------
     * Contact ID validation
     * ------------------------- */
    if (hasContactId && !CONTACT_ID_REGEX.test(contactId!)) {
      const offending = contactId!.match(/[^\d]/)?.[0]
      const display = offending === ' ' ? 'space' : offending
      addError('contactId', `Contact ID must not contain "${display}"`, contactId!)
    }

    /* -------------------------
     * Empty search validation
     * ------------------------- */
    if (search?.contact && !hasName && !hasContactId && !hasDob && !dobError) {
      addError('search', 'Enter a contact’s name, ID, or date of birth')
    }

    /* -------------------------
     * Name validation
     * ------------------------- */
    const validateName = (field: 'firstName' | 'lastName' | 'middleNames', label: string, value?: string) => {
      if (!value) return

      if (!NAME_REGEX.test(value)) {
        const offending = value.match(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/u)?.[0]
        const display = offending === ' ' ? 'space' : offending
        addError(field, `${label} name must not contain "${display}"`, value)
        return
      }

      if (field === 'lastName' && value.length < 2) {
        addError(field, `${label} name must be 2 characters or more`, value)
      }
    }

    if (hasName) {
      validateName('lastName', 'Last', lastName)
      validateName('firstName', 'First', firstName)
      validateName('middleNames', 'Middle', middleNames)
    }

    return { day, month, year, dobError, hasContactId }
  }

  POST = async (req: Request<{ journeyId: string }, ContactSearchSchemaType>, res: Response): Promise<void> => {
    const prisonerPrisonId = req.middleware?.prisonerData?.prisonId
    const enhancedFeatureEnabled = prisonerPrisonId ? this.getEnabledPrisons().has(prisonerPrisonId) : undefined

    const { journeyId, journey } = enhancedFeatureEnabled
      ? await this.setEnhancedContactSearchSessionParameters(req)
      : await this.setContactSearchSessionParameters(req)
    res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}#`)
  }

  private setContactSearchSessionParameters(req: e.Request<{ journeyId: string }, ContactSearchSchemaType>) {
    const { lastName, firstName, middleNames, day, month, year, soundsLike, contactId } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    if (lastName || firstName || middleNames) {
      journey.searchContact = {
        contact: {
          lastName: lastName || undefined,
          middleNames: middleNames || undefined,
          firstName: firstName || undefined,
        },
        contactId: contactId || undefined,
        soundsLike: Boolean(soundsLike),
        page: 1,
      }
    } else if (lastName === '' && firstName === '' && middleNames === '') {
      journey.searchContact = { page: 1, soundsLike: Boolean(soundsLike) }
    } else if (day && month && year && journey.searchContact?.contact?.lastName) {
      journey.searchContact.dateOfBirth = { day, month, year }
      journey.searchContact.page = 1
      delete journey.searchContact.sort
    }
    return { journeyId, journey }
  }

  private setEnhancedContactSearchSessionParameters(req: e.Request<{ journeyId: string }, ContactSearchSchemaType>) {
    const { lastName, firstName, middleNames, day, month, year, sort, searchType, contactId } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    journey.searchContact = {
      contact: {
        lastName: lastName || undefined,
        middleNames: middleNames || undefined,
        firstName: firstName || undefined,
      },
      dateOfBirth: { day, month, year },
      contactId: contactId || undefined,
      sort: sort || undefined,
      searchType: searchType || undefined,
      page: 1,
    }

    return { journeyId, journey }
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

  private findOffendingCharacter(name: string): string | undefined {
    // allowed: any Unicode letter, apostrophe, hyphen, or whitespace
    const allowedChar = /[\p{L}'\-\s]/u
    for (const ch of name) {
      if (!allowedChar.test(ch)) return ch
    }
    return undefined
  }
}
