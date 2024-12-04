import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { components } from '../../@types/contactsApi'

type ContactSearchResultItem = components['schemas']['ContactSearchResultItem']
type ContactDetails = components['schemas']['ContactDetails']
type ContactAddressDetails = components['schemas']['ContactAddressDetails']
type ContactPhoneDetails = components['schemas']['ContactPhoneDetails']
type ContactPhoneNumberDetails = components['schemas']['ContactPhoneDetails']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type PrisonerContactSummaryPage = components['schemas']['PrisonerContactSummaryPage']
type PrisonerContactSummary = components['schemas']['PrisonerContactSummary']
type ContactIdentityDetails = components['schemas']['ContactIdentityDetails']
type PatchContactResponse = components['schemas']['PatchContactResponse']
type PrisonerContactRelationshipDetails = components['schemas']['PrisonerContactRelationshipDetails']
type ContactRestrictionDetails = components['schemas']['ContactRestrictionDetails']
type PrisonerContactRestrictionDetails = components['schemas']['PrisonerContactRestrictionDetails']
export default class TestData {
  static address = ({
    contactAddressId = 1,
    contactId = 1,
    addressType = 'HOME',
    addressTypeDescription = 'Home address',
    primaryAddress = true,
    flat = '',
    property = '24',
    street = 'Acacia Avenue',
    area = 'Bunting',
    cityCode = '25343',
    cityDescription = 'Sheffield',
    countyCode = 'S.YORKSHIRE',
    countyDescription = 'South Yorkshire',
    postcode = 'S2 3LK',
    countryCode = 'ENG',
    countryDescription = 'England',
    verified = false,
    verifiedBy = null,
    verifiedTime = null,
    mailFlag = false,
    startDate = '2020-01-02',
    endDate = null,
    noFixedAddress = false,
    phoneNumbers = [
      {
        contactPhoneId: 2,
        contactId: 1,
        phoneType: 'HOME',
        phoneTypeDescription: 'Home phone',
        phoneNumber: '01111 777777',
        extNumber: '+0123',
        createdBy: 'JAMES',
        createdTime: '2024-10-04T15:35:23.101675v',
        updatedBy: null,
        updatedTime: null,
      },
    ],
    createdBy = 'TIM',
    createdTime = '2024-10-04T0 =3 =44.512401',
    updatedBy = null,
    updatedTime = null,
  }) => {
    return {
      contactAddressId,
      contactId,
      addressType,
      addressTypeDescription,
      primaryAddress,
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postcode,
      countryCode,
      countryDescription,
      verified,
      verifiedBy,
      verifiedTime,
      mailFlag,
      startDate,
      endDate,
      noFixedAddress,
      phoneNumbers,
      createdBy,
      createdTime,
      updatedBy,
      updatedTime,
    } as ContactAddressDetails
  }

  static getContactIdentityDetails = (
    identityType: string,
    identityTypeDescription: string,
    identityValue: string,
    issuingAuthority: string,
    contactIdentityId: number = 1,
    identityTypeIsActive: boolean = true,
  ) => {
    return {
      contactIdentityId,
      contactId: 1,
      identityType,
      identityTypeDescription,
      identityTypeIsActive,
      identityValue,
      issuingAuthority,
      verified: true,
      verifiedBy: 'JAMES',
      verifiedTime: '2024-10-08T15:22:59.604791',
      createdBy: 'TIM',
      createdTime: '2024-10-08T15:22:59.604791',
      updatedBy: '',
      updatedTime: '',
    } as ContactIdentityDetails
  }

  static getContactPhoneNumberDetails = (
    phoneType: string,
    phoneTypeDescription: string,
    phoneNumber: string,
    contactPhoneId: number = 1,
    extNumber: string = null,
    createdTime: string = '2024-10-04T15:35:23.101675',
  ): ContactPhoneNumberDetails => {
    return {
      contactPhoneId,
      contactId: 1,
      phoneType,
      phoneTypeDescription,
      phoneNumber,
      extNumber,
      createdBy: 'TIM',
      createdTime,
      updatedBy: null,
      updatedTime: null,
    } as ContactPhoneDetails
  }

  static getContactEmailDetails = (emailAddress: string, contactEmailId: number) => {
    return {
      contactEmailId,
      contactId: 1,
      emailAddress,
      createdBy: 'TIM',
      createdTime: '2024-10-08T12:16:09.024803',
      updatedBy: null,
      updatedTime: null,
    } as ContactEmailDetails
  }

  static getPrisonerContact = () => {
    return {
      prisonerContactId: 31,
      contactId: 22,
      prisonerNumber: 'G4793VF',
      lastName: 'Davis',
      firstName: 'Daniel',
      middleNames: 'M.',
      dateOfBirth: '1990-01-23',
      estimatedIsOverEighteen: null,
      relationshipCode: 'FR',
      relationshipDescription: 'Father',
      flat: '',
      property: '40',
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityCode: '25343',
      cityDescription: 'Sheffield',
      countyCode: 'York',
      countyDescription: '',
      postCode: 'S2 3LK',
      countryCode: 'ENG',
      countryDescription: 'England',
      approvedVisitor: false,
      nextOfKin: false,
      emergencyContact: false,
      currentTerm: true,
      comments: 'Active Comment',
    } as PrisonerContactSummary
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
    id = 22,
    title = 'MR',
    lastName = 'Mason',
    firstName = 'Jones',
    middleNames = null,
    dateOfBirth = '1990-01-14',
    estimatedIsOverEighteen = 'YES',
    isStaff = false,
    isDeceased = false,
    deceasedDate = null,
    createdBy = 'USER1',
    createdTime = '2024-09-20T10:30:00.000000',
    languageCode = 'ENG',
    languageDescription = 'English',
    interpreterRequired = false,
    addresses = [this.address({})],
    phoneNumbers = [
      this.getContactPhoneNumberDetails('MOBILE', 'Mobile phone', '07878 111111'),
      this.getContactPhoneNumberDetails('HOME', 'Home phone', '01111 777777'),
    ],
    emailAddresses = [
      this.getContactEmailDetails('mr.last@example.com', 1),
      this.getContactEmailDetails('mr.first@example.com', 2),
    ],
    identities = [
      this.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', null, 1),
      this.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2),
      this.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', null, 3),
    ],
    gender = 'M',
    genderDescription = 'Male',
    domesticStatusCode = 'S',
    domesticStatusDescription = 'Single-not married/in civil partnership',
  }: Partial<ContactDetails> = {}): ContactDetails =>
    ({
      id,
      title,
      lastName,
      firstName,
      middleNames,
      dateOfBirth,
      estimatedIsOverEighteen,
      isStaff,
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
      gender,
      genderDescription,
      domesticStatusCode,
      domesticStatusDescription,
    }) as ContactDetails

  static prisonerContactRelationship = ({
    relationshipCode = 'FRI',
    relationshipDescription = 'Friend',
    emergencyContact = false,
    nextOfKin = true,
    isRelationshipActive = true,
    comments = 'Some comments',
  }: Partial<PrisonerContactRelationshipDetails> = {}): PrisonerContactRelationshipDetails =>
    ({
      relationshipCode,
      relationshipDescription,
      emergencyContact,
      nextOfKin,
      isRelationshipActive,
      comments,
    }) as PrisonerContactRelationshipDetails

  static prisonerContactSummaryPage = ({
    content = [this.getPrisonerContact()],
    pageable = {
      pageNumber: 3,
      pageSize: 10,
      offset: 0,
      paged: true,
      unpaged: false,
    },
    totalElements = 542,
    totalPages = 55,
    first = false,
    size = 10,
    number = 3,
    numberOfElements = 10,
    empty = false,
  }: Partial<PrisonerContactSummaryPage> = {}): PrisonerContactSummaryPage =>
    ({
      content,
      pageable,
      totalElements,
      totalPages,
      first,
      size,
      number,
      numberOfElements,
      empty,
    }) as PrisonerContactSummaryPage

  static patchContact = ({
    id = 22,
    title = 'MR',
    lastName = 'Mason',
    firstName = 'Jones',
    middleNames = null,
    dateOfBirth = '1990-01-14',
    estimatedIsOverEighteen = 'YES',
    isStaff = false,
    deceasedFlag = false,
    gender = 'Male',
    domesticStatus = 'Single',
    deceasedDate = null,
    languageCode = 'ENG',
    interpreterRequired = false,
    createdBy = 'USER1',
    createdTime = '2024-09-20T10:30:00.000000',
    updatedBy = 'USER2',
    updatedTime = '2024-09-21T10:30:00.000000',
  }: Partial<PatchContactResponse> = {}): PatchContactResponse =>
    ({
      id,
      title,
      lastName,
      firstName,
      middleNames,
      dateOfBirth,
      estimatedIsOverEighteen,
      isStaff,
      deceasedFlag,
      deceasedDate,
      gender,
      domesticStatus,
      languageCode,
      interpreterRequired,
      createdBy,
      createdTime,
      updatedBy,
      updatedTime,
    }) as PatchContactResponse

  static getContactRestrictionDetails = ({
    contactRestrictionId = 1,
    contactId = 22,
    restrictionType = 'CHILD',
    startDate = '2024-01-01',
    expiryDate = '2050-08-01',
    createdTime = '2024-09-20T10:30:00.000000',
    restrictionTypeDescription = 'Child Visitors to be Vetted',
    comments = 'Keep an eye',
  }: Partial<ContactRestrictionDetails> = {}): ContactRestrictionDetails =>
    ({
      contactRestrictionId,
      contactId,
      restrictionType,
      restrictionTypeDescription,
      startDate,
      expiryDate,
      comments,
      createdBy: 'USER1',
      createdTime,
      updatedBy: 'USER2',
      updatedTime: '2024-09-21T10:30:00.000000',
    }) as ContactRestrictionDetails

  static getPrisonerContactRestrictionDetails = ({
    prisonerContactRestrictionId = 1,
    contactId = 22,
    prisonerNumber = 'A1234BC',
    restrictionType = 'CHILD',
    startDate = '2024-01-01',
    expiryDate = '2050-08-01',
    createdTime = '2024-09-20T10:30:00.000000',
    restrictionTypeDescription = 'Child Visitors to be Vetted',
    comments = 'Keep an eye',
  }: Partial<PrisonerContactRestrictionDetails> = {}): PrisonerContactRestrictionDetails =>
    ({
      prisonerContactRestrictionId,
      contactId,
      prisonerNumber,
      restrictionType,
      restrictionTypeDescription,
      startDate,
      expiryDate,
      comments,
      createdBy: 'USER1',
      createdTime,
      updatedBy: 'USER2',
      updatedTime: '2024-09-21T10:30:00.000000',
    }) as PrisonerContactRestrictionDetails
}
