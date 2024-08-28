import 'reflect-metadata'
import { Request, Response } from 'express'
import z from 'zod'
import { validate } from './validationMiddleware'

const TOO_LONG_ERROR_MSG = 'Additional information must be 4,000 characters or less'
const DESCRIPTION_OF_INFORMATION = 'Enter information description'
const DESCRIPTION_OF_OTHER_INFORMATION = 'Enter other information description'

describe('validationMiddleware', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('middleware', () => {
    const res = { redirect: jest.fn(), locals: {} } as unknown as Response
    let req = {} as Request

    const schema = z.object({
      information: z
        .string({ message: DESCRIPTION_OF_INFORMATION })
        .max(4000, TOO_LONG_ERROR_MSG)
        .transform(val => (val?.length ? val : null))
        .refine(val => val && val.trim().length > 0, DESCRIPTION_OF_INFORMATION),
      otherInformation: z
        .string({ message: DESCRIPTION_OF_OTHER_INFORMATION })
        .max(4000, TOO_LONG_ERROR_MSG)
        .transform(val => (val?.length ? val : null))
        .refine(val => val && val.trim().length > 0, DESCRIPTION_OF_OTHER_INFORMATION),
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should call next when there are no validation errors', async () => {
      const next = jest.fn()
      req = {
        params: {},
        body: {
          information: 'test',
          otherInformation: 'test',
        },
        session: {},
      } as Request

      await validate(schema)(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should return flash responses for info', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          information: '',
          otherInformation: 'other info here',
        },
        session: {},
      } as unknown as Request

      await validate(schema)(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ information: [DESCRIPTION_OF_INFORMATION] }),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
    })
    it('should redirect to error url if specified', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          information: '',
          otherInformation: 'other info here',
        },
        session: {},
      } as unknown as Request
      const redirectUrl = '/some-page-where-errors-are-shown'

      await validate(schema, redirectUrl)(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith(redirectUrl)
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ information: [DESCRIPTION_OF_INFORMATION] }),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
    })

    it('should return flash responses for other info', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          information: 'info here',
          otherInformation: '',
        },
        session: {},
      } as unknown as Request

      await validate(schema)(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ otherInformation: [DESCRIPTION_OF_OTHER_INFORMATION] }),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
    })

    it('should return flash responses for info and other info', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          information: '',
          otherInformation: '',
        },
        session: {},
      } as unknown as Request

      await validate(schema)(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({
          information: [DESCRIPTION_OF_INFORMATION],
          otherInformation: [DESCRIPTION_OF_OTHER_INFORMATION],
        }),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
    })
  })
})
