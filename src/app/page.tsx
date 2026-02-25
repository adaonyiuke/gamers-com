import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-[20px] overflow-hidden mx-auto mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
          <Image
            src="/icon-192.png"
            alt="Game Night HQ"
            width={192}
            height={192}
            className="w-full h-full object-cover scale-[1.25]"
            priority
          />
        </div>
        <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
          Game Night HQ
        </h1>
        <p className="text-gray-500 text-[17px] mt-2 mb-8">
          Track your game nights, crown champions, and build rivalries.
        </p>
        <div className="space-y-3">
          <Link
            href="/signup"
            className="block w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block w-full text-[#007AFF] text-[17px] font-medium text-center py-3"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
