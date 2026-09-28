// app/lib/schemas/booking.schema.ts
//
// Single source of truth for what a valid trip request looks like.
// Used in TWO places:
//   1. Client-side, via zodResolver in the React Hook Form (app/book/page.tsx)
//      — gives instant inline errors before any network call.
//   2. Server-side, inside the server action (app/book/actions.ts)
//      — the actual gate. The client check is UX; this is the one that
//      matters, since this is a public route anyone could POST to directly,
//      bypassing the form entirely.
//
// Keeping one file for both means a validation rule only has to change
// in one place.

import { z } from 'zod'

const phoneRegex = /^(\+?234|0)[789]\d{9}$/ // Nigerian mobile numbers

export const bookingSchema = z
  .object({
    isRoundTrip: z.boolean(),

    pickup: z
      .string()
      .trim()
      .min(2, 'Enter a pickup location')
      .max(100),

    destination: z
      .string()
      .trim()
      .min(2, 'Enter a destination')
      .max(100),

    departureDate: z
      .string()
      .min(1, 'Choose a departure date')
      .refine(val => new Date(val) >= new Date(new Date().toDateString()), {
        message: 'Departure date can\u2019t be in the past',
      }),

    returnDate: z.string().optional(),

    vehicleType: z.enum(['bus', 'minibus', 'van', 'no_preference'], {
  errorMap: () => ({ message: 'Choose a vehicle type' }),
}),

    passengerCount: z
      .number({ invalid_type_error: 'Enter number of passengers' })
      .int()
      .min(1, 'At least 1 passenger')
      .max(30, 'For groups over 30, please call us directly'),

    specialRequirements: z.string().max(300).optional(),

    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(80),

    email: z.string().trim().email('Enter a valid email address'),

    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Enter a valid Nigerian phone number'),
  })
  // Cross-field rule: return date is required, and must be after departure,
  // ONLY when isRoundTrip is true. This is exactly the kind of rule that's
  // awkward to express with plain HTML `required` attributes but trivial
  // with Zod's .refine().
  .refine(
    data => {
      if (!data.isRoundTrip) return true
      return !!data.returnDate
    },
    { message: 'Choose a return date', path: ['returnDate'] }
  )
  .refine(
    data => {
      if (!data.isRoundTrip || !data.returnDate) return true
      return new Date(data.returnDate) > new Date(data.departureDate)
    },
    { message: 'Return date must be after departure date', path: ['returnDate'] }
  )

export type BookingFormValues = z.infer<typeof bookingSchema>
