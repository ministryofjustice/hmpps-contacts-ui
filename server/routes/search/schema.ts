import z from 'zod'

export const ENTER_TWO_CHARS_MIN = 'You must enter at least 2 characters'

export const schema = z.object({
  search: z
    .string({ message: ENTER_TWO_CHARS_MIN })
    .min(2, ENTER_TWO_CHARS_MIN)
    .transform(val => (val?.length ? val : null))
    .refine(val => val && val.trim().length > 0, ENTER_TWO_CHARS_MIN),
})

export type SchemaType = z.infer<typeof schema>
