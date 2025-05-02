import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import OrganisationsService from '../../../../../services/organisationsService'
import { CreateContactEmploymentParam, EmploymentUtils, getEmploymentAndUrl } from '../common/utils'
import { IsCorrectEmployerSchema } from '../../../manage/update-employments/check-employer/checkEmployerSchema'
import Permission from '../../../../../enumeration/permission'

export default class CreateContactCheckEmployerController implements PageHandler {
  constructor(private readonly organisationsService: OrganisationsService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_CHECK_EMPLOYER_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<CreateContactEmploymentParam, unknown, unknown, { organisationId: string }>,
    res: Response,
  ) => {
    const { journey, employmentUrl } = getEmploymentAndUrl(req)
    const { organisationId } = req.query

    if (organisationId) {
      const orgIdNumber = Number(organisationId)
      if (!Number.isNaN(orgIdNumber)) {
        journey.newEmployment = { organisationId: orgIdNumber }
      }
      return res.redirect(employmentUrl({ subPath: 'check-employer' }))
    }

    if (!journey.newEmployment?.organisationId) {
      return res.status(404).render('pages/errors/notFound')
    }
    const employer = await this.organisationsService.getOrganisation(
      journey.newEmployment.organisationId,
      res.locals.user,
    )
    if (!employer) {
      return res.status(404).render('pages/errors/notFound')
    }

    return res.render('pages/contacts/manage/employments/checkEmployer/index', {
      isNewContact: true,
      navigation: {
        backLink: employmentUrl({ subPath: 'organisation-search' }),
      },
      journey,
      contactNames: journey.names,
      organisation: employer,
      organisationTypes: employer.organisationTypes
        .map(({ organisationTypeDescription }: { organisationTypeDescription: string }) => organisationTypeDescription)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join('\n'),
      activeAddresses: EmploymentUtils.getActiveAddresses(employer),
      inactiveAddresses: EmploymentUtils.getInactiveAddresses(employer),
      emailAddresses: employer.emailAddresses
        .map(({ emailAddress }: { emailAddress: string }) => emailAddress)
        .join('\n'),
      webAddresses: employer.webAddresses.map(({ webAddress }: { webAddress: string }) => webAddress).join('\n'),
    })
  }

  POST = async (req: Request<CreateContactEmploymentParam, unknown, IsCorrectEmployerSchema>, res: Response) => {
    const { isNew, journey, employment, employmentUrl, bounceBackUrl } = getEmploymentAndUrl(req)

    if (req.body.isCorrectEmployer === 'NO') {
      delete journey.newEmployment
      return res.redirect(employmentUrl({ subPath: 'organisation-search' }))
    }

    const employerSummary = await this.organisationsService.getOrganisationSummary(
      journey.newEmployment!.organisationId!,
      res.locals.user,
    )

    if (isNew) {
      journey.pendingEmployments ??= []
      journey.pendingEmployments.push({
        employer: employerSummary,
        isActive: true,
      })
    } else if (employment) {
      employment.employer = employerSummary
    }

    return res.redirect(bounceBackUrl)
  }
}
