import { z } from 'zod'
import { createDateInputSchema, DateInputSchemaRule } from '../../../../utils/validation/dateSchema'

const dateOfBirthSchema = createDateInputSchema({
  inputId: 'dateOfBirth',
  inputDescription: 'date of birth',
  isOptional: true, // optional generally; FILTER path enforces presence
  additionalRule: DateInputSchemaRule.MUST_BE_PAST,
  additionalParams: {
    // Tell date schema to expect these fields
    day: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
  },
})

export const contactSearchSchema = z
  .object({
    searchType: z.enum(['NAME', 'ID', 'FILTER']),

    lastName: z.string().optional(),
    contactId: z.string().optional(),

    // Date is nested so we validate only when needed
    dateOfBirth: dateOfBirthSchema.optional(),
    middleNames: z.string().optional(),
    firstName: z.string().optional(),
    soundsLike: z.string().optional(),
    day: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    //
    // --- NAME MODE ---
    //
    if (data.searchType === 'NAME') {
      if (!data.lastName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Last Name is required when searching by contact name',
        })
      }
      // After main term validation: if any DOB fields provided, validate them
      const hasAnyDob = !!(data.day || data.month || data.year)
      if (hasAnyDob) {
        const dobResult = dateOfBirthSchema.safeParse({
          day: data.day,
          month: data.month,
          year: data.year,
        })
        if (!dobResult.success) {
          dobResult.error.issues.forEach(issue => {
            ctx.addIssue({ ...issue, path: issue.path })
          })
        }
      }
    }

    //
    // --- ID MODE ---
    //
    if (data.searchType === 'ID') {
      if (!data.contactId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contactId'],
          message: 'Contact ID is required when searching by ID',
        })
      }
      // After main term validation: if any DOB fields provided, validate them
      const hasAnyDob = !!(data.day || data.month || data.year)
      if (hasAnyDob) {
        const dobResult = dateOfBirthSchema.safeParse({
          day: data.day,
          month: data.month,
          year: data.year,
        })
        if (!dobResult.success) {
          dobResult.error.issues.forEach(issue => {
            ctx.addIssue({ ...issue, path: issue.path })
          })
        }
      }
    }

    //
    // --- FILTER MODE (Require and validate DOB) ---
    //
    if (data.searchType === 'FILTER') {
      if (!data.day && !data.month && !data.year) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter the date of birth',
          path: ['day'],
        })
        return
      }
      const dobResult = dateOfBirthSchema.safeParse({
        day: data.day,
        month: data.month,
        year: data.year,
      })
      if (!dobResult.success) {
        dobResult.error.issues.forEach(issue => {
          ctx.addIssue({ ...issue, path: issue.path })
        })
      }
    }
  })

export type ContactSearchSchemaType = z.infer<typeof contactSearchSchema>
