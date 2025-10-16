import { PageAlert } from '../../data/alertsApiTypes'

export default class AlertTestData {
  static stubAlertData = (): PageAlert => {
    return {
      content: [
        {
          alertUuid: '8cdadcf3-b003-4116-9956-c99bd8df6a00',
          prisonNumber: 'A1234AA',
          alertCode: {
            alertTypeCode: 'A',
            alertTypeDescription: 'Alert type description',
            code: 'ABC',
            description: 'Alert code description',
          },
          description: 'Alert description',
          authorisedBy: 'A. Nurse, An Agency',
          activeFrom: '2021-09-27',
          activeTo: '2022-07-15',
          isActive: true,
          createdAt: '2021-09-27T14:19:25',
          createdBy: 'USER1234',
          createdByDisplayName: 'Firstname Lastname',
          lastModifiedAt: '2022-07-15T15:24:56',
          lastModifiedBy: 'USER1234',
          lastModifiedByDisplayName: 'Firstname Lastname',
          activeToLastSetAt: '2022-07-15T15:24:56',
          activeToLastSetBy: 'USER1234',
          activeToLastSetByDisplayName: 'Firstname Lastname',
          madeInactiveAt: '2022-07-15T15:24:56',
          madeInactiveBy: 'USER1234',
          madeInactiveByDisplayName: 'Firstname Lastname',
          prisonCodeWhenCreated: 'LEI',
        },
      ],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
      },
      totalElements: 1,
    } as PageAlert
  }
}
