import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { components } from '../../@types/contactsApi'

type ContactSearchResultItem = components['schemas']['ContactSearchResultItem']
type GetContactResponse = components['schemas']['GetContactResponse']
type ContactAddressDetails = components['schemas']['ContactAddressDetails']
type ContactPhoneNumberDetails = components['schemas']['ContactPhoneNumberDetails']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type ContactIdentityDetails = components['schemas']['ContactIdentityDetails']

export default class TestData {
  static address: ContactAddressDetails = {
    contactAddressId: 1,
    contactId: 1,
    addressType: 'HOME',
    addressTypeDescription: 'Home address',
    primaryAddress: true,
    flat: '',
    property: '24',
    street: 'Acacia Avenue',
    area: 'Bunting',
    cityCode: '25343',
    cityDescription: 'Sheffield',
    countyCode: 'S.YORKSHIRE',
    countyDescription: 'South Yorkshire',
    postcode: 'S2 3LK',
    countryCode: 'ENG',
    countryDescription: 'England',
    verified: false,
    verifiedBy: null,
    verifiedTime: null,
    mailFlag: false,
    startDate: '2020-01-02',
    endDate: '2029-03-04',
    noFixedAddress: false,
    phoneNumbers: [
      {
        contactPhoneId: 2,
        contactId: 1,
        phoneType: 'HOME',
        phoneTypeDescription: 'Home phone',
        phoneNumber: '01111 777777',
        extNumber: '+0123',
        primaryPhone: false,
        createdBy: 'JAMES',
        createdTime: '2024-10-04T15:35:23.101675v',
        amendedBy: null,
        amendedTime: null,
      },
    ],
    createdBy: 'TIM',
    createdTime: '2024-10-04T0 =3 =44.512401',
    amendedBy: null,
    amendedTime: null,
  }

  static getContactIdentityDetails = (
    identityType: string,
    identityTypeDescription: string,
    identityValue: string,
    issuingAuthority: string,
  ) => {
    return {
      contactIdentityId: 1,
      contactId: 1,
      identityType,
      identityTypeDescription,
      identityValue,
      issuingAuthority,
      verified: true,
      verifiedBy: 'JAMES',
      verifiedTime: '2024-10-08T15:22:59.604791',
      createdBy: 'TIM',
      createdTime: '2024-10-08T15:22:59.604791',
      amendedBy: '',
      amendedTime: '',
    } as ContactIdentityDetails
  }

  static getContactPhoneNumberDetails = (phoneType: string, phoneTypeDescription: string, phoneNumber: string) => {
    return {
      contactPhoneId: 1,
      contactId: 1,
      phoneType,
      phoneTypeDescription,
      phoneNumber,
      extNumber: null,
      primaryPhone: true,
      createdBy: 'TIM',
      createdTime: '2024-10-04T15:35:23.101675',
      amendedBy: null,
      amendedTime: null,
    } as ContactPhoneNumberDetails
  }

  static getContactEmailDetails = (emailType: string, emailTypeDescription: string, emailAddress: string) => {
    return {
      contactEmailId: 1,
      contactId: 1,
      emailType,
      emailTypeDescription,
      emailAddress,
      primaryEmail: true,
      createdBy: 'TIM',
      createdTime: '2024-10-08T12:16:09.024803',
      amendedBy: null,
      amendedTime: null,
    } as ContactEmailDetails
  }

  static currentIncentive = ({
    level = {
      code: 'STD',
      description: 'Standard',
    },
  }: Partial<CurrentIncentive> = {}): CurrentIncentive => ({ level }) as CurrentIncentive

  static prisoner = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    dateOfBirth = '1975-04-02',
    prisonId = 'HEI',
    prisonName = 'HMP Hewell',
    cellLocation = '1-1-C-028',
    currentIncentive = this.currentIncentive(),
    locationDescription = undefined,
  }: Partial<Prisoner> = {}): Prisoner =>
    ({
      prisonerNumber,
      firstName,
      lastName,
      dateOfBirth,
      prisonId,
      prisonName,
      cellLocation,
      currentIncentive,
      locationDescription,
    }) as Prisoner

  static contactSearchResultItem = ({
    id = 13,
    lastName = 'Mason',
    firstName = 'Jones',
    middleNames = 'M.',
    dateOfBirth = '1990-01-14',
    flat = '32',
    property = '',
    street = 'Acacia Avenue',
    area = 'Bunting',
    cityCode = '25343',
    cityDescription = 'Sheffield',
    countyCode = 'S.YORKSHIRE',
    countyDescription = 'South Yorkshire',
    postCode = 'S2 3LK',
    countryCode = 'ENG',
    countryDescription = 'England',
    createdBy = 'User13',
    createdTime = '2024-09-11T11:08:26.191824',
  }: Partial<ContactSearchResultItem> = {}): ContactSearchResultItem =>
    ({
      id,
      lastName,
      firstName,
      middleNames,
      dateOfBirth,
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postCode,
      countryCode,
      countryDescription,
      createdBy,
      createdTime,
    }) as ContactSearchResultItem

  static contact = ({
    id = 1,
    title = 'MR',
    lastName = 'Mason',
    firstName = 'Jones',
    middleNames = null,
    dateOfBirth = '1990-01-14',
    estimatedIsOverEighteen = null,
    isDeceased = false,
    deceasedDate = null,
    createdBy = 'USER1',
    createdTime = '2024-09-20T10:30:00.000000',
    languageCode = 'ENG',
    languageDescription = 'English',
    interpreterRequired = false,
    addresses = [this.address],
    phoneNumbers = [
      this.getContactPhoneNumberDetails('MOBILE', 'Mobile phone', '07878 111111'),
      this.getContactPhoneNumberDetails('HOME', 'Home phone', '01111 777777'),
    ],
    emailAddresses = [
      this.getContactEmailDetails('PERSONAL', 'Personal email', 'mr.last@example.com'),
      this.getContactEmailDetails('PERSONAL', 'Personal email', 'mr.first@example.com'),
    ],
    identities = [
      this.getContactIdentityDetails('DRIVING_LIC', 'Driving licence', 'LAST-87736799M', 'UK'),
      this.getContactIdentityDetails(
        'PASSPORT',
        'Passport number',
        '425362965',
        'Issuing authorithy - UK passport office',
      ),
      this.getContactIdentityDetails('NI_NUMBER', 'National insurance number', '06/614465M', 'UK'),
    ],
  }: Partial<GetContactResponse> = {}): GetContactResponse =>
    ({
      id,
      title,
      lastName,
      firstName,
      middleNames,
      dateOfBirth,
      estimatedIsOverEighteen,
      isDeceased,
      deceasedDate,
      createdBy,
      createdTime,
      languageCode,
      languageDescription,
      interpreterRequired,
      addresses,
      phoneNumbers,
      emailAddresses,
      identities,
    }) as GetContactResponse
}
