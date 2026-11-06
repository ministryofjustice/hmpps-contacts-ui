import { hasMaintainRestrictionsRole, isPrisonerRestrictionsMaintenanceEnabled } from './prisonerRestrictionCommon'
import config from '../../config'

describe('prisonerRestrictionCommon', () => {
  describe('hasMaintainRestrictionsRole', () => {
    it.each([
      [['CONTACTS_ADMINISTRATOR'], true],
      [['CONTACTS_AUTHORISER'], true],
      [['UPDATE_ALERT'], false],
      [['PRISONER_PROFILE_SENSITIVE_EDIT'], false],
      [[], false],
    ])('%s => %s', (roles, expected) => {
      expect(hasMaintainRestrictionsRole(roles)).toBe(expected)
    })
  })

  describe('isPrisonerRestrictionsMaintenanceEnabled', () => {
    const original = config.feature.prisonerRestrictionsMaintenanceEnabledPrisons
    afterEach(() => {
      config.feature.prisonerRestrictionsMaintenanceEnabledPrisons = original
    })

    it('is enabled only for listed prisons', () => {
      config.feature.prisonerRestrictionsMaintenanceEnabledPrisons = ['HEI', 'RSI']
      expect(isPrisonerRestrictionsMaintenanceEnabled('HEI')).toBe(true)
      expect(isPrisonerRestrictionsMaintenanceEnabled('MDI')).toBe(false)
      expect(isPrisonerRestrictionsMaintenanceEnabled(undefined)).toBe(false)
    })

    it('is disabled when no prisons are configured', () => {
      config.feature.prisonerRestrictionsMaintenanceEnabledPrisons = []
      expect(isPrisonerRestrictionsMaintenanceEnabled('HEI')).toBe(false)
    })
  })
})
