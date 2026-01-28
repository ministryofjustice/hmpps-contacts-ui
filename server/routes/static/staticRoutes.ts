// Add static routes for help pages
import { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import HowToManagePrisonersContactsController from './howToManagePrisonersContactsController'

export default function StaticRoutes(): Router {
  const router = Router({ mergeParams: true })
  const controller = new HowToManagePrisonersContactsController()

  // Home index page
  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      // Render the index page (server/views/pages/index.njk)
      return res.render('pages/index', {
        navigation: { breadcrumbs: ['DPS_HOME'] },
      })
    }),
  )

  // Help page
  router.get('/how-to-manage-a-prisoners-contacts', asyncMiddleware(controller.GET))

  return router
}
