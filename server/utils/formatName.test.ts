import ContactNames = journeys.ContactNames
import PrisonerDetails = journeys.PrisonerDetails
import { formatNameFirstNameFirst, formatNameLastNameFirst } from './formatName'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

describe('formatName', () => {
  const is: <T>(value: T) => T = value => value

  it.each([
    [is<ContactNames>({ lastName: 'Last', firstName: 'First' }), 'Last, First'],
    [is<ContactNames>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }), 'Last, First Middle'],
    [is<ContactNames>({ lastName: 'last', firstName: 'first', middleNames: 'middle' }), 'Last, First Middle'],
    [is<ContactNames>({ lastName: 'LAST', firstName: 'FIRST', middleNames: 'MIDDLE' }), 'Last, First Middle'],
  ])('should format journey ContactNames', (names: ContactNames, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [is<Partial<PrisonerDetails>>({ lastName: 'Last', firstName: 'First' }), 'Last, First'],
    [is<Partial<PrisonerDetails>>({ lastName: 'last', firstName: 'first' }), 'Last, First'],
    [is<Partial<PrisonerDetails>>({ lastName: 'LAST', firstName: 'FIRST' }), 'Last, First'],
  ])('should format journey PrisonerDetails', (names: PrisonerDetails, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
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
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }), 'Last, First'],
    [is<Partial<Prisoner>>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle Names' }), 'Last, First'],
  ])('should exclude middle names if requested', (names: ContactNames | Prisoner, expected: string) => {
    expect(formatNameLastNameFirst(names, { excludeMiddleNames: true })).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }), 'Last, Reverend First Middle'],
    [
      is<Partial<Prisoner>>({ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }),
      'Last, Reverend First Middle',
    ],
  ])('should be able to insert a custom title', (names: ContactNames | Prisoner, expected: string) => {
    expect(formatNameLastNameFirst(names, { customTitle: 'Reverend' })).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ lastName: 'last', firstName: 'first', middleNames: 'middle' }), 'Last, First Middle'],
    [
      is<ContactNames>({ lastName: "o'postrophe", firstName: 'billy-bob', middleNames: 'middle names' }),
      "O'Postrophe, Billy-Bob Middle Names",
    ],
  ])('should capitalise names correctly', (names: ContactNames, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })
})

describe('formatNameFirstNameFirst', () => {
  const is: <T>(value: T) => T = value => value

  it.each([
    [is<ContactNames>({ firstName: 'First', lastName: 'Last' }), 'First Last'],
    [is<ContactNames>({ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }), 'First Middle Last'],
    [is<ContactNames>({ firstName: 'first', middleNames: 'middle', lastName: 'last' }), 'First Middle Last'],
    [is<ContactNames>({ firstName: 'FIRST', middleNames: 'MIDDLE', lastName: 'LAST' }), 'First Middle Last'],
  ])('should format journey ContactNames', (names: ContactNames, expected: string) => {
    expect(formatNameFirstNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [is<Partial<PrisonerDetails>>({ firstName: 'First', lastName: 'Last' }), 'First Last'],
    [is<Partial<PrisonerDetails>>({ firstName: 'first', lastName: 'last' }), 'First Last'],
    [is<Partial<PrisonerDetails>>({ firstName: 'FIRST', lastName: 'LAST' }), 'First Last'],
  ])('should format journey PrisonerDetails', (names: PrisonerDetails, expected: string) => {
    expect(formatNameFirstNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [is<Partial<Prisoner>>({ firstName: 'First', lastName: 'Last' }), 'First Last'],
    [
      is<Partial<Prisoner>>({ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' }),
      'First Middle Names Last',
    ],
    [is<Partial<Prisoner>>({ firstName: 'first', lastName: 'last' }), 'First Last'],
    [is<Partial<Prisoner>>({ firstName: 'FIRST', lastName: 'LAST' }), 'First Last'],
  ])('should format search Prisoner', (names: Prisoner, expected: string) => {
    expect(formatNameFirstNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }), 'First Last'],
    [is<Partial<Prisoner>>({ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' }), 'First Last'],
  ])('should exclude middle names if requested', (names: ContactNames | Prisoner, expected: string) => {
    expect(formatNameFirstNameFirst(names, { excludeMiddleNames: true })).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }), 'Reverend First Middle Last'],
    [
      is<Partial<Prisoner>>({ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }),
      'Reverend First Middle Last',
    ],
  ])('should be able to insert a custom title', (names: ContactNames | Prisoner, expected: string) => {
    expect(formatNameFirstNameFirst(names, { customTitle: 'Reverend' })).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ firstName: 'first', middleNames: 'middle', lastName: 'last' }), 'First Middle Last'],
    [
      is<ContactNames>({ firstName: 'billy-bob', middleNames: 'middle names', lastName: "o'postrophe" }),
      "Billy-Bob Middle Names O'Postrophe",
    ],
  ])('should capitalise names correctly', (names: ContactNames, expected: string) => {
    expect(formatNameFirstNameFirst(names)).toStrictEqual(expected)
  })
})
