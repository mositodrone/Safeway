import Link from 'next/link'
import { Bus, ArrowLeft } from 'lucide-react'

// app/not-found.tsx
// Next.js renders this automatically for any unmatched route.
// Pure CSS animation — no extra dependencies needed.

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F7F6F2] px-6">

      {/* ── Illustration ─────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[640px]">
        <svg
          viewBox="0 0 800 420"
          className="w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Road — perspective trapezoid running to a vanishing point */}
          <path
            d="M 40 420 L 300 190 L 500 190 L 760 420 Z"
            fill="#22262E"
          />

          {/* Center dashed lane line */}
          <path
            d="M 400 420 L 400 195"
            stroke="#F7F6F2"
            strokeWidth="6"
            strokeDasharray="18 16"
            opacity="0.35"
          />

          {/* Cliff edge — the road simply stops at the horizon */}
          <path
            d="M 300 190 L 500 190"
            stroke="#DB8A2E"
            strokeWidth="3"
            strokeDasharray="2 6"
            strokeLinecap="round"
          />
          {/* Void beyond the edge — faint scattered dots, "uncharted" */}
          <g opacity="0.25">
            <circle cx="330" cy="150" r="2" fill="#3C4048" />
            <circle cx="470" cy="140" r="1.6" fill="#3C4048" />
            <circle cx="400" cy="120" r="1.6" fill="#3C4048" />
            <circle cx="360" cy="165" r="1.3" fill="#3C4048" />
            <circle cx="440" cy="160" r="1.3" fill="#3C4048" />
          </g>

          {/* Skid marks — swerve in from the road and stop dead at the edge */}
          <path
            className="skid-path"
            d="M 150 420 C 220 340, 250 260, 360 200"
            stroke="#14181F"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
          />
          <path
            className="skid-path skid-path-delay"
            d="M 230 420 C 280 350, 300 270, 410 200"
            stroke="#14181F"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
          />
        </svg>

        {/* Bus — tipped forward at the edge, front hanging over the cliff */}
        <div className="bus-wobble absolute" style={{ top: '38%', left: '48%' }}>
          <div className="flex h-11 w-11 -rotate-[14deg] items-center justify-center rounded-lg bg-[#DB8A2E] shadow-lg">
            <Bus size={22} strokeWidth={2.2} className="text-[#14181F]" />
          </div>
        </div>
      </div>

      {/* ── Copy ─────────────────────────────────────────────────────────── */}
      <div className="fade-up relative mt-2 flex flex-col items-center text-center">
        <span className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-[#DB8A2E]">
          404
        </span>
        <h1
          className="text-[32px] font-semibold leading-tight text-[#14181F] sm:text-[38px]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Page not found
        </h1>
        <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-[#3C4048]/70">
          We couldn&apos;t book a trip to that page — the road just stops here.
        </p>

        <Link
          href="/"
          className="mt-8 flex items-center gap-2 rounded-lg bg-[#14181F] px-5 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#22262E]"
        >
          <ArrowLeft size={15} strokeWidth={2.3} />
          Back to safety
        </Link>
      </div>

      {/* ── Animations ───────────────────────────────────────────────────── */}
      <style>{`
        .skid-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw-skid 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .skid-path-delay {
          animation-delay: 0.12s;
        }
        @keyframes draw-skid {
          to { stroke-dashoffset: 0; }
        }

        .bus-wobble {
          opacity: 0;
          animation: bus-in 0.5s ease-out 1s forwards,
                     bus-float 2.6s ease-in-out 1.6s infinite;
        }
        @keyframes bus-in {
          from { opacity: 0; transform: translateY(-6px) rotate(-14deg) scale(0.85); }
          to   { opacity: 1; transform: translateY(0)   rotate(-14deg) scale(1); }
        }
        @keyframes bus-float {
          0%, 100% { transform: translateY(0)    rotate(-14deg); }
          50%      { transform: translateY(-4px) rotate(-11deg); }
        }

        .fade-up {
          opacity: 0;
          animation: fade-up-in 0.6s ease-out 0.3s forwards;
        }
        @keyframes fade-up-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
