import Page from './page'

export default class AuthSignInPage extends Page {
  constructor() {
    super(
      'Sign in',
      { skipA11yCheck: true }, // Stub page as this is provided by HMPPS auth service
    )
  }
}
