import { getAnnouncement } from './announcement'

describe('announcement', () => {
  describe('getAnnouncement', () => {
    it.each([
      ['KMI', undefined],
      ['GNI', undefined],
      ['SPI', undefined],
      ['LGI', undefined],
      ['DWI', undefined],
      ['HOI', undefined],
      ['WWI', undefined],
      [
        'MDI',
        {
          title: `You have limited access to the new Contacts service on DPS`,
          html: expect.stringContaining('managingcontacts@justice.gov.uk'),
        },
      ],
      [
        'XXX',
        {
          title: `You have limited access to the new Contacts service on DPS`,
          html: expect.stringContaining('managingcontacts@justice.gov.uk'),
        },
      ],
      [
        '',
        {
          title: `You have limited access to the new Contacts service on DPS`,
          html: expect.stringContaining('managingcontacts@justice.gov.uk'),
        },
      ],
    ])('should return correct announcement for prison code %s', (prison, expected) => {
      const result = getAnnouncement(prison)
      if (expected === undefined) {
        expect(result).toBeUndefined()
      } else {
        expect(result).toMatchObject(expected)
      }
    })
  })
})
