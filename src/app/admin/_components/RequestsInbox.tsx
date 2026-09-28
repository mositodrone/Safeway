'use client'

// app/admin/_components/RequestsInbox.tsx
//
// The interactive half of the admin page. It receives the rows as props from
// the Server Component in app/admin/page.tsx and never talks to Prisma itself.
// Status changes go through the updateRequestStatus Server Action.
//
// Stat cards are still computed FROM the request array (.filter().length), so
// they can't drift out of sync with the list underneath them.

import { useState, useMemo, useEffect } from 'react'
import { Search, MapPin, Users, Repeat, AlertCircle, X } from 'lucide-react'
import { updateRequestStatus } from '../actions'

export type Status = 'new' | 'contacted' | 'confirmed' | 'cancelled'
type VehicleType = 'bus' | 'minibus' | 'van' | 'no_preference'

export interface InboxRequest {
  ref: string
  fullName: string
  email: string
  phone: string
  pickup: string
  destination: string
  departureDate: string // ISO string
  returnDate?: string
  isRoundTrip: boolean
  vehicleType: VehicleType
  passengerCount: number
  specialRequirements?: string
  status: Status
  submittedAt: string // ISO string
}

const STATUS_META: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  new:       { label: 'New',       dot: '#DB8A2E', text: '#DB8A2E', bg: 'rgba(219,138,46,0.1)' },
  contacted: { label: 'Contacted', dot: '#4C6178', text: '#4C6178', bg: 'rgba(76,97,120,0.1)' },
  confirmed: { label: 'Confirmed', dot: '#3C8361', text: '#3C8361', bg: 'rgba(60,131,97,0.1)' },
  cancelled: { label: 'Cancelled', dot: '#B84343', text: '#B84343', bg: 'rgba(184,67,67,0.1)' },
}

const VEHICLE_LABEL: Record<VehicleType, string> = {
  bus: 'Coaster bus',
  minibus: 'Minibus',
  van: 'Van',
  no_preference: 'No preference',
}

const FILTER_TABS: { id: 'all' | Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
]

// Departure/return are date-only values stored at UTC midnight (the /book form
// submits 'YYYY-MM-DD'). Formatting in UTC keeps "Oct 4" as Oct 4 no matter
// which timezone the admin's browser is in.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 1) return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface RequestsInboxProps {
  initialRequests: InboxRequest[]
}

export default function RequestsInbox({ initialRequests }: RequestsInboxProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // useState only reads its initial value once. After a status change the
  // server re-renders the page and sends fresh props, so sync them back in.
  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  // Optimistic update: the dropdown changes instantly, the Server Action runs
  // in the background, and if it fails we roll back and say so.
  async function updateStatus(ref: string, status: Status) {
    const previous = requests
    setError(null)
    setRequests(prev => prev.map(r => (r.ref === ref ? { ...r, status } : r)))

    const result = await updateRequestStatus(ref, status)
    if (!result.success) {
      setRequests(previous)
      setError(result.error ?? 'Could not update the status. Please try again.')
    }
  }

  const counts = useMemo(() => ({
    new: requests.filter(r => r.status === 'new').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }), [requests])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? requests : requests.filter(r => r.status === filter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(r =>
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.pickup.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  }, [requests, filter, query])

  const emptyMessage =
    requests.length === 0
      ? 'No requests yet. New submissions from the booking page will appear here.'
      : 'No requests match this filter.'

  return (
    <div className="mx-auto max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-tight text-[#ffffff] sm:text-[26px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Trip requests
        </h1>
        <p className="mt-0.5 text-[13px] text-[#ffffff]/70">
          {requests.length} total requests &middot; {counts.new} need a first call
        </p>
      </div>

      {/* ── Error banner (shown when a status update fails and is rolled back) ── */}
      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-[#B84343]/25 bg-[#B84343]/5 px-4 py-3 text-[13px] text-[#B84343]">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} strokeWidth={2} />
            {error}
          </span>
          <button onClick={() => setError(null)} aria-label="Dismiss" className="shrink-0">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['new', 'contacted', 'confirmed', 'cancelled'] as Status[]).map(s => {
          const meta = STATUS_META[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl border bg-white px-4 py-3.5 text-left transition-colors ${
                filter === s ? 'border-[#14181F]' : 'border-[#E3E0D6] hover:border-[#14181F]/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
                <span className="text-[12px] font-medium text-[#3C4048]/60">{meta.label}</span>
              </div>
              <div className="mt-1.5 text-[22px] font-semibold leading-none text-[#14181F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {counts[s]}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Search + filter tabs ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#E3E0D6] bg-white p-1">
          {FILTER_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                filter === t.id ? 'bg-[#14181F] text-white' : 'text-[#3C4048]/60 hover:bg-[#14181F]/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#3C4048]/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Search name, phone, route…"
            className="w-full rounded-lg border border-[#E3E0D6] bg-white py-2 pl-9 pr-3 text-[13px] text-[#14181F] placeholder:text-[#3C4048]/40 focus:border-[#DB8A2E] focus:outline-none focus:ring-1 focus:ring-[#DB8A2E]/30"
          />
        </div>
      </div>

      {/* ── Desktop table ───────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-[#E3E0D6] bg-white lg:block">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11.5px] text-[#3C4048]/50">
              <th className="px-5 py-2.5 font-medium">Reference</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Route</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Vehicle</th>
              <th className="px-3 py-2.5 font-medium">Pax</th>
              <th className="px-3 py-2.5 font-medium">Submitted</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.ref} className="border-t border-[#E3E0D6]/70 text-[13px]">
                <td className="px-5 py-3 font-mono text-[12px] font-medium text-[#14181F]">{r.ref}</td>
                <td className="px-3 py-3">
                  <div className="text-[#14181F]">{r.fullName}</div>
                  <a href={`tel:${r.phone}`} className="text-[11.5px] text-[#3C4048]/50 hover:text-[#14181F] hover:underline">
                    {r.phone}
                  </a>
                </td>
                <td className="px-3 py-3 text-[#3C4048]">
                  <span className="whitespace-nowrap">
                    {r.pickup}<span className="mx-1.5 text-[#3C4048]/35">→</span>{r.destination}
                  </span>
                  {r.isRoundTrip && (
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#14181F]/5 px-1.5 py-0.5 text-[10px] font-medium text-[#3C4048]/60">
                      <Repeat size={9} strokeWidth={2} /> Return
                    </span>
                  )}
                  {r.specialRequirements && (
                    <div className="mt-0.5 max-w-[260px] truncate text-[11.5px] text-[#DB8A2E]" title={r.specialRequirements}>
                      Note: {r.specialRequirements}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-[#3C4048]">
                  {formatDate(r.departureDate)}
                  {r.returnDate && <span className="text-[#3C4048]/50"> – {formatDate(r.returnDate)}</span>}
                </td>
                <td className="px-3 py-3 text-[#3C4048]">{VEHICLE_LABEL[r.vehicleType]}</td>
                <td className="px-3 py-3 text-[#3C4048]">{r.passengerCount}</td>
                {/* timeAgo depends on the current time, so the server render and the
                    browser hydration can disagree by a minute. That's harmless. */}
                <td className="px-3 py-3 text-[11.5px] text-[#3C4048]/50" suppressHydrationWarning>
                  {timeAgo(r.submittedAt)}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={r.status}
                    onChange={e => updateStatus(r.ref, e.target.value as Status)}
                    className="cursor-pointer rounded-full border-0 px-2.5 py-1 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[#DB8A2E]/40"
                    style={{ background: STATUS_META[r.status].bg, color: STATUS_META[r.status].text }}
                  >
                    {(Object.keys(STATUS_META) as Status[]).map(s => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] text-[#3C4048]/50">{emptyMessage}</div>
        )}
      </div>

      {/* ── Mobile cards ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.map(r => (
          <div key={r.ref} className="rounded-xl border border-[#E3E0D6] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11.5px] text-[#3C4048]/50">{r.ref}</p>
                <p className="mt-0.5 text-[14px] font-semibold text-[#14181F]">{r.fullName}</p>
                <a href={`tel:${r.phone}`} className="text-[12px] text-[#3C4048]/60 hover:underline">
                  {r.phone}
                </a>
              </div>
              <select
                value={r.status}
                onChange={e => updateStatus(r.ref, e.target.value as Status)}
                className="shrink-0 cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11.5px] font-medium focus:outline-none"
                style={{ background: STATUS_META[r.status].bg, color: STATUS_META[r.status].text }}
              >
                {(Object.keys(STATUS_META) as Status[]).map(s => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 border-t border-[#E3E0D6]/70 pt-3 text-[12.5px] text-[#3C4048]">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} strokeWidth={2} className="text-[#3C4048]/40" />
                {r.pickup} → {r.destination}
                {r.isRoundTrip && <span className="ml-1 text-[11px] text-[#3C4048]/50">(Return)</span>}
              </div>
              <div className="flex items-center gap-4">
                <span>{formatDate(r.departureDate)}{r.returnDate && ` – ${formatDate(r.returnDate)}`}</span>
                <span className="flex items-center gap-1"><Users size={12} strokeWidth={2} className="text-[#3C4048]/40" />{r.passengerCount}</span>
              </div>
              <div className="text-[#3C4048]/70">
                {VEHICLE_LABEL[r.vehicleType]} &middot; <span suppressHydrationWarning>{timeAgo(r.submittedAt)}</span>
              </div>
              {r.specialRequirements && (
                <div className="text-[#DB8A2E]">Note: {r.specialRequirements}</div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[#E3E0D6] bg-white px-5 py-10 text-center text-[13px] text-[#3C4048]/50">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}
