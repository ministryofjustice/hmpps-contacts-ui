import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { addDays, format, formatISO, parse } from 'date-fns'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import ContactsService from '../../services/contactsService'
import RestrictionsService from '../../services/restrictionsService'
import { Navigation } from '../contacts/common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../middleware/setUpSuccessNotificationBanner'
import Permission from '../../enumeration/permission'
import { isDateAndInThePast } from '../../utils/utils'
import Urls from '../urls'
import { ClosePrisonerRestrictionSchemaType } from './closePrisonerRestrictionSchema'
import { RestrictionParams, prisonerName } from './prisonerRestrictionCommon'

export default class ClosePrisonerRestrictionController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.CLOSE_PRISONER_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  private async getRestriction(req: Request<RestrictionParams>, res: Response) {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    const restriction = await this.contactsService.getPrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      res.locals.user,
    )
    if (!restriction) {
      throw new NotFound(`Couldn't find prisoner restriction ${prisonerRestrictionId} for ${prisonerNumber}`)
    }
    return restriction
  }

  GET = async (req: Request<RestrictionParams>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const restriction = await this.getRestriction(req, res)
    const navigation: Navigation = {
      backLink: Urls.prisonerRestrictions(prisonerNumber),
      cancelButton: Urls.prisonerRestrictions(prisonerNumber),
    }
    res.render('pages/prisoner-restrictions/closePrisonerRestriction', {
      restriction,
      alreadyClosed: isDateAndInThePast(restriction.expiryDate),
      when: res.locals?.formResponses?.['when'],
      expiryDate: res.locals?.formResponses?.['expiryDate'],
      minDate: format(addDays(new Date(), 1), 'dd/MM/yyyy'),
      navigation,
    })
  }

  POST = async (
    req: Request<RestrictionParams, unknown, ClosePrisonerRestrictionSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    const restriction = await this.getRestriction(req, res)
    if (isDateAndInThePast(restriction.expiryDate)) {
      return res.redirect(Urls.closePrisonerRestriction(prisonerNumber, prisonerRestrictionId))
    }

    const closeToday = req.body.when === 'TODAY'
    const expiryDate = formatISO(closeToday ? new Date() : parse(req.body.expiryDate!, 'dd/MM/yyyy', new Date()), {
      representation: 'date',
    })
    if (expiryDate < restriction.effectiveDate) {
      req.flash('formResponses', JSON.stringify(req.body))
      req.flash(
        'validationErrors',
        JSON.stringify({ [closeToday ? 'when' : 'expiryDate']: ['The close date must not be before the start date'] }),
      )
      return res.redirect(`${req.originalUrl}#`)
    }

    await this.restrictionsService.closePrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      expiryDate,
      res.locals.user,
      req.id,
    )
    req.flash(
      FLASH_KEY__SUCCESS_BANNER,
      `You’ve ${closeToday ? 'closed' : 'set a close date for'} a restriction for ${prisonerName(res)}`,
    )
    return res.redirect(Urls.prisonerRestrictions(prisonerNumber))
  }
}
