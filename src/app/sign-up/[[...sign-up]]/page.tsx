import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF1F5] px-6 py-16">
      <SignUp />
    </div>
  )
}