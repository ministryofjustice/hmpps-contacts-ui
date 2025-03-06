import TestData from '../routes/testutils/testData'
import { sortLinkedPrisoners } from './sortLinkedPrisoners'

describe('sortLinkedPrisoners', () => {
  it('should sort by full name with last name last', () => {
    const prisoners = [
      TestData.getLinkedPrisonerDetails({
        lastName: 'ZZ',
        firstName: 'z',
        prisonerNumber: '1',
      }),
      TestData.getLinkedPrisonerDetails({
        lastName: 'EE',
        firstName: 'a',
        prisonerNumber: '2',
      }),
      TestData.getLinkedPrisonerDetails({
        lastName: 'ZZ',
        firstName: 'a',
        prisonerNumber: '3',
      }),
    ]

    const sorted = sortLinkedPrisoners(prisoners)

    expect(sorted.map(it => it.prisonerNumber)).toStrictEqual(['2', '3', '1'])
  })

  it('should sort by prisoner number if name is the same', () => {
    const prisoners = [
      TestData.getLinkedPrisonerDetails({
        lastName: 'A',
        firstName: 'A',
        prisonerNumber: '1',
      }),
      TestData.getLinkedPrisonerDetails({
        lastName: 'A',
        firstName: 'A',
        prisonerNumber: '2',
      }),
      TestData.getLinkedPrisonerDetails({
        lastName: 'A',
        firstName: 'A',
        prisonerNumber: '3',
      }),
    ]

    const sorted = sortLinkedPrisoners(prisoners)

    expect(sorted.map(it => it.prisonerNumber)).toStrictEqual(['1', '2', '3'])
  })
})
