import ContactNames = journeys.ContactNames
import PrisonerDetails = journeys.PrisonerDetails
import { formatNameFirstNameFirst, formatNameLastNameFirst } from './formatName'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import PatchContactResponse = contactsApiClientTypes.PatchContactResponse

describe('formatName', () => {
  it.each([
    [{ lastName: 'Last', firstName: 'First' }, 'Last, First'],
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }, 'Last, First Middle'],
    [{ lastName: 'last', firstName: 'first', middleNames: 'middle' }, 'Last, First Middle'],
    [{ lastName: 'LAST', firstName: 'FIRST', middleNames: 'MIDDLE' }, 'Last, First Middle'],
  ])('should format journey ContactNames', (names: ContactNames, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [{ lastName: 'Last', firstName: 'First' }, 'Last, First'],
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }, 'Last, First Middle'],
    [{ lastName: 'last', firstName: 'first', middleNames: 'middle' }, 'Last, First Middle'],
    [{ lastName: 'LAST', firstName: 'FIRST', middleNames: 'MIDDLE' }, 'Last, First Middle'],
  ])('should format journey ContactNames', (names: PatchContactResponse, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [{ lastName: 'Last', firstName: 'First' }, 'Last, First'],
    [{ lastName: 'last', firstName: 'first' }, 'Last, First'],
    [{ lastName: 'LAST', firstName: 'FIRST' }, 'Last, First'],
  ])('should format journey PrisonerDetails', (names: Partial<PrisonerDetails>, expected: string) => {
    expect(formatNameLastNameFirst(names as PrisonerDetails)).toStrictEqual(expected)
  })

  it.each([
    [{ lastName: 'Last', firstName: 'First' }, 'Last, First'],
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle Names' }, 'Last, First Middle Names'],
    [{ lastName: 'last', firstName: 'first' }, 'Last, First'],
    [{ lastName: 'LAST', firstName: 'FIRST' }, 'Last, First'],
  ])('should format search Prisoner', (names: Partial<Prisoner>, expected: string) => {
    expect(formatNameLastNameFirst(names as Prisoner)).toStrictEqual(expected)
  })

  it.each([
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }, 'Last, First'],
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle Names' }, 'Last, First'],
  ])('should exclude middle names if requested', (names: ContactNames | Partial<Prisoner>, expected: string) => {
    expect(formatNameLastNameFirst(names as ContactNames | Prisoner, { excludeMiddleNames: true })).toStrictEqual(
      expected,
    )
  })

  it.each([
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }, 'Last, Reverend First Middle'],
    [{ lastName: 'Last', firstName: 'First', middleNames: 'Middle' }, 'Last, Reverend First Middle'],
  ])('should be able to insert a custom title', (names: ContactNames | Partial<Prisoner>, expected: string) => {
    expect(formatNameLastNameFirst(names as ContactNames | Prisoner, { customTitle: 'Reverend' })).toStrictEqual(
      expected,
    )
  })

  it.each([
    [{ lastName: 'last', firstName: 'first', middleNames: 'middle' }, 'Last, First Middle'],
    [
      { lastName: "o'postrophe", firstName: 'billy-bob', middleNames: 'middle names' },
      "O'Postrophe, Billy-Bob Middle Names",
    ],
  ])('should capitalise names correctly', (names: ContactNames, expected: string) => {
    expect(formatNameLastNameFirst(names)).toStrictEqual(expected)
  })
})

describe('formatNameFirstNameFirst', () => {
  const is: <T>(value: T) => T = value => value

  it.each([
    [{ firstName: 'First', lastName: 'Last' }, 'First Last'],
    [{ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }, 'First Middle Last'],
    [{ firstName: 'first', middleNames: 'middle', lastName: 'last' }, 'First Middle Last'],
    [{ firstName: 'FIRST', middleNames: 'MIDDLE', lastName: 'LAST' }, 'First Middle Last'],
  ])('should format journey ContactNames', (names: ContactNames, expected: string) => {
    expect(formatNameFirstNameFirst(names)).toStrictEqual(expected)
  })

  it.each([
    [{ firstName: 'First', lastName: 'Last' }, 'First Last'],
    [{ firstName: 'first', lastName: 'last' }, 'First Last'],
    [{ firstName: 'FIRST', lastName: 'LAST' }, 'First Last'],
  ])('should format journey PrisonerDetails', (names: Partial<PrisonerDetails>, expected: string) => {
    expect(formatNameFirstNameFirst(names as PrisonerDetails)).toStrictEqual(expected)
  })

  it.each([
    [{ firstName: 'First', lastName: 'Last' }, 'First Last'],
    [{ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' }, 'First Middle Names Last'],
    [{ firstName: 'first', lastName: 'last' }, 'First Last'],
    [{ firstName: 'FIRST', lastName: 'LAST' }, 'First Last'],
  ])('should format search Prisoner', (names: Partial<Prisoner>, expected: string) => {
    expect(formatNameFirstNameFirst(names as Prisoner)).toStrictEqual(expected)
  })

  it.each([
    [is<ContactNames>({ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }), 'First Last'],
    [is<Partial<Prisoner>>({ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' }), 'First Last'],
  ])('should exclude middle names if requested', (names: ContactNames | Partial<Prisoner>, expected: string) => {
    expect(formatNameFirstNameFirst(names as ContactNames | Prisoner, { excludeMiddleNames: true })).toStrictEqual(
      expected,
    )
  })

  it.each([
    [{ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }, 'Reverend First Middle Last'],
    [{ firstName: 'First', middleNames: 'Middle', lastName: 'Last' }, 'Reverend First Middle Last'],
  ])('should be able to insert a custom title', (names: ContactNames | Partial<Prisoner>, expected: string) => {
    expect(formatNameFirstNameFirst(names as ContactNames | Prisoner, { customTitle: 'Reverend' })).toStrictEqual(
      expected,
    )
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

  it.each([
    [is<ContactNames>({ firstName: 'First', lastName: 'Last' }), 'First Last’s'],
    [is<ContactNames>({ firstName: 'First', lastName: 'Glass' }), 'First Glass’'],
  ])('should append possessive correctly if requested', (names: ContactNames, expected: string) => {
    expect(formatNameFirstNameFirst(names, { possessiveSuffix: true })).toStrictEqual(expected)
  })

  it('should not append possessive if turned off', () => {
    expect(
      formatNameFirstNameFirst({ firstName: 'First', lastName: 'Last' }, { possessiveSuffix: false }),
    ).toStrictEqual('First Last')
  })
})
