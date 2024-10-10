import ContactNames = journeys.ContactNames
import PrisonerDetails = journeys.PrisonerDetails
import formatName from './formatName'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

describe('formatName', () => {
  const is: <T>(value: T) => T = value => value

  it.each([
    [is<ContactNames>({ lastName: 'Last', firstName: 'First' }), 'Last, First'],
    [is<ContactNames>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }), 'Last, First Middle'],
    [is<ContactNames>({ lastName: 'last', firstName: 'first', middleNames: 'middle' }), 'Last, First Middle'],
    [is<ContactNames>({ lastName: 'LAST', firstName: 'FIRST', middleNames: 'MIDDLE' }), 'Last, First Middle'],
  ])('should format journey ContactNames', (names: ContactNames, expected: string) => {
    expect(formatName(names)).toStrictEqual(expected)
  })

  it.each([
    [is<Partial<PrisonerDetails>>({ lastName: 'Last', firstName: 'First' }), 'Last, First'],
    [is<Partial<PrisonerDetails>>({ lastName: 'last', firstName: 'first' }), 'Last, First'],
    [is<Partial<PrisonerDetails>>({ lastName: 'LAST', firstName: 'FIRST' }), 'Last, First'],
  ])('should format journey PrisonerDetails', (names: PrisonerDetails, expected: string) => {
    expect(formatName(names)).toStrictEqual(expected)
  })

  it.each([
    [is<Partial<Prisoner>>({ lastName: 'Last', firstName: 'First' }), 'Last, First'],
    [
      is<Partial<Prisoner>>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle Names' }),
      'Last, First Middle Names',
    ],
    [is<Partial<Prisoner>>({ lastName: 'last', firstName: 'first' }), 'Last, First'],
    [is<Partial<Prisoner>>({ lastName: 'LAST', firstName: 'FIRST' }), 'Last, First'],
  ])('should format search Prisoner', (names: Prisoner, expected: string) => {
    expect(formatName(names)).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }), 'Last, First'],
    [is<Partial<Prisoner>>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle Names' }), 'Last, First'],
  ])('should exclude middle names if requested', (names: ContactNames | Prisoner, expected: string) => {
    expect(formatName(names, { excludeMiddleNames: true })).toStrictEqual(expected)
  })
})
