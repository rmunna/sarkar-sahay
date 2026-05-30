export default function TelegramCTA() {
  return (
    <div className="mt-10 rounded-2xl overflow-hidden border border-[#229ED9]/30 bg-gradient-to-br from-[#E8F4FD] to-[#D0EAFA]">
      <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-5">
        {/* Telegram icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#229ED9] flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-base font-bold text-gray-900 leading-snug">
            Get instant exam alerts on Telegram
          </p>
          <p className="text-sm text-gray-600 mt-1">
            SSC, UPSC, NEET, JEE results — posted the moment they drop.
            Join 100% free.
          </p>
        </div>

        {/* CTA button */}
        <a
          href="https://t.me/citizennest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#229ED9] hover:bg-[#1a8bbf] text-white text-sm font-bold rounded-xl transition shadow-sm whitespace-nowrap"
        >
          Join @citizennest
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
