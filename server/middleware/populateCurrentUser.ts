import { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../../logger'
import { capitaliseName } from '../utils/utils'

export default function populateCurrentUser(): RequestHandler {
  return async (req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }

      res.locals.user = {
        ...res.locals.user,
        userId: userId!,
        name: name!,
        displayName: capitaliseName(name!),
        userRoles: roles.map(role => role.substring(role.indexOf('_') + 1)),
      }

      if (res.locals.user.authSource === 'nomis') {
        const staffId = parseInt(userId!, 10)
        if (staffId) {
          res.locals.user.staffId = staffId
        }
      }

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
