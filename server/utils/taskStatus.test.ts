import { taskStatus } from './taskStatus'

describe('taskStatus', () => {
  it.each(['Something', { myObj: true }, ['array with value']])('should return entered if there is a value %S', val => {
    expect(taskStatus(val)).toStrictEqual({
      text: 'Entered',
    })
  })

  it.each(['', undefined, []])('should return not entered tag if there is no value %s', val => {
    expect(taskStatus(val)).toStrictEqual({
      tag: {
        text: 'Not entered',
        classes: 'govuk-tag--blue',
      },
    })
  })
})
