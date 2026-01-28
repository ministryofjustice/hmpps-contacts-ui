import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, basicPrisonUser } from './testutils/appSetup'
import { MockedService } from '../testutils/mockedServices'

jest.mock('../services/auditService')

const auditService = MockedService.AuditService()

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => basicPrisonUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('The entry point is contacts - home page', async () => {
    const response = await request(app).get(`/`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(`Contacts - DPS`)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    const breadcrumbs = $('[data-qa=breadcrumbs] a')
    expect(breadcrumbs).toHaveLength(1)
    expect(breadcrumbs.eq(0).text().trim()).toStrictEqual('Digital Prison Services')
    expect(breadcrumbs.eq(0).attr('href')).toStrictEqual('http://localhost:3001')

    const card1 = $('[data-qa=manage-contacts-card]')
    expect(card1).toHaveLength(1)
    const link1 = card1.find('a.card__link')
    expect(link1.attr('href')).toStrictEqual('/start')
    expect(link1.text().trim()).toStrictEqual('Search for a contact')
    expect(card1.find('p.card__description').text().trim()).toStrictEqual("View a contact's details.")
    const card2 = $('[data-qa=how-to-manage-prisoner-contacts-card]')
    expect(card2).toHaveLength(1)
    const link2 = card2.find('a.card__link')
    expect(link2.attr('href')).toStrictEqual('/how-to-manage-a-prisoners-contacts')
    expect(link2.text().trim()).toStrictEqual("How to manage a prisoner's contacts")
    expect(card2.find('p.card__description').text().trim()).toStrictEqual(
      "Information on how to manage a prisoner's contacts.",
    )
  })
})
