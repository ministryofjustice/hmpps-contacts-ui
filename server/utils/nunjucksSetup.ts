/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import {
  initialiseName,
  formatDate,
  ageInYears,
  capitalizeFirstLetter,
  capitaliseName,
  convertToSortableColumns,
  sentenceCase,
} from './utils'
import config from '../config'
import logger from '../../logger'
import { buildErrorSummaryList, findError } from '../middleware/validationMiddleware'
import { addressToLines, businessAddressToLines } from './addressToLines'
import formatYesNo from './formatYesNo'
import { formatNameLastNameFirst, formatNameFirstNameFirst } from './formatName'
import formatRestrictionCardTitle from './formatRestrictionCardTitle'
import { formatBusinessPhoneNumber } from './formatBusinessPhoneNumber'

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
      logger.error(`Could not read asset manifest file ${e}`)
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
  njkEnv.addFilter('capitaliseName', capitaliseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('buildErrorSummaryList', buildErrorSummaryList)
  njkEnv.addFilter('findError', findError)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addGlobal('DPS_HOME_PAGE_URL', config.serviceUrls.digitalPrison)
  njkEnv.addFilter('pluralise', (word, count, plural = `${word}s`) => (count === 1 ? word : plural))
  njkEnv.addFilter('addressToLines', addressToLines)
  njkEnv.addFilter('businessAddressToLines', businessAddressToLines)
  njkEnv.addFilter('ageInYears', ageInYears)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('formatYesNo', formatYesNo)
  njkEnv.addFilter('formatNameLastNameFirst', formatNameLastNameFirst)
  njkEnv.addFilter('formatNameFirstNameFirst', formatNameFirstNameFirst)
  njkEnv.addFilter('formatRestrictionCardTitle', formatRestrictionCardTitle)
  njkEnv.addFilter('capitalizeFirstLetter', capitalizeFirstLetter)
  njkEnv.addFilter('convertToSortableColumns', convertToSortableColumns)
  njkEnv.addFilter('formatBusinessPhoneNumber', formatBusinessPhoneNumber)
  njkEnv.addFilter('sentenceCase', sentenceCase)
}
