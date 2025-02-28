import TestData from '../routes/testutils/testData'
import { findMostRelevantAddress, getLabelForAddress } from './findMostRelevantAddressAndLabel'
import { components } from '../@types/contactsApi'

type ContactDetails = components['schemas']['ContactDetails']

describe('findMostRelevantAddress', () => {
  let contact: ContactDetails
  beforeEach(() => {
    contact = TestData.contact()
    contact.addresses.push({
      addressType: 'HOME',
      addressTypeDescription: 'Home address',
      area: 'Bunting',
      cityCode: '25344',
      cityDescription: 'Bradford',
      contactAddressId: 2,
      contactId: 1,
      countryCode: 'ENG',
      countryDescription: 'England',
      countyCode: 'W.YORKSHIRE',
      countyDescription: 'West Yorkshire',
      createdBy: 'TIM',
      createdTime: '2014-12-04T0 =3 =44.512401',
      flat: '',
      mailFlag: false,
      noFixedAddress: false,
      phoneNumbers: [
        {
          contactId: 1,
          contactPhoneId: 2,
          contactAddressId: 3,
          contactAddressPhoneId: 4,
          createdBy: 'JAMES',
          createdTime: '2024-12-04T15:35:23.101675v',
          extNumber: '+0123',
          phoneNumber: '01111 777777',
          phoneType: 'HOME',
          phoneTypeDescription: 'Home',
        },
      ],
      postcode: 'BD9 5AJ',
      primaryAddress: true,
      property: '189',
      startDate: '2012-01-02',
      street: 'Lilycroft Rd',
      verified: false,
    })
  })

  it('should find most relevant address based on primaryAddress value', () => {
    // When
    const mostRelevantAddress = findMostRelevantAddress(contact)

    // Then
    expect(mostRelevantAddress).toEqual(contact.addresses[0])
  })

  it('should find most relevant address based on mailFlag value', () => {
    // Given
    contact.addresses[0]!.primaryAddress = false
    contact.addresses[1]!.primaryAddress = false
    contact.addresses[0]!.mailFlag = false
    contact.addresses[1]!.mailFlag = true

    // When
    const mostRelevantAddress = findMostRelevantAddress(contact)

    // Then
    expect(mostRelevantAddress).toEqual(contact.addresses[1])
  })

  it('should find most relevant address based on startDate value', () => {
    // Given
    contact.addresses[0]!.primaryAddress = false
    contact.addresses[1]!.primaryAddress = false
    contact.addresses[0]!.mailFlag = false
    contact.addresses[1]!.mailFlag = false
    contact.addresses[1]!.startDate = '2023-01-02'

    // When
    const mostRelevantAddress = findMostRelevantAddress(contact)

    // Then
    expect(mostRelevantAddress).toEqual(contact.addresses[1])
  })

  it('should not fallback to expired unless requested', () => {
    // Given
    contact.addresses[0]!.primaryAddress = false
    contact.addresses[1]!.primaryAddress = false
    contact.addresses[0]!.mailFlag = false
    contact.addresses[1]!.mailFlag = false
    contact.addresses[0]!.startDate = '2023-01-02'
    contact.addresses[1]!.startDate = '2023-01-01'
    contact.addresses[0]!.endDate = '2025-01-02'
    contact.addresses[1]!.endDate = '2025-01-01'

    // When
    const mostRelevantAddress = findMostRelevantAddress(contact, false)

    // Then
    expect(mostRelevantAddress).toBeNull()
  })

  it('should fallback to expired if requested', () => {
    // Given
    contact.addresses[0]!.primaryAddress = false
    contact.addresses[1]!.primaryAddress = false
    contact.addresses[0]!.mailFlag = false
    contact.addresses[1]!.mailFlag = false
    contact.addresses[0]!.startDate = '2023-01-02'
    contact.addresses[1]!.startDate = '2023-01-01'
    contact.addresses[0]!.endDate = '2025-01-02'
    contact.addresses[1]!.endDate = '2025-01-01'

    // When
    const mostRelevantAddress = findMostRelevantAddress(contact, true)

    // Then
    expect(mostRelevantAddress).toStrictEqual(contact.addresses[0])
  })
})

describe('getLabelForAddress', () => {
  it.each([
    ['Primary and mail', true, true],
    ['Primary', true, false],
    ['Mail', false, true],
  ])(
    'should return primary address flag labe',
    async (flagLabel: string, primaryAddress: boolean, mailFlag: boolean) => {
      // Given
      const contact = TestData.contact()
      contact.addresses[0]!.primaryAddress = primaryAddress
      contact.addresses[0]!.mailFlag = mailFlag

      // When
      const mostRelevantAddressLabel = getLabelForAddress(contact.addresses[0])

      // Then
      expect(mostRelevantAddressLabel).toEqual(flagLabel)
    },
  )
})
