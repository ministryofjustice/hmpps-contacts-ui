import addressToLines from './addressToLines'

describe('Convert address to string', () => {
  it('should convert array to string with a breakline tag', () => {
    const address = {
      flat: '24',
      premise: '',
      street: 'Acacia Avenue',
      area: 'Bunting',
      city: 'SHEF',
      county: 'SYORKS',
      postalCode: 'S2 3LK',
      country: 'UK',
    }

    const result = addressToLines(address)

    expect(result).toContain('24, Acacia Avenue<br />Bunting<br />SHEF<br />SYORKS<br />S2 3LK<br />UK')
  })
})
