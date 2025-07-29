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
  sentenceCase,
  isDateAndInThePast,
  referenceCodesToSelect,
  referenceCodesToRadiosOrCheckboxes,
  formatDob,
  formatAge,
  isInternalContact,
} from './utils'
import config from '../config'
import logger from '../../logger'
import { buildErrorSummaryList, customErrorOrderBuilder, findError } from '../middleware/validationMiddleware'
import { addressToLines, coarseAddressToLines } from './addressToLines'
import formatYesNo from './formatYesNo'
import { formatNameLastNameFirst, formatNameFirstNameFirst } from './formatName'
import restrictionTagColour from './restrictionTagColour'
import { formatDateRange } from './formatDateRange'
import { formatBusinessPhoneNumber, formatPhoneNumber } from './formatPhoneNumber'
import { formatTitleForAddress } from './addressUtils'
import sortContactAddresses from './sortAddress'
import { taskStatus } from './taskStatus'
import captionForAddContactJourney from '../routes/contacts/add/addContactsUtils'
import sortRestrictions from './sortRestrictions'
import { convertToSortableColumns } from './convertToSortableColumns'
import { sortPhoneNumbers } from './sortPhoneNumbers'
import { ContactAddressDetails } from '../@types/contactsApiClient'
import { hasPermission, hasRole } from './permissionsUtils'

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
  njkEnv.addFilter('coarseAddressToLines', coarseAddressToLines)
  njkEnv.addFilter('formatTitleForAddress', formatTitleForAddress)
  njkEnv.addFilter('sortContactAddresses', sortContactAddresses)
  njkEnv.addFilter('ageInYears', ageInYears)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('formatYesNo', formatYesNo)
  njkEnv.addFilter('formatNameLastNameFirst', formatNameLastNameFirst)
  njkEnv.addFilter('formatNameFirstNameFirst', formatNameFirstNameFirst)
  njkEnv.addFilter('restrictionTagColour', restrictionTagColour)
  njkEnv.addFilter('capitalizeFirstLetter', capitalizeFirstLetter)
  njkEnv.addFilter('convertToSortableColumns', convertToSortableColumns)
  njkEnv.addFilter('formatDateRange', formatDateRange)
  njkEnv.addFilter('formatBusinessPhoneNumber', formatBusinessPhoneNumber)
  njkEnv.addFilter('formatPhoneNumber', formatPhoneNumber)
  njkEnv.addFilter('formatDob', formatDob)
  njkEnv.addFilter('formatAge', formatAge)
  njkEnv.addFilter('sentenceCase', sentenceCase)
  njkEnv.addFilter('isDateAndInThePast', isDateAndInThePast)
  njkEnv.addFilter('referenceCodesToSelect', referenceCodesToSelect)
  njkEnv.addFilter('referenceCodesToRadios', referenceCodesToRadiosOrCheckboxes)
  njkEnv.addFilter('referenceCodesToCheckboxes', referenceCodesToRadiosOrCheckboxes)
  njkEnv.addFilter('customErrorOrderBuilder', customErrorOrderBuilder)
  njkEnv.addFilter('taskStatus', taskStatus)
  njkEnv.addFilter('captionForAddContactJourney', captionForAddContactJourney)
  njkEnv.addFilter('formatPrimaryOrPostal', (address: ContactAddressDetails & { mailAddress?: boolean }) => {
    if (address.primaryAddress && (address.mailAddress || address.mailFlag)) {
      return 'Primary and postal address'
    }
    if (address.primaryAddress) {
      return 'Primary address'
    }
    if (address.mailAddress || address.mailFlag) {
      return 'Postal address'
    }
    return 'No'
  })
  njkEnv.addFilter('formatAddressCardTitle', (address: ContactAddressDetails & { mailAddress?: boolean }) => {
    if (address.primaryAddress && (address.mailAddress || address.mailFlag)) {
      return 'Primary and postal address'
    }
    if (address.primaryAddress) {
      return 'Primary address'
    }
    if (address.mailAddress || address.mailFlag) {
      return 'Postal address'
    }
    return address.addressTypeDescription || 'Address'
  })
  njkEnv.addFilter(
    'setSelected',
    (items: { value: string; text: string }[], selected) =>
      items &&
      items.map(entry => ({
        ...entry,
        selected: entry && String(entry.value) === String(selected),
      })),
  )
  njkEnv.addFilter(
    'setChecked',
    (items: { value: string; text: string }[], checked?: string[] | string) =>
      items &&
      items.map(entry => ({
        ...entry,
        checked: entry && (Array.isArray(checked) ? checked.includes(String(entry.value)) : entry.value === checked),
      })),
  )
  njkEnv.addFilter('sortRestrictions', sortRestrictions)
  njkEnv.addFilter('sortPhoneNumbers', sortPhoneNumbers)
  njkEnv.addFilter('hasPermission', hasPermission)
  njkEnv.addFilter('hasRole', hasRole)
  njkEnv.addFilter('isInternalContact', isInternalContact)
}
