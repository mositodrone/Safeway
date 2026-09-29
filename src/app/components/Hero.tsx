'use client'

// components/Hero.tsx — full homepage, GSAP-animated
//
// npm install gsap @gsap/react   (if not already installed)
//
// Setup: same as before — save hero-bus.jpg, fleet-exterior.jpg,
// fleet-interior.jpg to public/images/, drop this in components/Hero.tsx,
// render <Hero /> from app/page.tsx.

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Space_Grotesk, Inter } from 'next/font/google'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })

const COMPANY_NAME = 'Safeway'

const FACTS = [
  { label: '8–10 buses available, more added as needed' },
  { label: 'Currently serving Lagos and nearby states' },
  { label: 'One-way and return trips' },
]

const STEPS = [
  { n: '01', title: 'Send your trip details', body: 'Tell us your pickup point, destination, date, and how many passengers are travelling.' },
  { n: '02', title: 'We call to confirm', body: 'Our team reaches out by phone to confirm the bus, price, and exact meeting point.' },
  { n: '03', title: 'Travel on your date', body: 'Once confirmed, your seat is held. Show up at the agreed point and time — that\u2019s it.' },
]

const CORE_STATES = ['Lagos', 'Ogun', 'Oyo', 'Ekiti']
const ON_REQUEST_STATES = ['Rivers', 'Osun', 'Ondo']

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // ── HERO ────────────────────────────────────────────────────────────
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    heroTl
      .from('.hero-headline', { x: -60, opacity: 0, duration: 0.8 })
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-cta', { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
      // Twist 1 — route line draws itself in
      .fromTo(
        '.route-path',
        { strokeDashoffset: 400 },
        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' },
        '-=0.5'
      )
      // Small chips — elastic pop, staggered
      .from(
        '.fact-chip',
        { scale: 0, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'elastic.out(1, 0.55)' },
        '-=0.3'
      )
      // Hero image — plain fade, not slide (images fade, not slide, per spec)
      .from('.hero-image', { opacity: 0, duration: 1 }, '<')
      // Twist 2 — ticket-drop entrance for the floating sample card
      .fromTo(
        '.ticket-card',
        { opacity: 0, y: -24, rotate: -8, scale: 0.85 },
        { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' },
        '-=0.4'
      )

    // ── HOW IT WORKS — medium cards, elastic stagger ─────────────────────
    gsap.from('.step-card', {
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'elastic.out(1, 0.65)',
      scrollTrigger: { trigger: '.steps-grid', start: 'top 80%' },
    })

    // ── FLEET — bigger cards slide in from opposite sides ────────────────
    gsap.from('.fleet-exterior-card', {
      x: -80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.fleet-grid', start: 'top 80%' },
    })
    gsap.from('.fleet-interior-card', {
      x: 80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.fleet-grid', start: 'top 80%' },
    })
    // Images within fade in independently
    gsap.from('.fleet-img', {
      opacity: 0,
      duration: 1.1,
      stagger: 0.15,
      scrollTrigger: { trigger: '.fleet-grid', start: 'top 80%' },
    })
    gsap.from('.fleet-fact', {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'elastic.out(1, 0.55)',
      scrollTrigger: { trigger: '.fleet-facts', start: 'top 85%' },
    })

    // ── SERVICE AREA — heading slides from left, pills pop elastic ───────
    gsap.from('.coverage-heading', {
      x: -50,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: { trigger: '.coverage-box', start: 'top 80%' },
    })
    gsap.from('.coverage-box', {
      x: 50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.coverage-box', start: 'top 80%' },
    })
    gsap.from('.state-pill', {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'elastic.out(1, 0.6)',
      scrollTrigger: { trigger: '.coverage-box', start: 'top 75%' },
    })

    // ── FOOTER — simple fade up ───────────────────────────────────────────
    gsap.from('.footer-fade', {
      y: 20,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      scrollTrigger: { trigger: 'footer', start: 'top 90%' },
    })
  }, { scope: rootRef })

  return (
    <div ref={rootRef} className={`${display.variable} ${body.variable}`}>
      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative overflow-hidden bg-[#EEF1F5]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28">
            <h1 className="hero-headline font-[family-name:var(--font-display)] text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-[#0D1424] sm:text-5xl lg:text-[3.4rem]">
              Book your road trip without the back-and-forth calls.
            </h1>

            {/* Twist 1 — route line-draw */}
            <svg width="180" height="28" viewBox="0 0 180 28" fill="none" className="mt-3 ml-1">
              <path
                className="route-path"
                d="M2 22 Q 30 4, 55 16 T 110 10 Q 140 4, 178 18"
                stroke="#E2A63B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
                fill="none"
              />
            </svg>

            <p className="hero-sub font-[family-name:var(--font-body)] mt-4 max-w-md text-base leading-relaxed text-[#4B5768] sm:text-[1.05rem]">
              Pick a route, choose your bus, and send your trip request in
              minutes. We currently operate across Lagos and nearby states —
              Ibadan, Abeokuta, Ekiti and more.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/booking" className="hero-cta group inline-flex items-center gap-2 rounded-full bg-[#E2A63B] px-7 py-3.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#0D1424] transition-colors hover:bg-[#EDB65A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1424]">
                Book a trip
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="#fleet" className="hero-cta font-[family-name:var(--font-body)] inline-flex items-center gap-1.5 rounded-full border border-[#0D1424]/15 px-6 py-3.5 text-sm font-medium text-[#0D1424] transition-colors hover:border-[#0D1424]/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1424]">
                See our buses
              </Link>
            </div>

            <ul className="font-[family-name:var(--font-body)] mt-12 flex flex-col gap-3 border-t border-[#0D1424]/10 pt-8 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
              {FACTS.map((fact) => (
                <li key={fact.label} className="fact-chip flex items-start gap-2.5 text-sm text-[#4B5768]">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E2A63B]" />
                  {fact.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-full">
            <Image src="/images/hero-bus.jpg" alt="Coaster bus used for intercity trips" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="hero-image object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1424]/25 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0D1424]/10 lg:via-transparent lg:to-transparent" />
          </div>
        </div>

        <div className="relative z-10 -mt-10 px-6 sm:px-10 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:w-1/2 lg:px-0">
          <div className="ticket-card mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_-12px_rgba(13,20,36,0.25)] lg:absolute lg:bottom-10 lg:left-1/2 lg:top-auto lg:mx-0 lg:-translate-x-1/2 lg:translate-y-0">
            <p className="font-[family-name:var(--font-body)] text-[0.7rem] font-medium uppercase tracking-wide text-[#8A94A3]">Sample request</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0D1424]">Lagos → Ibadan</p>
                <p className="font-[family-name:var(--font-body)] mt-0.5 text-sm text-[#4B5768]">Sat, 14 Feb &middot; Return trip</p>
              </div>
              <span className="rounded-full bg-[#EEF1F5] px-3 py-1 font-[family-name:var(--font-body)] text-xs font-medium text-[#2A3A5C]">Coaster bus</span>
            </div>
            <div className="my-4 border-t border-dashed border-[#0D1424]/15" />
            <Link href="/booking" className="font-[family-name:var(--font-display)] flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1424] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1A2438] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1424]">
              Start your request
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
      <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] max-w-md text-3xl font-semibold tracking-tight text-[#0D1424] sm:text-4xl">How booking works</h2>
          <p className="font-[family-name:var(--font-body)] mt-3 max-w-md text-[#4B5768]">No app to download, no account required to get started.</p>

          <div className="steps-grid mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="step-card relative">
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#E2A63B]">{step.n}</span>
                <h3 className="font-[family-name:var(--font-display)] mt-3 text-lg font-semibold text-[#0D1424]">{step.title}</h3>
                <p className="font-[family-name:var(--font-body)] mt-2 text-sm leading-relaxed text-[#4B5768]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FLEET ══════════════════════════ */}
      <section id="fleet" className="bg-[#EEF1F5] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[#0D1424] sm:text-4xl">Our buses</h2>
          <p className="font-[family-name:var(--font-body)] mt-3 max-w-md text-[#4B5768]">Toyota Coaster buses, kept in regular service for intercity trips.</p>

          <div className="fleet-grid mt-10 grid grid-cols-1 gap-5 overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-15px_rgba(13,20,36,0.15)] sm:grid-cols-2">
            <div className="fleet-exterior-card relative min-h-[260px] sm:min-h-[340px]">
              <Image src="/images/fleet-exterior.jpg" alt="Toyota Coaster bus exterior" fill sizes="(min-width: 640px) 50vw, 100vw" className="fleet-img object-cover" />
            </div>
            <div className="fleet-interior-card relative min-h-[260px] sm:min-h-[340px]">
              <Image src="/images/fleet-interior.jpg" alt="Toyota Coaster bus interior seating" fill sizes="(min-width: 640px) 50vw, 100vw" className="fleet-img object-cover" />
            </div>
          </div>

          <div className="fleet-facts mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 px-1">
            <div className="fleet-fact flex items-center gap-2 text-sm text-[#4B5768]"><span className="h-1.5 w-1.5 rounded-full bg-[#E2A63B]" />Toyota Coaster</div>
            <div className="fleet-fact flex items-center gap-2 text-sm text-[#4B5768]"><span className="h-1.5 w-1.5 rounded-full bg-[#E2A63B]" />Cushioned seating</div>
            <div className="fleet-fact flex items-center gap-2 text-sm text-[#4B5768]"><span className="h-1.5 w-1.5 rounded-full bg-[#E2A63B]" />8–10 buses in service</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ SERVICE AREA ══════════════════════════ */}
      <section id="coverage" className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="coverage-heading font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[#0D1424] sm:text-4xl">Where we operate</h2>

          <div className="coverage-box mt-8 rounded-2xl border border-[#0D1424]/10 bg-[#EEF1F5] p-6 sm:p-8">
            <p className="font-[family-name:var(--font-body)] text-sm font-medium uppercase tracking-wide text-[#8A94A3]">Core coverage</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CORE_STATES.map((state) => (
                <span key={state} className="state-pill rounded-full bg-white px-4 py-1.5 font-[family-name:var(--font-body)] text-sm font-medium text-[#0D1424] shadow-sm">{state}</span>
              ))}
            </div>

            <p className="font-[family-name:var(--font-body)] mt-6 text-sm font-medium uppercase tracking-wide text-[#8A94A3]">Available on request</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ON_REQUEST_STATES.map((state) => (
                <span key={state} className="state-pill rounded-full border border-[#0D1424]/15 bg-transparent px-4 py-1.5 font-[family-name:var(--font-body)] text-sm font-medium text-[#4B5768]">{state}</span>
              ))}
            </div>

            <p className="font-[family-name:var(--font-body)] mt-6 text-sm leading-relaxed text-[#4B5768]">
              This service currently operates within Nigeria only. If your route isn&rsquo;t listed above, send a request anyway — we&rsquo;ll let you know if we can arrange it.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer className="bg-[#0D1424] px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="footer-fade">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">{COMPANY_NAME}</p>
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
