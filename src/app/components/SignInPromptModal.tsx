'use client'

// app/book/_components/SignInPromptModal.tsx
//
// Shown a beat after the request is submitted — not blocking the
// confirmation screen itself, just layered on top of it. Deliberately
// low-pressure: the request already exists whether or not they sign in,
// so this is a genuine offer, not a gate.

import Link from 'next/link'

interface SignInPromptModalProps {
  open: boolean
  onDismiss: () => void
  reference: string
}

export default function SignInPromptModal({ open, onDismiss, reference }: SignInPromptModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1424]/50 px-6 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[0_30px_70px_-15px_rgba(13,20,36,0.35)]"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1F5]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
              stroke="#0D1424" strokeWidth="1.5"
            />
            <path
              d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
              stroke="#0D1424" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="font-[family-name:var(--font-display)] mt-4 text-center text-xl font-semibold text-[#0D1424]">
          Get updates on this request
        </h2>
        <p className="font-[family-name:var(--font-body)] mt-2 text-center text-sm leading-relaxed text-[#4B5768]">
          Create a free account and we&rsquo;ll notify you the moment
          <span className="font-medium text-[#0D1424]"> {reference} </span>
          is confirmed — and your details are saved for next time.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {/* Point this at your actual Clerk sign-up route/modal trigger */}
          <Link
            href={`/sign-up?ref=${reference}`}
            className="font-[family-name:var(--font-display)] flex w-full items-center justify-center rounded-xl bg-[#E2A63B] py-3 text-sm font-semibold text-[#0D1424] transition-colors hover:bg-[#EDB65A]"
          >
            Create free account
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="font-[family-name:var(--font-body)] w-full rounded-xl py-3 text-sm font-medium text-[#4B5768] transition-colors hover:bg-[#EEF1F5]"
          >
            Maybe later
          </button>
        </div>

        <p className="font-[family-name:var(--font-body)] mt-4 text-center text-xs text-[#8A94A3]">
          You&rsquo;ll still get updates by email either way.
        </p>
      </div>
    </div>
  )
}
