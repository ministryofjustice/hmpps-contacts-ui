import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { components } from '../../@types/contactsApi'

type ContactSearchResultItem = components['schemas']['ContactSearchResultItem']
type GetContactResponse = components['schemas']['GetContactResponse']
export default class TestData {
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
    middleName = 'M.',
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
      middleName,
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
    middleName = null,
    dateOfBirth = '1990-01-14',
    estimatedIsOverEighteen = null,
    isDeceased = false,
    deceasedDate = null,
    createdBy = 'USER1',
    createdTime = '2024-09-20T10:30:00.000000',
    addresses = [
      {
        contactAddressId: 1,
        contactId: 1,
        addressType: 'HOME',
        addressTypeDescription: 'Home address',
        primaryAddress: true,
        flat: null,
        property: '24',
        street: 'Acacia Avenue',
        area: 'Bunting',
        cityCode: '25343',
        // cityDescriptionv: 'Sheffield',
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
        endDate: null,
        noFixedAddress: false,
        createdBy: 'TIM',
        createdTime: '2024-10-04T0 =3 =44.512401',
        amendedBy: null,
        amendedTime: null,
      },
    ],
  }: Partial<GetContactResponse> = {}): GetContactResponse =>
    ({
      id,
      title,
      lastName,
      firstName,
      middleName,
      dateOfBirth,
      estimatedIsOverEighteen,
      isDeceased,
      deceasedDate,
      createdBy,
      createdTime,
      addresses,
    }) as GetContactResponse
}
