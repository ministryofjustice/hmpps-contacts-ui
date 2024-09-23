import { CurrentIncentive, Prisoner } from '../../data/prisonerOffenderSearchTypes'

import { components } from '../../@types/contactsApi'

type ContactSearch = components['schemas']['ContactSearch']
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

  static contacts = ({
    id = 13,
    lastName = 'Mason',
    firstName = 'Jones',
    middleName = 'M.',
    dateOfBirth = '1990-01-14',
    flat = '32',
    property = '',
    street = 'Acacia Avenue',
    area = 'Bunting',
    cityCode = 'SHEF',
    countyCode = 'SYORKS',
    postCode = 'S2 3LK',
    countryCode = 'UK',
    createdBy = 'User13',
    createdTime = '2024-09-11T11:08:26.191824',
  }: Partial<ContactSearch> = {}): ContactSearch =>
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
      countyCode,
      postCode,
      countryCode,
      createdBy,
      createdTime,
    }) as ContactSearch
}
