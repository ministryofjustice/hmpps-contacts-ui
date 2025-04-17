import { Request, Response } from 'express'
import { format } from 'date-fns'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import { maxLengthForRestrictionClass, RestrictionSchemaType } from '../schema/restrictionSchema'
import { formatNameFirstNameFirst } from '../../../utils/formatName'
import { ContactsService, RestrictionsService } from '../../../services'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../middleware/setUpSuccessNotificationBanner'
import Urls from '../../urls'
import { RestrictionClass } from '../../../@types/journeys'
import { PrisonerContactRestrictionDetails } from '../../../@types/contactsApiClient'

export default class UpdateRestrictionController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.UPDATE_RESTRICTION_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: RestrictionClass
      restrictionId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, restrictionId, restrictionClass } = req.params
    const { user } = res.locals
    const journey = await this.contactsService.getContactName(Number(contactId), user).then(contact => {
      return {
        contactNames: {
          title: contact.titleDescription,
          lastName: contact.lastName,
          firstName: contact.firstName,
          middleNames: contact.middleNames,
        },
        restrictionClass,
        contactId,
      }
    })
    let existingRestriction
    if (restrictionClass === 'PRISONER_CONTACT') {
      existingRestriction = await this.contactsService
        .getPrisonerContactRestrictions(Number(prisonerContactId), user)
        .then(restrictions =>
          restrictions.prisonerContactRestrictions.find(
            (restriction: PrisonerContactRestrictionDetails) =>
              restriction.prisonerContactRestrictionId === Number(restrictionId),
          ),
        )
    } else {
      existingRestriction = await this.contactsService
        .getGlobalContactRestrictions(Number(contactId), user)
        .then(restrictions =>
          restrictions.find(restriction => restriction.contactRestrictionId === Number(restrictionId)),
        )
    }

    const types = await this.referenceDataService.getReferenceData(ReferenceCodeType.RESTRICTION, user)

    const navigation: Navigation = {
      backLink: Urls.editRestrictions(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const viewModel = {
      journey,
      types,
      isNewRestriction: false,
      type: res.locals?.formResponses?.['type'] ?? existingRestriction?.restrictionType,
      startDate:
        res.locals?.formResponses?.['startDate'] ?? this.formatDateForDatePicker(existingRestriction?.startDate),
      expiryDate:
        res.locals?.formResponses?.['expiryDate'] ?? this.formatDateForDatePicker(existingRestriction?.expiryDate),
      comments: res.locals?.formResponses?.['comments'] ?? existingRestriction?.comments,
      navigation,
      maxCommentLength: maxLengthForRestrictionClass(restrictionClass),
    }
    res.render('pages/contacts/restrictions/enterRestriction', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: RestrictionClass
        restrictionId: string
      },
      unknown,
      RestrictionSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { contactId, prisonerNumber, prisonerContactId, restrictionClass, restrictionId } = req.params
    const { user, prisonerDetails } = res.locals
    if (restrictionClass === 'PRISONER_CONTACT') {
      await this.restrictionsService
        .updatePrisonerContactRestriction(Number(prisonerContactId), Number(restrictionId), req.body, user, req.id)
        .then(_ => this.contactsService.getContactName(Number(contactId), user))
        .then(contactName =>
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve updated the relationship restrictions between contact ${formatNameFirstNameFirst(contactName)} and prisoner ${formatNameFirstNameFirst(prisonerDetails!, { excludeMiddleNames: true })}.`,
          ),
        )
    } else {
      await this.restrictionsService
        .updateContactGlobalRestriction(Number(contactId), Number(restrictionId), req.body, user, req.id)
        .then(_ => this.contactsService.getContactName(Number(contactId), user))
        .then(contactName =>
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve updated the global restrictions for ${formatNameFirstNameFirst(contactName)}.`,
          ),
        )
    }
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }

  private formatDateForDatePicker(date: string | undefined): string | undefined {
    return date ? format(new Date(date), 'dd/MM/yyyy') : undefined
  }
}
