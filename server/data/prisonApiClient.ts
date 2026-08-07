import { Readable } from 'stream'
import { join } from 'path'
import { createReadStream } from 'node:fs'
import { RestClient, asSystem, SanitisedError, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonApiAddress } from './prisonApiTypes'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonApiClient', config.apis.prisonApi, logger, authenticationClient)
  }

  async getImage(prisonerNumber: string, user: Express.User): Promise<Readable> {
    try {
      return await this.stream(
        { path: `/api/bookings/offenderNo/${prisonerNumber}/image/data` },
        asSystem(user.username),
      )
    } catch (error) {
      if ((error as SanitisedError).responseStatus === 404) {
        return PrisonApiClient.openPlaceholderImage()
      }
      throw error
    }
  }

  async getOffenderAddresses(prisonerNumber: string, user: Express.User): Promise<PrisonApiAddress[]> {
    return this.get({ path: `/api/offenders/${prisonerNumber}/addresses` }, asSystem(user.username))
  }

  // createReadStream() opens the underlying file descriptor asynchronously, so a missing/unreadable
  // placeholder file would otherwise emit an 'error' event after this promise has already resolved.
  // Only resolve once the stream has actually opened, and reject if opening it fails, so callers can
  // handle the failure via the promise rejection (e.g. via .catch()) instead of an unhandled stream error.
  private static openPlaceholderImage(): Promise<Readable> {
    const placeHolderImage = join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
    return new Promise((resolve, reject) => {
      const stream = createReadStream(placeHolderImage)
      stream.once('open', () => resolve(stream))
      stream.once('error', reject)
    })
  }
}
