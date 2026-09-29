'use client'

// app/booking/page.tsx
//
// Matches Hero.tsx's design tokens exactly (same fonts, same color values)
// so this page feels like a continuation of the homepage, not a bolt-on.
//
// Flow: form → submit → same page swaps form for confirmation → sign-in
// prompt modal appears a beat after.
//
// ── Animation notes ──────────────────────────────────────────────────────────
// Assumes GSAP + @gsap/react are already installed (per the homepage setup).
// Every animation here is kept short (0.3–0.5s) and restrained — the only
// place with any real personality is the confirmation checkmark, since
// that's the actual payoff moment of the whole form.

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Space_Grotesk, Inter } from 'next/font/google'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

import { bookingSchema, type BookingFormValues } from '../lib/schemas/booking.schema';
import { submitTripRequest } from '../lib/actions/actions'
import DateField from '../components/DateField'
import SignInPromptModal from '../components/SignInPromptModal'

gsap.registerPlugin(useGSAP)

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })

// Same states referenced on the homepage — used as datalist suggestions,
// not a hard restriction, since the schema takes free text for pickup/destination.
const SUGGESTED_LOCATIONS = ['Lagos', 'Ibadan', 'Abeokuta', 'Ekiti', 'Port Harcourt', 'Osun', 'Ondo']

const COMPANY_NAME = 'Safeway'

const VEHICLE_OPTIONS: { value: BookingFormValues['vehicleType']; label: string; hint: string }[] = [
  { value: 'bus',           label: 'Coaster bus',   hint: 'Best for 14+ passengers' },
  { value: 'minibus',       label: 'Minibus',       hint: '8–14 passengers' },
  { value: 'van',           label: 'Van',           hint: 'Small group or luggage-heavy trips' },
  { value: 'no_preference', label: 'No preference', hint: 'We\u2019ll pick what fits best' },
]

// ── Small shared animation helpers ────────────────────────────────────────────

/** Tactile click feedback — a quick squash-and-settle. */
function popScale(el: HTMLElement | null) {
  if (!el) return
  gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.35, ease: 'back.out(2.2)' })
}

/** Brief gold→ink flash to mark that a value just changed. */
function flashUpdate(el: HTMLElement | null) {
  if (!el) return
  gsap.fromTo(el, { color: '#E2A63B' }, { color: '#0D1424', duration: 0.6, ease: 'power2.out' })
}

export default function BookPage() {
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Anti-abuse: kept outside react-hook-form's typed state on purpose.
  // `honeypot` and `turnstileToken` aren't part of BookingFormValues, so
  // wiring them through `register` would fight the useForm<BookingFormValues>
  // generic. A plain ref + local state is simpler and keeps the form's type
  // exactly matching the schema that also validates server-side.
  const honeypotRef = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      isRoundTrip: false,
      vehicleType: 'bus',
      passengerCount: 1,
    },
  })

  const isRoundTrip     = watch('isRoundTrip')
  const pickup          = watch('pickup')
  const destination     = watch('destination')
  const departureDate   = watch('departureDate')
  const returnDate      = watch('returnDate')
  const vehicleType     = watch('vehicleType')
  const passengerCount  = watch('passengerCount')

  // ── Animation refs ───────────────────────────────────────────────────────────
  const rootRef            = useRef<HTMLDivElement>(null)
  const headerRef          = useRef<HTMLElement>(null)
  const formCardRef        = useRef<HTMLFormElement>(null)
  const sidebarRef         = useRef<HTMLDivElement>(null)
  const confirmationRef    = useRef<HTMLDivElement>(null)
  const checkCircleRef     = useRef<HTMLDivElement>(null)
  const checkPathRef       = useRef<SVGPathElement>(null)
  const passengerNumRef    = useRef<HTMLSpanElement>(null)
  const routeValueRef      = useRef<HTMLParagraphElement>(null)
  const dateValueRef       = useRef<HTMLParagraphElement>(null)
  const vehicleValueRef    = useRef<HTMLParagraphElement>(null)
  const paxValueRef        = useRef<HTMLParagraphElement>(null)

  // Toggle indicator refs
  const toggleTrackRef  = useRef<HTMLDivElement>(null)
  const toggleIndicatorRef = useRef<HTMLDivElement>(null)
  const oneWayBtnRef    = useRef<HTMLButtonElement>(null)
  const roundTripBtnRef = useRef<HTMLButtonElement>(null)

  // "Have we already run this once" flags, so effects that respond to a
  // value changing don't also fire (and look busy) on first mount.
  const toggleMounted     = useRef(false)
  const passengerMounted  = useRef(false)
  const routeMounted      = useRef(false)
  const dateMounted       = useRef(false)
  const vehicleMounted    = useRef(false)
  const paxMounted        = useRef(false)

  // ── Page-load entrance (form state only — runs once on mount) ────────────────
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    if (headerRef.current) tl.from(headerRef.current, { y: -16, opacity: 0, duration: 0.5 })
    tl.from('.page-heading', { y: 14, opacity: 0, duration: 0.5 }, '-=0.25')
    if (formCardRef.current) tl.from(formCardRef.current, { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
    if (sidebarRef.current) tl.from(sidebarRef.current, { y: 20, opacity: 0, duration: 0.5 }, '-=0.35')
  }, { scope: rootRef })

  // ── Trip type toggle — sliding indicator ──────────────────────────────────────
  useGSAP(() => {
    const track = toggleTrackRef.current
    const indicator = toggleIndicatorRef.current
    const target = isRoundTrip ? roundTripBtnRef.current : oneWayBtnRef.current
    if (!track || !indicator || !target) return

    const trackBox = track.getBoundingClientRect()
    const btnBox = target.getBoundingClientRect()
    const x = btnBox.left - trackBox.left
    const width = btnBox.width

    if (!toggleMounted.current) {
      gsap.set(indicator, { x, width })
      toggleMounted.current = true
    } else {
      gsap.to(indicator, { x, width, duration: 0.35, ease: 'power3.out' })
    }
  }, { dependencies: [isRoundTrip], scope: rootRef })

  // ── Passenger count pop ───────────────────────────────────────────────────────
  useGSAP(() => {
    if (!passengerMounted.current) { passengerMounted.current = true; return }
    if (!passengerNumRef.current) return
    gsap.fromTo(passengerNumRef.current, { scale: 1.35 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' })
  }, { dependencies: [passengerCount], scope: rootRef })

  // ── Sidebar summary flashes — one effect per field, each skips its own first run ──
  useGSAP(() => {
    if (!routeMounted.current) { routeMounted.current = true; return }
    flashUpdate(routeValueRef.current)
  }, { dependencies: [pickup, destination], scope: rootRef })

  useGSAP(() => {
    if (!dateMounted.current) { dateMounted.current = true; return }
    flashUpdate(dateValueRef.current)
  }, { dependencies: [departureDate, returnDate, isRoundTrip], scope: rootRef })

  useGSAP(() => {
    if (!vehicleMounted.current) { vehicleMounted.current = true; return }
    flashUpdate(vehicleValueRef.current)
  }, { dependencies: [vehicleType], scope: rootRef })

  useGSAP(() => {
    if (!paxMounted.current) { paxMounted.current = true; return }
    flashUpdate(paxValueRef.current)
  }, { dependencies: [passengerCount], scope: rootRef })

  // ── Confirmation screen reveal — runs once, when submittedRef flips to a value ──
  useGSAP(() => {
    if (!submittedRef || !confirmationRef.current) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(confirmationRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 })

    if (checkCircleRef.current) {
      tl.fromTo(
        checkCircleRef.current,
        { scale: 0, rotate: -45 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.4)' },
        '-=0.25'
      )
    }

    if (checkPathRef.current) {
      const len = checkPathRef.current.getTotalLength()
      tl.fromTo(
        checkPathRef.current,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' },
        '-=0.15'
      )
    }

    tl.from('.confirm-fade', { opacity: 0, y: 10, duration: 0.4, stagger: 0.08 }, '-=0.1')
  }, { dependencies: [submittedRef], scope: rootRef })

  async function onSubmit(values: BookingFormValues) {
    setSubmitError(null)

    // Turnstile runs on page load and re-arms automatically, but if the
    // widget hasn't finished (slow connection, or the user submitted very
    // fast) there's no token yet — catch that before calling the action.
    if (!turnstileToken) {
      setSubmitError('Please wait a moment for verification to finish, then try again.')
      return
    }

    const result = await submitTripRequest(values, {
      honeypot: honeypotRef.current?.value ?? '',
      turnstileToken,
    })

    // Turnstile tokens are single-use — get a fresh one for the next attempt
    // regardless of outcome.
    turnstileRef.current?.reset()
    setTurnstileToken(null)

    if (!result.success) {
      setSubmitError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSubmittedRef(result.reference!)
    // Small delay so the confirmation screen registers before the modal
    // layers on top of it — an instant modal reads as a pop-up ad, not
    // a considered next step.
    setTimeout(() => setShowSignInModal(true), 1400)
  }

  const vehicleLabel = VEHICLE_OPTIONS.find(v => v.value === vehicleType)?.label

  return (
    <div ref={rootRef} className={`${display.variable} ${body.variable} min-h-screen bg-[#EEF1F5]`}>

      {/* ── Minimal header ─────────────────────────────────────────────────── */}
      <header ref={headerRef} className="border-b border-[#0D1424]/8 bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0D1424]">
            Safeway
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-body)] flex items-center gap-1.5 text-sm font-medium text-[#4B5768] transition-colors hover:text-[#0D1424]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">

        {submittedRef ? (
          // ══════════════════════════════════════════════════════════════════
          // CONFIRMATION STATE — replaces the form entirely
          // ══════════════════════════════════════════════════════════════════
          <div ref={confirmationRef} className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-[0_20px_50px_-12px_rgba(13,20,36,0.15)] sm:p-10">
            <div ref={checkCircleRef} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F5EC]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path ref={checkPathRef} d="M5 12.5L9.5 17L19 7" stroke="#2E9E5B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="confirm-fade font-[family-name:var(--font-display)] mt-5 text-2xl font-semibold text-[#0D1424]">
              Request received
            </h1>
            <p className="confirm-fade font-[family-name:var(--font-body)] mt-2 text-sm leading-relaxed text-[#4B5768]">
              We&rsquo;ve got your trip details. Our team will call you within
              24 hours to confirm your bus, price, and exact pickup point.
            </p>

            <div className="my-6 border-t border-dashed border-[#0D1424]/12" />

            <div className="confirm-fade rounded-xl bg-[#EEF1F5] p-5 text-left">
              <p className="font-[family-name:var(--font-body)] text-xs font-medium uppercase tracking-wide text-[#8A94A3]">
                Reference
              </p>
              <p className="font-[family-name:var(--font-display)] mt-1 text-lg font-semibold text-[#0D1424]">
                {submittedRef}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-[#0D1424]/8 pt-4">
                <span className="font-[family-name:var(--font-body)] text-sm text-[#4B5768]">Trip</span>
                <span className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                  {pickup} → {destination}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-[family-name:var(--font-body)] text-sm text-[#4B5768]">Date</span>
                <span className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                  {new Date(departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {isRoundTrip && returnDate && ` – ${new Date(returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-[family-name:var(--font-body)] text-sm text-[#4B5768]">Passengers</span>
                <span className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                  {passengerCount}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="confirm-fade font-[family-name:var(--font-display)] mt-7 inline-flex w-full items-center justify-center rounded-xl border border-[#0D1424]/15 py-3 text-sm font-semibold text-[#0D1424] transition-colors hover:bg-[#EEF1F5]"
            >
              Back to homepage
            </Link>
          </div>
        ) : (
          // ══════════════════════════════════════════════════════════════════
          // FORM STATE
          // ══════════════════════════════════════════════════════════════════
          <>
            <div className="page-heading mb-8">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[#0D1424] sm:text-4xl">
                Book your trip
              </h1>
              <p className="font-[family-name:var(--font-body)] mt-2 text-[#4B5768]">
                Tell us where you&rsquo;re headed — we&rsquo;ll call to confirm the details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

              {/* ── Form card ──────────────────────────────────────────────── */}
              <form
                ref={formCardRef}
                onSubmit={handleSubmit(onSubmit)}
                className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-15px_rgba(13,20,36,0.15)] sm:p-8"
              >
                {/* Trip type toggle — sliding indicator behind the buttons */}
                <div ref={toggleTrackRef} className="relative mb-6 inline-flex rounded-full bg-[#EEF1F5] p-1">
                  <div
                    ref={toggleIndicatorRef}
                    className="absolute top-1 bottom-1 rounded-full bg-[#0D1424]"
                    style={{ willChange: 'transform, width' }}
                  />
                  <button
                    ref={oneWayBtnRef}
                    type="button"
                    onClick={() => setValue('isRoundTrip', false)}
                    className={`font-[family-name:var(--font-display)] relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      !isRoundTrip ? 'text-white' : 'text-[#4B5768]'
                    }`}
                  >
                    One way
                  </button>
                  <button
                    ref={roundTripBtnRef}
                    type="button"
                    onClick={() => setValue('isRoundTrip', true)}
                    className={`font-[family-name:var(--font-display)] relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      isRoundTrip ? 'text-white' : 'text-[#4B5768]'
                    }`}
                  >
                    Round trip
                  </button>
                </div>

                {/* Pickup / Destination */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                      Pickup location
                    </label>
                    <input
                      {...register('pickup')}
                      list="location-suggestions"
                      placeholder="e.g. Lagos, Ojota"
                      className="font-[family-name:var(--font-body)] w-full rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                    />
                    {errors.pickup && (
                      <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.pickup.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                      Destination
                    </label>
                    <input
                      {...register('destination')}
                      list="location-suggestions"
                      placeholder="e.g. Ibadan, Dugbe"
                      className="font-[family-name:var(--font-body)] w-full rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                    />
                    {errors.destination && (
                      <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.destination.message}</p>
                    )}
                  </div>
                </div>

                <datalist id="location-suggestions">
                  {SUGGESTED_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
                </datalist>

                {/* Dates */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="departureDate"
                    control={control}
                    render={({ field }) => (
                      <DateField
                        label="Departure date"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        error={errors.departureDate?.message}
                      />
                    )}
                  />

                  {isRoundTrip && (
                    <Controller
                      name="returnDate"
                      control={control}
                      render={({ field }) => (
                        // Callback ref animates this in the moment it mounts —
                        // a fade + slight rise, so it doesn't just pop into place
                        // when "Round trip" is selected.
                        <div
                          ref={el => {
                            if (el) gsap.from(el, { opacity: 0, y: -8, duration: 0.35, ease: 'power2.out' })
                          }}
                        >
                          <DateField
                            label="Return date"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            minDate={departureDate ? new Date(departureDate) : undefined}
                            error={errors.returnDate?.message}
                          />
                        </div>
                      )}
                    />
                  )}
                </div>

                {/* Vehicle type */}
                <div className="mt-5">
                  <label className="font-[family-name:var(--font-body)] mb-2 block text-sm font-medium text-[#0D1424]">
                    Vehicle type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {VEHICLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={e => { setValue('vehicleType', opt.value); popScale(e.currentTarget) }}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          vehicleType === opt.value
                            ? 'border-[#0D1424] bg-[#0D1424] text-white'
                            : 'border-[#0D1424]/12 text-[#0D1424] hover:border-[#0D1424]/30'
                        }`}
                      >
                        <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold">{opt.label}</p>
                        <p className={`font-[family-name:var(--font-body)] mt-0.5 text-[11px] leading-tight ${
                          vehicleType === opt.value ? 'text-white/60' : 'text-[#8A94A3]'
                        }`}>
                          {opt.hint}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Passenger count */}
                <div className="mt-5">
                  <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                    Passengers
                  </label>
                  <div className="flex w-40 items-center justify-between rounded-xl border border-[#0D1424]/12 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={e => { setValue('passengerCount', Math.max(1, (passengerCount || 1) - 1)); popScale(e.currentTarget) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0D1424] transition-colors hover:bg-[#EEF1F5]"
                      aria-label="Decrease passengers"
                    >
                      −
                    </button>
                    <span ref={passengerNumRef} className="font-[family-name:var(--font-display)] inline-block text-sm font-semibold text-[#0D1424]">
                      {passengerCount || 1}
                    </span>
                    <button
                      type="button"
                      onClick={e => { setValue('passengerCount', Math.min(30, (passengerCount || 1) + 1)); popScale(e.currentTarget) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0D1424] transition-colors hover:bg-[#EEF1F5]"
                      aria-label="Increase passengers"
                    >
                      +
                    </button>
                  </div>
                  {errors.passengerCount && (
                    <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.passengerCount.message}</p>
                  )}
                </div>

                {/* Special requirements */}
                <div className="mt-5">
                  <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                    Special requirements <span className="font-normal text-[#8A94A3]">(optional)</span>
                  </label>
                  <textarea
                    {...register('specialRequirements')}
                    rows={2}
                    placeholder="Wheelchair access, extra luggage, anything else we should know"
                    className="font-[family-name:var(--font-body)] w-full resize-none rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                  />
                </div>

                {/* Contact details */}
                <p className="font-[family-name:var(--font-body)] mb-3 mt-7 text-sm font-medium uppercase tracking-wide text-[#8A94A3]">
                  Contact details
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                      Full name
                    </label>
                    <input
                      {...register('fullName')}
                      placeholder="Your full name"
                      className="font-[family-name:var(--font-body)] w-full rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                    />
                    {errors.fullName && (
                      <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                        Email
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@email.com"
                        className="font-[family-name:var(--font-body)] w-full rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                      />
                      {errors.email && (
                        <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
                        Phone
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="080..."
                        className="font-[family-name:var(--font-body)] w-full rounded-xl border border-[#0D1424]/12 px-4 py-3 text-sm text-[#0D1424] placeholder:text-[#8A94A3] focus:border-[#0D1424]/40 focus:outline-none"
                      />
                      {errors.phone && (
                        <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Honeypot — invisible to real visitors, bots that fill every
                    input on the page trip it. Off-screen instead of
                    display:none, since some bots skip fields hidden that way. */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px' }}
                />

                <div className="mt-5">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                  />
                </div>

                {submitError && (
                  <div
                    ref={el => {
                      if (el) gsap.from(el, { opacity: 0, y: -6, duration: 0.3, ease: 'power2.out' })
                    }}
                    className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !turnstileToken}
                  className="font-[family-name:var(--font-display)] mt-7 flex w-full items-center justify-center rounded-xl bg-[#E2A63B] py-3.5 text-sm font-semibold text-[#0D1424] transition-colors hover:bg-[#EDB65A] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Sending request…' : 'Send trip request'}
                </button>
                <p className="font-[family-name:var(--font-body)] mt-3 text-center text-xs text-[#8A94A3]">
                  We&rsquo;ll call to confirm your bus, price and exact pickup point within 24 hours.
                </p>
              </form>

              {/* ── Live summary sidebar ──────────────────────────────────────
                  Mirrors the "Sample request" floating card style from Hero.tsx
                  for visual continuity between the homepage and this page. ── */}
              <div ref={sidebarRef} className="h-fit rounded-2xl bg-white p-6 shadow-[0_10px_40px_-15px_rgba(13,20,36,0.15)]">
                <p className="font-[family-name:var(--font-body)] text-xs font-medium uppercase tracking-wide text-[#8A94A3]">
                  Trip summary
                </p>

                <div className="mt-4 flex flex-col gap-3.5">
                  <div>
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#8A94A3]">Route</p>
                    <p ref={routeValueRef} className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-[#0D1424]">
                      {pickup || 'Pickup'} → {destination || 'Destination'}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-[#0D1424]/12 pt-3.5">
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#8A94A3]">
                      {isRoundTrip ? 'Dates' : 'Date'}
                    </p>
                    <p ref={dateValueRef} className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                      {departureDate
                        ? new Date(departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : 'Not set'}
                      {isRoundTrip && returnDate &&
                        ` – ${new Date(returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-[#0D1424]/12 pt-3.5">
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#8A94A3]">Vehicle</p>
                    <p ref={vehicleValueRef} className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                      {vehicleLabel}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-[#0D1424]/12 pt-3.5">
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#8A94A3]">Passengers</p>
                    <p ref={paxValueRef} className="font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424]">
                      {passengerCount || 1}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-[#EEF1F5] p-3.5">
                  <p className="font-[family-name:var(--font-body)] text-[12.5px] leading-relaxed text-[#4B5768]">
                    Pricing is confirmed by phone after you submit — it depends on distance, vehicle, and passenger count.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {submittedRef && (
        <SignInPromptModal
          open={showSignInModal}
          onDismiss={() => setShowSignInModal(false)}
          reference={submittedRef}
        />
      )}

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer className="bg-[#0D1424] px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="footer-fade">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white cursor-pointer">{COMPANY_NAME}</p>
            <p className="font-[family-name:var(--font-body)] mt-2 max-w-xs text-sm leading-relaxed text-white/50">Road travel across Lagos and nearby states, booked online, confirmed by phone.</p>
          </div>
          <div className="footer-fade flex flex-col gap-2 font-[family-name:var(--font-body)] text-sm text-white/70">
            <Link href="/booking" className="transition-colors hover:text-white">Book a trip</Link>
            <Link href="#fleet" className="transition-colors hover:text-white">Our buses</Link>
          </div>
        </div>
        <div className="footer-fade mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6">
          <p className="font-[family-name:var(--font-body)] text-xs text-white/35">© {new Date().getFullYear()} {COMPANY_NAME}. Operating within Nigeria.</p>
        </div>
      </footer>
    </div>
  )
}
