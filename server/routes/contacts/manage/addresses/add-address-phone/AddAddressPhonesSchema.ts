import { z } from 'zod'
import { Request } from 'express'
import { createSchema } from '../../../../../middleware/validationMiddleware'
import { phoneNumberSchema } from '../../phone/phoneSchemas'

export const phonesSchema = async (req: Request<unknown, unknown, { save?: string }>) =>
  createSchema({
    phones: z.array(
      req.body.save === undefined
        ? createSchema({
            type: z.string().optional(),
            phoneNumber: z.string().optional(),
            extension: z.string().optional(),
          })
        : phoneNumberSchema,
    ),
    save: z.string().optional(),
    add: z.string().optional(),
    remove: z.string().optional(),
  })

export type PhonesSchemaType = z.infer<Awaited<ReturnType<typeof phonesSchema>>>

export const optionalPhonesSchema = async (
  req: Request<
    unknown,
    unknown,
    {
      save?: string
      phones?: {
        type?: string
        phoneNumber?: string
        extension?: string
      }[]
    }
  >,
) => {
  const isAllBlank = req.body.phones?.every(
    phone => phone.type === '' && phone.phoneNumber === '' && phone.extension === '',
  )
  return createSchema({
    phones: z.array(
      req.body.save === undefined || isAllBlank
        ? createSchema({
            type: z.string().optional(),
            phoneNumber: z.string().optional(),
            extension: z.string().optional(),
          })
        : phoneNumberSchema,
    ),
    save: z.string().optional(),
    add: z.string().optional(),
    remove: z.string().optional(),
  }).transform(({ phones, save, add, remove }) => ({
    phones: isAllBlank
      ? undefined
      : phones.map(({ type, phoneNumber, extension }) => ({
          type: type!,
          phoneNumber: phoneNumber!,
          extension,
        })),
    save,
    add,
    remove,
  }))
}

export type OptionalPhonesSchemaType = z.infer<Awaited<ReturnType<typeof optionalPhonesSchema>>>
