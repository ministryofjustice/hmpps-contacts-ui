import config from '../config'

export default function generateOauthClientToken(
  clientId: string = config.apis.hmppsAuth.signInClientId,
  clientSecret: string = config.apis.hmppsAuth.signInClientSecret,
): string {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}
