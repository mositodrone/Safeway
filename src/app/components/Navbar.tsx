'use client'

// components/Navbar.tsx
//
// Setup: drop into components/Navbar.tsx, then use in app/layout.tsx:
//   import Navbar from '@/components/Navbar'
//   <Navbar />  ← above {children}
//
// Uses the same design tokens as Hero.tsx (Ink/Steel/Mist/Amber,
// Space Grotesk + Inter). No extra installs — next/link, next/font,
// usePathname all ship with Next.js.
//
// COMPANY_NAME placeholder — same one used in Hero.tsx's footer.
// Keep both in sync until there's a shared constants file.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Space_Grotesk, Inter } from 'next/font/google'
import { Menu, X } from 'lucide-react'
import {  Show, UserButton  } from '@clerk/nextjs';
import { scrollToHash } from '../lib/scrollToHash'

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
})

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const COMPANY_NAME = 'Safeway'

const NAV_LINKS = [
  { href: '/#fleet', label: 'Our buses' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#coverage', label: 'Coverage' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Subtle elevation once the page scrolls — keeps the bar from
  // feeling like it's floating over nothing on long pages
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`${display.variable} ${body.variable} sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-shadow ${
        scrolled ? 'border-[#0D1424]/10 shadow-[0_1px_0_0_rgba(13,20,36,0.04)]' : 'border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0D1424]"
        >
          {COMPANY_NAME}
        </Link>

        {/* ── Desktop nav ── */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={(e) => {
                  // Only intercept when already on the page the anchor lives
                  // on — from anywhere else, let Link navigate normally and
                  // Hero's mount effect smooth-scrolls once it lands.
                  if (pathname === '/') {
                    e.preventDefault()
                    scrollToHash(link.href)
                  }
                }}
                className="group relative inline-flex items-center px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-[#4B5768] transition-colors hover:text-[#0D1424]"
              >
                {link.label}
                <span className="pointer-events-none absolute inset-x-3 bottom-1 h-[2px] scale-x-0 rounded-full bg-[#E2A63B] transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTA ── */}
       <div className="hidden md:flex items-center gap-3">
  	<Show when="signed-out">
    	 <Link
      	  href="/sign-in"
      	  className="inline-flex items-center rounded-full px-4 py-2.5 font-	  [family-name:var(--font-body)] text-sm font-medium text-[#4B5768] 	 transition-colors hover:text-[#0D1424]"
    >
      	  Sign in
    	 </Link>
  	</Show>
  	<Show when="signed-in">
    	 <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
  	</Show>

  	<Link
    	 href="/booking"
    	 className="inline-flex items-center gap-1.5 rounded-full bg-[#0D1424] 	 px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold 	 text-white transition-colors hover:bg-[#1A2438] focus-visible:outline 	 focus-visible:outline-2 focus-visible:outline-offset-2 focus-	 visible:outline-[#0D1424]"
  	>
    	 Book a trip
  	 </Link>
 	</div>

        {/* ── Mobile menu trigger ── */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#0D1424] transition-colors hover:bg-[#EEF1F5] md:hidden cursor-pointer"
        >
          {mobileOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
        </button>
      </nav>

      {/* ── Mobile panel ── */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-1 border-t border-[#0D1424]/10 bg-white px-6 py-4 sm:px-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault()
                  scrollToHash(link.href)
                }
                setMobileOpen(false)
              }}
              className="font-[family-name:var(--font-body)] rounded-lg px-3 py-3 text-[0.95rem] font-medium text-[#0D1424] transition-colors hover:bg-[#EEF1F5]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="font-[family-name:var(--font-display)] mt-2 flex items-center justify-center rounded-full bg-[#0D1424] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1A2438]"
          >
            Book a trip
          </Link>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="font-[family-name:var(--font-body)] flex items-center justify-center rounded-full border border-[#0D1424]/15 py-3 text-sm font-medium text-[#0D1424] transition-colors hover:bg-[#EEF1F5]"
            >
              Sign in
            </Link>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center justify-center gap-3 py-2">
              <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
              <span className="font-[family-name:var(--font-body)] text-sm text-[#4B5768]">Your account</span>
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}
