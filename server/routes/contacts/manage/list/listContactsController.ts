import { Request, Response } from 'express'
import config from '../../../../config'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { getAnnouncement } from '../../../../utils/announcement'
import { Navigation } from '../../common/navigation'
import Urls from '../../../urls'
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'
import {
  PagedModelPrisonerContactSummary,
  PrisonerContactFilter,
  PrisonerContactPagination,
} from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

const allowedRelationshipTypes = ['S', 'O']
type RelationshipType = (typeof allowedRelationshipTypes)[number]

const allowedFlags = ['EC', 'NOK']
type Flag = (typeof allowedFlags)[number]

const allowedRelationshipStatus = ['ACTIVE_ONLY', 'ACTIVE_AND_INACTIVE']
type RelationshipStatus = (typeof allowedRelationshipStatus)[number]

const allowedSort = ['name,desc', 'name,asc', 'age,desc', 'age,asc']

type Filter = {
  relationshipStatus?: RelationshipStatus
  relationshipType?: RelationshipType[]
  flag?: Flag[]
}

type SafeFilter = {
  relationshipStatus: RelationshipStatus
  relationshipType: RelationshipType[]
  flag: Flag[]
}

export default class ListContactsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  public REQUIRED_PERMISSION = Permission.read_contacts

  private PAGE_SIZE = config.apis.contactsApi.pageSize || 10

  private DEFAULT_SORT = 'name,asc'

  GET = async (
    req: Request<{ prisonerNumber: string }, unknown, unknown, { page: string; sort: string } & Filter>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber } = req.params
    const { query } = req
    const page = query.page && !Number.isNaN(Number(query.page)) ? Number(query.page) : 1
    const sort = query.sort && allowedSort.includes(query.sort) ? query.sort : this.DEFAULT_SORT
    const safeFilter = this.toSafeFilter(query)
    const { relationshipStatus, relationshipType, flag } = safeFilter

    const prisonerContactFilter: PrisonerContactFilter = {}
    const prisonerContactPagination: PrisonerContactPagination = { page: page - 1, size: this.PAGE_SIZE }

    // default includes inactive
    if (relationshipStatus === 'ACTIVE_ONLY') {
      prisonerContactFilter.active = true
    }

    // both social and official ticked is the same as none-ticked
    const socialContacts = relationshipType.indexOf('S') >= 0
    const officialContacts = relationshipType.indexOf('O') >= 0
    if (socialContacts && !officialContacts) {
      prisonerContactFilter.relationshipType = 'S'
    } else if (!socialContacts && officialContacts) {
      prisonerContactFilter.relationshipType = 'O'
    }

    // both ticked means emergency contact OR next of kin which is a special filter
    const emergencyContactFlag = flag.indexOf('EC') >= 0
    const nextOfKinFlag = flag.indexOf('NOK') >= 0
    if (emergencyContactFlag && !nextOfKinFlag) {
      prisonerContactFilter.emergencyContact = true
    } else if (!emergencyContactFlag && nextOfKinFlag) {
      prisonerContactFilter.nextOfKin = true
    } else if (emergencyContactFlag && nextOfKinFlag) {
      prisonerContactFilter.emergencyContactOrNextOfKin = true
    }

    const sortParts = sort.split(',')
    const sortKey = sortParts[0]
    const sortDirection = sortParts[1]
    prisonerContactPagination.sort = [
      `lastName,${sortDirection}`,
      `firstName,${sortDirection}`,
      `middleNames,${sortDirection}`,
      `middleNames,${sortDirection}`,
      `contactId,${sortDirection}`,
    ]
    if (sortKey === 'age') {
      // we want reverse order for dates
      prisonerContactPagination.sort = [
        `deceasedDate,${sortDirection === 'asc' ? 'desc' : 'asc'}`,
        `dateOfBirth,${sortDirection === 'asc' ? 'desc' : 'asc'}`,
        ...prisonerContactPagination.sort,
      ]
    }

    const contactsPage: PagedModelPrisonerContactSummary = await this.contactsService.filterPrisonerContacts(
      prisonerNumber,
      prisonerContactFilter,
      prisonerContactPagination,
      user,
    )

    let hasAnyContactsAtAll = !!contactsPage.page?.totalElements
    if (contactsPage.page?.totalElements === 0) {
      hasAnyContactsAtAll = await this.contactsService
        .filterPrisonerContacts(prisonerNumber, {}, { page: 0, size: 1 }, user)
        .then(unfilteredPage => (unfilteredPage.page?.totalElements ?? 0) > 0)
    }
    const hasAnyFiltersApplied = safeFilter.relationshipType.length > 0 || safeFilter.flag.length > 0

    const queryParamsWithFilters = this.filterToQueryParams(safeFilter)

    setPaginationLocals(
      res,
      this.PAGE_SIZE,
      page,
      contactsPage.page?.totalElements ?? 0,
      contactsPage?.content?.length ?? 0,
      `?${queryParamsWithFilters}&sort=${sort}&page={page}`,
    )

    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE'] }

    const announcement = getAnnouncement()
    res.render('pages/contacts/manage/listContacts', {
      relationshipStatus,
      announcement,
      relationshipType,
      flag,
      sort,
      queryParamsWithFilters,
      contacts: contactsPage.content,
      prisonerNumber,
      navigation,
      hasAnyContactsAtAll,
      hasAnyFiltersApplied,
      prisonerPermissions,
    })
  }

  POST = async (req: Request<{ prisonerNumber: string }, unknown, Filter>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const filter = this.toSafeFilter(req.body)
    res.redirect(`${Urls.contactList(prisonerNumber)}?${this.filterToQueryParams(filter)}`)
  }

  // sanitise the inputs to ensure they are not null and do not contain any values other than the allowed values to prevent XSS
  private toSafeFilter(filter: Filter): SafeFilter {
    const relationshipStatus =
      filter.relationshipStatus && allowedRelationshipStatus.includes(filter.relationshipStatus)
        ? filter.relationshipStatus
        : 'ACTIVE_AND_INACTIVE'
    const relationshipType = this.toSafeArray(filter.relationshipType, allowedRelationshipTypes) as RelationshipType[]
    const flag = this.toSafeArray(filter.flag, allowedFlags) as Flag[]
    return { relationshipStatus, relationshipType, flag }
  }

  private filterToQueryParams(filter: SafeFilter) {
    return `relationshipStatus=${filter.relationshipStatus}${filter.relationshipType.map(it => `&relationshipType=${it}`).join('')}${filter.flag.map(it => `&flag=${it}`).join('')}`
  }

  private toSafeArray(value: string[] | string | undefined, allowedTypes: string[]): string[] {
    if (!value) {
      return []
    }
    let array: string[]
    if (!Array.isArray(value)) {
      array = [value]
    } else {
      array = value
    }
    return array.filter(it => allowedTypes.includes(it))
  }
}
