import formatYesNo from './formatYesNo'

describe('yesNoFilter', () => {
  it.each([
    ['YES', 'Yes'],
    ['NO', 'No'],
    ['DO_NOT_KNOW', "I don't know"],
    ['FOO', ''],
    [undefined, ''],
  ])('Formats yes no and do not know correctly', (value: string, expected: string) => {
    expect(formatYesNo(value)).toStrictEqual(expected)
  })
})
