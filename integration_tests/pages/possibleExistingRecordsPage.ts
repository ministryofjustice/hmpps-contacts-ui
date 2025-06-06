import Page from './page'

export default class PossibleExistingRecordsPage extends Page {
  constructor(hasMultipleMatches: boolean) {
    super(
      hasMultipleMatches ? 'Possible existing records have been found' : 'A possible existing record has been found',
    )
  }
}
