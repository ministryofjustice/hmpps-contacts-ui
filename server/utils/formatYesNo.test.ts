import formatYesNo from './formatYesNo'

describe('yesNoFilter', () => {
  it.each([
    ['YES', 'Yes'],
    [true, 'Yes'],
    ['NO', 'No'],
    [false, 'No'],
    ['DO_NOT_KNOW', "I don't know"],
    ['FOO', ''],
    [undefined, ''],
  ])('Formats yes no and do not know correctly', (value, expected) => {
    expect(formatYesNo(value)).toStrictEqual(expected)
  })
})
