import { Router } from 'express'

export const FLASH_KEY__SUCCESS_BANNER = 'successNotificationBanner'

export default function setUpSuccessNotificationBanner(): Router {
  const router = Router({ mergeParams: true })
  router.use((req, res, next) => {
    const notificationBanner = req.flash(FLASH_KEY__SUCCESS_BANNER)
    res.locals.successNotificationBanner =
      notificationBanner && notificationBanner[0] ? notificationBanner[0] : undefined
    next()
  })
  return router
}
