import formatRestrictionCardTitle from './formatRestrictionCardTitle'

describe('formatRestrictionCardTitle', () => {
  it('should return the restriction type description with "(expired)" if the expiry date is in the past', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // 1 day in the past
    const restrictionTypeDescription = 'Some Restriction'

    const result = formatRestrictionCardTitle(pastDate.toISOString(), restrictionTypeDescription)

    expect(result).toBe(`${restrictionTypeDescription} (expired)`)
  })

  it('should return only the restriction type description if the expiry date is in the future', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1) // 1 day in the future
    const restrictionTypeDescription = 'Another Restriction'

    const result = formatRestrictionCardTitle(futureDate.toISOString(), restrictionTypeDescription)

    expect(result).toBe(restrictionTypeDescription)
  })

  it('should return the restriction type description with "(expired)" if the expiry date is today but earlier than now', () => {
    const earlierToday = new Date()
    earlierToday.setHours(earlierToday.getHours() - 1) // 1 hour ago
    const restrictionTypeDescription = 'Expired Restriction'

    const result = formatRestrictionCardTitle(earlierToday.toISOString(), restrictionTypeDescription)

    expect(result).toBe(`${restrictionTypeDescription} (expired)`)
  })

  it('should return only the restriction type description if the expiry date is today but later than now', () => {
    const laterToday = new Date()
    laterToday.setHours(laterToday.getHours() + 1) // 1 hour ahead
    const restrictionTypeDescription = 'Valid Restriction'

    const result = formatRestrictionCardTitle(laterToday.toISOString(), restrictionTypeDescription)

    expect(result).toBe(restrictionTypeDescription)
  })

  it('should handle invalid dates gracefully by returning the restriction type description without "(expired)"', () => {
    const invalidDate = 'invalid-date-string'
    const restrictionTypeDescription = 'Invalid Date Restriction'

    const result = formatRestrictionCardTitle(invalidDate, restrictionTypeDescription)

    expect(result).toBe(restrictionTypeDescription) // Assume invalid dates are treated as non-expired
  })
})
