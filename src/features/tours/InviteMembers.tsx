import { useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconLink({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconShare({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IconCopy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconUserPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconCalendar({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Owner pill (Rafi · Owner · You) ─────────────────────────────────────────
function OwnerPill() {
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-[12px] border border-[#E1E7EF] px-3 py-2.5 w-fit">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-700 shrink-0"
        style={{ backgroundColor: "#0A86A0" }}
      >
        RI
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-700 text-[#0F172A] leading-none">Rafi</p>
        <p className="text-[11px] font-500 text-[#94A3B8] mt-[3px] leading-none">Owner · You</p>
      </div>
    </div>
  );
}

// ─── InviteMembers ────────────────────────────────────────────────────────────
interface InviteMembersProps {
  tourName:  string;
  tourDates: string;
  onBack:    () => void;
  onDone:    () => void;
}

const INVITE_URL = "tourapp.com/join/K7DQ92";

export default function InviteMembers({ tourName, tourDates, onBack, onDone }: InviteMembersProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`https://${INVITE_URL}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Join ${tourName}`,
        text:  `Track expenses together for ${tourName}. Join here:`,
        url:   `https://${INVITE_URL}`,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#F4F6F9] z-50"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-2 px-4 h-[52px]">
          <button
            onClick={onBack}
            className="pressable -ml-1 w-9 h-9 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Go back"
          >
            <IconChevronLeft />
          </button>
          <h1 className="flex-1 text-[15px] font-700 text-[#0F172A] leading-none">Invite members</h1>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-4 pt-7 pb-10 space-y-6">

          {/* ── Heading block ─────────────────────────────────────────────── */}
          <div>
            <h2 className="text-[24px] font-800 text-[#0F172A] leading-tight tracking-[-0.3px]">
              Bring your group in
            </h2>
            <p className="text-[14px] font-500 text-[#475569] mt-2 leading-relaxed max-w-[340px]">
              Share this invite with your friends so everyone can add expenses and track balances together.
            </p>
          </div>

          {/* ── Tour context chip ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <OwnerPill />
            <div className="flex items-center gap-1.5 text-[12px] font-500 text-[#94A3B8]">
              <IconCalendar size={12} />
              <span>{tourDates}</span>
            </div>
          </div>

          {/* ── Invite card ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-[18px] border border-[#E1E7EF] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.04)]">

            {/* Tour name band */}
            <div className="px-5 pt-5 pb-4 border-b border-[#F1F5F9]">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider mb-1">Tour</p>
              <p className="text-[16px] font-700 text-[#0F172A] leading-snug">{tourName}</p>
            </div>

            {/* Link row */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider mb-2.5">Invite link</p>
              <div className="flex items-center gap-3 bg-[#F4F6F9] rounded-[12px] px-3.5 py-3 border border-[#E1E7EF]">
                <div className="text-[#0A86A0] shrink-0">
                  <IconLink size={15} />
                </div>
                <p className="flex-1 text-[13px] font-600 text-[#0F172A] truncate font-mono tracking-tight select-all">
                  {INVITE_URL}
                </p>
              </div>
              <p className="text-[11px] font-500 text-[#94A3B8] mt-2 leading-relaxed">
                Anyone with this link can join the tour. The link stays valid for the duration of the trip.
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              {/* Primary: Share invite */}
              <button
                onClick={handleShare}
                className="pressable w-full h-[50px] rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(10,134,160,0.22)] active:scale-[0.98] transition-transform"
              >
                <IconShare size={17} />
                Share invite
              </button>

              {/* Secondary: Copy link */}
              <button
                onClick={handleCopy}
                className={`pressable w-full h-[44px] rounded-[13px] border font-600 text-[14px] flex items-center justify-center gap-2 transition-colors ${
                  copied
                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
                    : "bg-white border-[#E1E7EF] text-[#475569]"
                }`}
              >
                {copied ? (
                  <>
                    <IconCheck size={15} />
                    Link copied
                  </>
                ) : (
                  <>
                    <IconCopy size={15} />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Add guest ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-start gap-3.5 px-1">
              <div className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E7EF] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
                <IconUserPlus size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <button
                  className="pressable text-[14px] font-600 text-[#0A86A0] text-left leading-snug"
                  onClick={() => {/* opens guest sheet */}}
                >
                  Add someone without an account
                </button>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 leading-relaxed">
                  Add a guest if someone won't use the app themselves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer actions ───────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-4 py-4 space-y-2">
          <button
            onClick={onDone}
            className="pressable w-full h-[50px] rounded-[13px] bg-[#0F172A] text-white font-700 text-[15px] active:scale-[0.98] transition-transform"
          >
            Done
          </button>
          <button
            onClick={onDone}
            className="pressable w-full h-[40px] text-[13px] font-600 text-[#94A3B8]"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
