const formatYesNo = (val: string | boolean): string => {
  switch (val) {
    case 'YES':
    case true:
      return 'Yes'
    case 'NO':
    case false:
      return 'No'
    case 'DO_NOT_KNOW':
      return "I don't know"
    default:
      return ''
  }
}

export default formatYesNo
