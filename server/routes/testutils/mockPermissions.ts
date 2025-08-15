import {
  isGranted,
  PersonalRelationshipsPermission,
  PrisonerPermission,
  prisonerPermissionsGuard,
  setupNunjucksPermissions,
} from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Express } from 'express'
import nunjucksSetup from '../../utils/nunjucksSetup'

export default function mockPermissions(app: Express, permissions: Partial<Record<PrisonerPermission, boolean>>) {
  const isGrantedMock = isGranted as jest.MockedFunction<typeof isGranted>
  const prisonerPermissionsGuardMock = prisonerPermissionsGuard as jest.MockedFunction<typeof prisonerPermissionsGuard>
  const setupNunjucksPermissionsMock = setupNunjucksPermissions as jest.MockedFunction<typeof setupNunjucksPermissions>

  isGrantedMock.mockImplementation((perm, _perms) => permissions[perm] || false)
  setupNunjucksPermissionsMock.mockImplementation(njkEnv => {
    njkEnv.addGlobal('isGranted', isGrantedMock)
    Object.entries({ PersonalRelationshipsPermission }).forEach(([key, value]) => njkEnv.addGlobal(key, value))
  })
  prisonerPermissionsGuardMock.mockImplementation((_service, options) => async (_req, _res, next) => {
    return options.requestDependentOn.some(perm => !permissions[perm]) ? next(new Error('Permission denied')) : next()
  })

  // Need to reset the isGranted method in templates:
  nunjucksSetup(app)
}
