import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f3d] via-[#1B3464] to-[#0f1f3d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative h-16 w-56 mb-3">
            <Image
              src="/logo/pilot-plus.png"
              alt="PILOT+"
              fill
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          <p className="text-white/50 text-sm tracking-wider uppercase">
            Copilot IA d&apos;analyse DCE
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
