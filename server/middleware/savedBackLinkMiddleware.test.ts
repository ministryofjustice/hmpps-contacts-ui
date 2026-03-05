import type { Request, Response } from 'express'
import savedBackLinkMiddleware from './savedBackLinkMiddleware'

describe('savedBackLinkMiddleware', () => {
  const req = {
    session: {},
    params: {},
  } as Request
  const res = {
    locals: {
      user: {},
    },
  } as Response
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should call next if no userBackLink in session', () => {
    savedBackLinkMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should keep back link and populate res.locals if still in relevant journey (same prisonerContactId)', () => {
    req.session.userBackLink = {
      url: '/some-url',
      service: 'prisoner-profile',
      prisonerContactId: '123',
    }

    req.params.prisonerContactId = '123'

    savedBackLinkMiddleware()(req, res, next)

    expect(res.locals.user.backLink).toEqual(req.session.userBackLink)
    expect(next).toHaveBeenCalled()
  })

  it('should remove back link if not in relevant journey (different prisonerContactId)', () => {
    req.session.userBackLink = {
      url: '/some-url',
      service: 'prisoner-profile',
      prisonerContactId: '123',
    }

    req.params.prisonerContactId = '456'

    savedBackLinkMiddleware()(req, res, next)

    expect(req.session.userBackLink).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })
})
