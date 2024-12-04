import { Router } from 'express'

export default function setUpSuccessNotificationBanner(): Router {
  const router = Router({ mergeParams: true })
  router.use((req, res, next) => {
    const notificationBanner = req.flash('successNotificationBanner')
    res.locals.successNotificationBanner =
      notificationBanner && notificationBanner[0] ? notificationBanner[0] : undefined
    next()
  })
  return router
}
