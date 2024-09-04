/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { initialiseName, formatDate, convertToTitleCase, properCaseFullName, getFormatDistanceToNow } from './utils'
import config from '../config'
import logger from '../../logger'
import { buildErrorSummaryList, findError } from '../middleware/validationMiddleware'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Hmpps Contacts Ui'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(`Could not read asset manifest file ${e?.message}`)
    }
  }

  // Set up the digital prison services URL in res.locals for use in views/macros - mini profile
  app.locals.digitalPrisonServicesUrl = config.serviceUrls.digitalPrison
  app.use((_req, res, next) => {
    res.locals.digitalPrisonServicesUrl = config.serviceUrls.digitalPrison
    return next()
  })

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      path.join(__dirname, '../../server/routes'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('convertToTitleCase', convertToTitleCase)
  njkEnv.addFilter('properCaseFullName', properCaseFullName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('buildErrorSummaryList', buildErrorSummaryList)
  njkEnv.addFilter('findError', findError)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addGlobal('DPS_HOME_PAGE_URL', config.serviceUrls.digitalPrison)
  njkEnv.addFilter('pluralise', (word, count, plural = `${word}s`) => (count === 1 ? word : plural))

  njkEnv.addFilter('createContactsListRows', contactList => {
    const activeContactsRows: Array<unknown> = []
    contactList.forEach((item: Record<string, Date>) => {
      activeContactsRows.push([
        { html: `<a href="">${item.surname}, ${item.forename}</a>` },
        { html: `${formatDate(item.dateOfBirth)}<br />(${getFormatDistanceToNow(item.dateOfBirth)} old)` },
        {
          html: `
            ${item.flat}<br />
            ${item.street}<br />
            ${item.area}'<br />
            ${item.cityCode}<br />
            ${item.postCode}<br />
            ${item.cityCode}<br />
            ${item.countryCode}<br />`,
        },
        {
          text: item.relationshipDescription,
        },
        {
          text: item.emergencyContact ? 'Yes' : 'No',
        },
        {
          text: item.nextOfKin ? 'Yes' : 'No',
        },
        {
          text: item.approvedVisitor ? 'Yes' : 'No',
        },
      ])
    })
    return activeContactsRows
  })
}
