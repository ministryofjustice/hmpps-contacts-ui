const formatYesNo = (val: string): string => {
  switch (val) {
    case 'YES':
      return 'Yes'
    case 'NO':
      return 'No'
    case 'DO_NOT_KNOW':
      return "I don't know"
    default:
      return ''
  }
}

export default formatYesNo
