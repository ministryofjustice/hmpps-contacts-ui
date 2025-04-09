import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import OrganisationsService from '../../../../../services/organisationsService'
import { CreateContactEmploymentParam, EmploymentUtils, getEmploymentAndUrl } from '../common/utils'
import { IsCorrectEmployerSchema } from '../../../manage/update-employments/check-employer/checkEmployerSchema'

export default class CreateContactCheckEmployerController implements PageHandler {
  constructor(private readonly organisationsService: OrganisationsService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_CHECK_EMPLOYER_PAGE

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
    journey.newEmployment.employer = await this.organisationsService.getOrganisation(
      journey.newEmployment.organisationId,
      res.locals.user,
    )
    if (!journey.newEmployment.employer) {
      return res.status(404).render('pages/errors/notFound')
    }

    return res.render('pages/contacts/manage/employments/checkEmployer/index', {
      isNewContact: true,
      navigation: {
        backLink: employmentUrl({ subPath: 'organisation-search' }),
      },
      journey,
      contactNames: journey.names,
      organisation: journey.newEmployment.employer,
      organisationTypes: journey.newEmployment.employer.organisationTypes
        .map(({ organisationTypeDescription }: { organisationTypeDescription: string }) => organisationTypeDescription)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join('\n'),
      activeAddresses: EmploymentUtils.getActiveAddresses(journey.newEmployment.employer),
      inactiveAddresses: EmploymentUtils.getInactiveAddresses(journey.newEmployment.employer),
      emailAddresses: journey.newEmployment.employer.emailAddresses
        .map(({ emailAddress }: { emailAddress: string }) => emailAddress)
        .join('\n'),
      webAddresses: journey.newEmployment.employer.webAddresses
        .map(({ webAddress }: { webAddress: string }) => webAddress)
        .join('\n'),
    })
  }

  POST = async (req: Request<CreateContactEmploymentParam, unknown, IsCorrectEmployerSchema>, res: Response) => {
    const { isNew, journey, employment, employmentUrl, bounceBackUrl } = getEmploymentAndUrl(req)

    if (req.body.isCorrectEmployer === 'NO') {
      delete journey.newEmployment
      return res.redirect(employmentUrl({ subPath: 'organisation-search' }))
    }

    if (isNew) {
      journey.pendingEmployments ??= []
      journey.pendingEmployments.push({
        employer: EmploymentUtils.summariseOrganisationDetails(journey.newEmployment!.employer),
        isActive: true,
      })
    } else if (employment) {
      employment.employer = EmploymentUtils.summariseOrganisationDetails(journey.newEmployment!.employer)
    }

    return res.redirect(bounceBackUrl)
  }
}
