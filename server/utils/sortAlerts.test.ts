import sortAlerts from './sortAlerts'

describe('sortAlerts with full alert objects', () => {
  const now = new Date()

  const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  const past = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  it('should sort active alerts before expired alerts', () => {
    const alerts = [
      alert({ activeTo: past(1), activeFrom: past(5) }), // expired
      alert({ activeTo: future(1), activeFrom: past(5) }), // active
    ]
    const expired = alerts[0]!
    const active = alerts[1]!
    const sorted = sortAlerts([...alerts])
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.activeTo).toBe(active.activeTo)
    expect(sorted[1]!.activeTo).toBe(expired.activeTo)
  })

  it('should sort active alerts by activeFrom descending', () => {
    const alerts = [
      { ...alert({ activeTo: future(10), activeFrom: past(5) }), activeFrom: future(1) },
      { ...alert({ activeTo: future(10), activeFrom: past(5) }), activeFrom: future(2) },
    ]
    const sorted = sortAlerts([...alerts])
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.activeFrom).toBe(future(2))
    expect(sorted[1]!.activeFrom).toBe(future(1))
  })

  it('should sort expired alerts by activeTo descending', () => {
    const alerts = [
      alert({ activeTo: past(10), activeFrom: past(15) }),
      alert({ activeTo: past(5), activeFrom: past(15) }),
    ]
    const sorted = sortAlerts(alerts)
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.activeTo).toBe(past(5))
    expect(sorted[1]!.activeTo).toBe(past(10))
  })

  it('should fallback to activeFrom if activeFrom and activeTo are equal', () => {
    const alerts = [
      alert({ activeTo: future(5), activeFrom: past(10) }),
      alert({ activeTo: future(5), activeFrom: past(5) }),
    ]
    const sorted = sortAlerts(alerts)
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.activeFrom).toBe(past(5))
    expect(sorted[1]!.activeFrom).toBe(past(10))
  })

  it('should handle empty or undefined alerts', () => {
    expect(sortAlerts([])).toEqual([])
    expect(sortAlerts(undefined as never)).toEqual([])
  })

  it('should treat alerts with no activeTo as active and sort by activeFrom desc', () => {
    const alerts = [
      { ...alert({ activeTo: future(10), activeFrom: past(5) }), activeTo: undefined as never, activeFrom: past(1) },
      { ...alert({ activeTo: future(10), activeFrom: past(5) }), activeTo: undefined as never, activeFrom: past(2) },
    ]
    const sorted = sortAlerts(alerts)
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.activeFrom).toBe(past(1))
    expect(sorted[1]!.activeFrom).toBe(past(2))
  })

  it('active alerts with equal activeFrom fall back to createdAt desc', () => {
    const alerts = [
      { ...alert({ activeTo: future(10), activeFrom: past(3) }), createdAt: past(10), activeFrom: past(3) },
      { ...alert({ activeTo: future(10), activeFrom: past(3) }), createdAt: past(5), activeFrom: past(3) },
    ]
    const sorted = sortAlerts([...alerts])
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.createdAt).toBe(past(5))
    expect(sorted[1]!.createdAt).toBe(past(10))
  })
})

function alert({ activeTo, activeFrom }: { activeTo: string; activeFrom: string }) {
  return {
    alertUuid: '8cdadcf3-b003-4116-9956-c99bd8df6a00',
    prisonNumber: 'A1234AA',
    alertCode: {
      alertTypeCode: 'A',
      alertTypeDescription: 'Alert type description',
      code: 'ABC',
      description: 'Alert code description',
    },
    description: 'Alert description',
    authorisedBy: 'A. Nurse, An Agency',
    activeFrom,
    activeTo,
    isActive: true,
    createdAt: '2017-02-25T14:14:26',
    createdBy: 'USER1234',
    createdByDisplayName: 'Firstname Lastname',
    lastModifiedAt: '2022-07-15T15:24:56',
    lastModifiedBy: 'USER1234',
    lastModifiedByDisplayName: 'Firstname Lastname',
    activeToLastSetAt: '2022-07-15T15:24:56',
    activeToLastSetBy: 'USER1234',
    activeToLastSetByDisplayName: 'Firstname Lastname',
    madeInactiveAt: '2022-07-15T15:24:56',
    madeInactiveBy: 'USER1234',
    madeInactiveByDisplayName: 'Firstname Lastname',
    prisonCodeWhenCreated: 'LEI',
  }
}
