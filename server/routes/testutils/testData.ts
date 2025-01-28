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
type ContactAddressPhoneDetails = components['schemas']['ContactAddressPhoneDetails']
type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']
type LinkedPrisonerRelationshipDetails = components['schemas']['LinkedPrisonerRelationshipDetails']
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
    verifiedBy = undefined,
    verifiedTime = undefined,
    mailFlag = false,
    startDate = '2020-01-02',
    endDate = undefined,
    noFixedAddress = false,
    phoneNumbers = [
      {
        contactAddressPhoneId: 4,
        contactAddressId: 3,
        contactPhoneId: 2,
        contactId: 1,
        phoneType: 'HOME',
        phoneTypeDescription: 'Home',
        phoneNumber: '01111 777777',
        extNumber: '+0123',
        createdBy: 'JAMES',
        createdTime: '2024-10-04T15:35:23.101675v',
        updatedBy: undefined,
        updatedTime: undefined,
      } as ContactAddressPhoneDetails,
    ],
    comments = 'Some comments',
    createdBy = 'TIM',
    createdTime = '2024-10-04T0 =3 =44.512401',
    updatedBy = undefined,
    updatedTime = undefined,
  }: Partial<ContactAddressDetails>) => {
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
      comments,
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
    issuingAuthority?: string,
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
    extNumber: string | undefined = undefined,
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
      updatedBy: undefined,
      updatedTime: undefined,
    } as ContactPhoneDetails
  }

  static getAddressPhoneNumberDetails = (
    phoneType: string,
    phoneTypeDescription: string,
    phoneNumber: string,
    contactAddressPhoneId: number = 3,
    contactAddressId: number = 2,
    contactPhoneId: number = 1,
    extNumber: string | undefined = undefined,
    createdTime: string = '2024-10-04T15:35:23.101675',
  ): ContactAddressPhoneDetails => {
    return {
      contactAddressPhoneId,
      contactAddressId,
      contactPhoneId,
      contactId: 1,
      phoneType,
      phoneTypeDescription,
      phoneNumber,
      extNumber,
      createdBy: 'TIM',
      createdTime,
      updatedBy: undefined,
      updatedTime: undefined,
    } as ContactAddressPhoneDetails
  }

  static getContactEmailDetails = (emailAddress: string, contactEmailId: number) => {
    return {
      contactEmailId,
      contactId: 1,
      emailAddress,
      createdBy: 'TIM',
      createdTime: '2024-10-08T12:16:09.024803',
      updatedBy: undefined,
      updatedTime: undefined,
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
      relationshipToPrisoner: 'FR',
      relationshipToPrisonerDescription: 'Father',
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
    addresses = [],
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
      addresses,
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
    middleNames = undefined,
    dateOfBirth = '1990-01-14',
    isStaff = false,
    isDeceased = false,
    deceasedDate = undefined,
    createdBy = 'USER1',
    createdTime = '2024-09-20T10:30:00.000000',
    languageCode = 'ENG',
    languageDescription = 'English',
    interpreterRequired = false,
    addresses = [this.address({})],
    phoneNumbers = [
      this.getContactPhoneNumberDetails('MOBILE', 'Mobile', '07878 111111'),
      this.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777'),
    ],
    emailAddresses = [
      this.getContactEmailDetails('mr.last@example.com', 1),
      this.getContactEmailDetails('mr.first@example.com', 2),
    ],
    identities = [
      this.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', undefined, 1),
      this.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2),
      this.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', undefined, 3),
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
    relationshipToPrisonerCode = 'FRI',
    relationshipToPrisonerDescription = 'Friend',
    emergencyContact = false,
    nextOfKin = true,
    isRelationshipActive = true,
    isApprovedVisitor = true,
    comments = 'Some comments',
  }: Partial<PrisonerContactRelationshipDetails> = {}): PrisonerContactRelationshipDetails =>
    ({
      relationshipToPrisonerCode,
      relationshipToPrisonerDescription,
      emergencyContact,
      nextOfKin,
      isRelationshipActive,
      isApprovedVisitor,
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
    middleNames = undefined,
    dateOfBirth = '1990-01-14',
    isStaff = false,
    deceasedFlag = false,
    gender = 'Male',
    domesticStatus = 'Single',
    deceasedDate = undefined,
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
    enteredByUsername = 'USER1',
    enteredByDisplayName = 'User One',
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
      enteredByUsername,
      enteredByDisplayName,
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
    enteredByUsername = 'USER1',
    enteredByDisplayName = 'User One',
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
      enteredByUsername,
      enteredByDisplayName,
      createdBy: 'USER1',
      createdTime,
      updatedBy: 'USER2',
      updatedTime: '2024-09-21T10:30:00.000000',
    }) as PrisonerContactRestrictionDetails

  static getLinkedPrisonerDetails = ({
    prisonerNumber = 'A1234BC',
    lastName = 'Last',
    firstName = 'First',
    middleNames = undefined,
    relationships = [
      TestData.getLinkedPrisonerRelationshipDetails(),
      TestData.getLinkedPrisonerRelationshipDetails({
        prisonerContactId: 2,
        relationshipType: 'O',
        relationshipTypeDescription: 'Official',
        relationshipToPrisoner: 'DR',
        relationshipToPrisonerDescription: 'Doctor',
      }),
    ],
  }: Partial<LinkedPrisonerDetails> = {}): LinkedPrisonerDetails =>
    ({
      prisonerNumber,
      lastName,
      firstName,
      middleNames,
      relationships,
    }) as LinkedPrisonerDetails

  static getLinkedPrisonerRelationshipDetails = ({
    prisonerContactId = 1,
    relationshipType = 'S',
    relationshipTypeDescription = 'Social/Family',
    relationshipToPrisoner = 'FRI',
    relationshipToPrisonerDescription = 'Friend',
  }: Partial<LinkedPrisonerRelationshipDetails> = {}): LinkedPrisonerRelationshipDetails =>
    ({
      prisonerContactId,
      relationshipType,
      relationshipTypeDescription,
      relationshipToPrisoner,
      relationshipToPrisonerDescription,
    }) as LinkedPrisonerRelationshipDetails
}
