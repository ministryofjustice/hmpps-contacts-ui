// Add static routes for help pages
import { Router } from 'express'
import AccessibilityStatementController from './accessibilityStatementController'
import HowToManagePrisonersContactsController from './howToManagePrisonersContactsController'

export default function StaticRoutes(): Router {
  const router = Router({ mergeParams: true })
  const helpController = new HowToManagePrisonersContactsController()
  const accessibilityController = new AccessibilityStatementController()

  // Home index page
  router.get('/', (req, res) => {
    // Render the index page (server/views/pages/index.njk)
    return res.render('pages/index', {
      navigation: { breadcrumbs: ['DPS_HOME'] },
    })
  })

  // Help page
  router.get('/how-to-manage-a-prisoners-contacts', helpController.GET)
  router.get('/accessibility-statement', accessibilityController.GET)

  return router
}
