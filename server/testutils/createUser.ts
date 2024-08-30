import jwt from 'jsonwebtoken'

function createUserToken(authorities: string[]) {
  const payload = {
    user_name: 'user1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

export default function createUser(authorities: string[]) {
  return { token: createUserToken(authorities), username: 'user1' } as Express.User
}
