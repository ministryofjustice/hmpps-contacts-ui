import { PageAlert } from '../data/alertsApiTypes'

export default function pagedPrisonerAlertsData(overrides = {}): PageAlert {
  return {
    content: [
      {
        alertUuid: '31ab3746-3c8e-482c-8173-8833795fdfb4',
        prisonNumber: 'G5276UE',
        alertCode: {
          alertTypeCode: 'T',
          alertTypeDescription: 'Hold or transfer restriction',
          code: 'TAP',
          description: 'Accredited Programme hold',
        },
        description: 'gzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJLBgzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJL',
        authorisedBy: 'OSYQOSYQ',
        activeFrom: '2016-02-01',
        isActive: true,
        createdAt: '2015-09-25T13:56:34',
        createdBy: 'DQU83Q',
        createdByDisplayName: 'Azfgorigh Johneh',
        lastModifiedAt: '2017-05-09T21:53:32',
        lastModifiedBy: 'OMS_OWNER',
        lastModifiedByDisplayName: 'Admin&onb Cnomis',
      },
    ],
    ...overrides,
  }
}
