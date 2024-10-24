import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import { PaginationRequest, Prisoner } from '../../../../data/prisonerOffenderSearchTypes'
import logger from '../../../../../logger'
import { ENTER_TWO_CHARS_MIN } from './prisonerSearchSchema'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.prisonId = 'HEI'
      session.prisonName = 'Hewell'
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        search: {
          searchTerm: 'test',
        },
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/prisoner-search-results', () => {
  describe('Pagination', () => {
    it('should display the pagination when total pages are more than 1', async () => {
      auditService.logPageView.mockResolvedValue(null)

      prisonerSearchService.searchInCaseload.mockResolvedValue({
        totalPages: 5,
        totalElements: 86,
        first: false,
        last: false,
        size: 20,
        number: 1,
        content: [
          { lastName: 'test', firstName: 'test', prisonerNumber: 'test', dateOfBirth: '2000-01-01' } as Prisoner,
        ],
      })

      const response = await request(app).get(`/contacts/manage/prisoner-search-results/${journeyId}`)
      const $ = cheerio.load(response.text)

      expect(response.status).toEqual(200)
      expect($('.moj-pagination')).toBeDefined()
      expect($('.moj-pagination__link:eq(0)').text().trim()).toContain('Previous')
      expect($('.moj-pagination__link:eq(1)').text().trim()).toStrictEqual('1')
      expect($('.moj-pagination__item--active').text().trim()).toStrictEqual('2')
      expect($('.moj-pagination__link:eq(2)').text().trim()).toStrictEqual('3')
      expect($('.moj-pagination__item--dots').text().trim()).toStrictEqual('…')
      expect($('.moj-pagination__link:eq(3)').text().trim()).toStrictEqual('5')
      expect($('.moj-pagination__link:eq(4)').text().trim()).toContain('Next')
    })

    it('should hide previous link when page equal or greater than 1 is selected', async () => {
      auditService.logPageView.mockResolvedValue(null)

      prisonerSearchService.searchInCaseload.mockResolvedValue({
        totalPages: 5,
        totalElements: 86,
        first: true,
        last: false,
        size: 20,
        number: 0,
        content: [
          { lastName: 'test', firstName: 'test', prisonerNumber: 'test', dateOfBirth: '2000-01-01' } as Prisoner,
        ],
      })

      const response = await request(app).get(`/contacts/manage/prisoner-search-results/${journeyId}`)
      const $ = cheerio.load(response.text)

      expect(response.status).toEqual(200)
      expect($('.moj-pagination')).toBeDefined()
      expect($('.moj-pagination__item--active').text().trim()).toStrictEqual('1')
      expect($('.moj-pagination__link:eq(0)').text().trim()).toStrictEqual('2')
      expect($('.moj-pagination__item--dots').text().trim()).toStrictEqual('…')
      expect($('.moj-pagination__link:eq(1)').text().trim()).toStrictEqual('5')
      expect($('.moj-pagination__link:eq(2)').text().trim()).toContain('Next')
    })

    it('should hide next link when last page is selected', async () => {
      auditService.logPageView.mockResolvedValue(null)

      prisonerSearchService.searchInCaseload.mockResolvedValue({
        totalPages: 5,
        totalElements: 86,
        first: false,
        last: true,
        size: 20,
        number: 1,
        content: [
          { lastName: 'test', firstName: 'test', prisonerNumber: 'test', dateOfBirth: '2000-01-01' } as Prisoner,
        ],
      })

      const response = await request(app).get(`/contacts/manage/prisoner-search-results/${journeyId}`)
      const $ = cheerio.load(response.text)

      expect(response.status).toEqual(200)
      expect($('.moj-pagination')).toBeDefined()
      expect($('.moj-pagination__link:eq(0)').text().trim()).toContain('Prev')
      expect($('.moj-pagination__link:eq(1)').text().trim()).toStrictEqual('1')
      expect($('.moj-pagination__item--active').text().trim()).toStrictEqual('2')
      expect($('.moj-pagination__link:eq(2)').text().trim()).toStrictEqual('3')
      expect($('.moj-pagination__item--dots').text().trim()).toStrictEqual('…')
      expect($('.moj-pagination__link:eq(3)').text().trim()).toStrictEqual('5')
    })
  })

  it('should render the prisoner search results page', async () => {
    auditService.logPageView.mockResolvedValue(null)

    prisonerSearchService.searchInCaseload.mockResolvedValue({
      totalPages: 1,
      totalElements: 1,
      first: true,
      last: true,
      size: 1,
      content: [{ lastName: 'test', firstName: 'test', prisonerNumber: 'test', dateOfBirth: '2000-01-01' } as Prisoner],
    })

    const response = await request(app).get(`/contacts/manage/prisoner-search-results/${journeyId}`)

    logger.info(`Response = ${JSON.stringify(response)}`)

    expect(response.status).toEqual(200)
    expect(response.text).toContain('search')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_RESULTS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })

    expect(prisonerSearchService.searchInCaseload).toHaveBeenCalledWith(
      'test',
      'HEI',
      { page: 0, size: 20 } as PaginationRequest,
      user,
    )
  })

  it('should show a message if no results found', async () => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.searchInCaseload.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 0,
      content: [],
    })

    const response = await request(app).get(`/contacts/manage/prisoner-search-results/${journeyId}`)

    expect(response.status).toEqual(200)
    expect(response.text).toContain('There are no results for this name or number at Hewell')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_RESULTS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })

    expect(prisonerSearchService.searchInCaseload).toHaveBeenCalledWith(
      'test',
      'HEI',
      { page: 0, size: 20 } as PaginationRequest,
      user,
    )
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/contacts/manage/prisoner-search-results/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/manage/start')
  })
})

describe('POST /contacts/manage/prisoner-search-results/:journeyId', () => {
  it('should redirect back to the get results page if there are no validation errors', async () => {
    flashProvider.mockReturnValue({ search: ['A1111AA'] })

    await request(app)
      .post(`/contacts/manage/prisoner-search-results/${journeyId}`)
      .type('form')
      .send({ search: 'A1111AA' })
      .expect(302)
      .expect('Location', `/contacts/manage/prisoner-search-results/${journeyId}`)

    expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.any(String))
    expect(session.manageContactsJourneys[journeyId].search.searchTerm).toEqual('A1111AA')
  })

  it('should return to search results page if there are validation errors', async () => {
    flashProvider.mockReturnValue({ search: [ENTER_TWO_CHARS_MIN] })

    await request(app)
      .post(`/contacts/manage/prisoner-search-results/${journeyId}`)
      .type('form')
      .send({ search: 'A' })
      .expect(302)
      .expect('Location', `/contacts/manage/prisoner-search-results/${journeyId}`)

    expect(flashProvider).toHaveBeenCalledWith('validationErrors', `{"search":["${ENTER_TWO_CHARS_MIN}"]}`)
  })

  it('should return to the journey start if no matching journey in session', async () => {
    await request(app)
      .post(`/contacts/manage/prisoner-search-results/${uuidv4()}`)
      .type('form')
      .send({ search: 'Any' })
      .expect(302)
      .expect('Location', '/contacts/manage/start')
  })
})
