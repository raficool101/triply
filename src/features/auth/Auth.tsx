import { useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthScreen = "signin" | "signup" | "forgot" | "reset-sent";

// ─── Inline Icons ─────────────────────────────────────────────────────────────
function IconEye({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
      <path d="M8.71 8.71a4 4 0 005.58 5.58" />
    </svg>
  );
}

function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconAlertSmall({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconMailCheck({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8" />
      <path d="M2 6l10 7 10-7" />
      <path d="M16 19l2 2 4-4" />
    </svg>
  );
}

function IconSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 010 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Product Mark ─────────────────────────────────────────────────────────────
function ProductMark() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* App mark — rounded square with a split-path icon */}
      <div className="w-12 h-12 rounded-[14px] bg-[#0A86A0] flex items-center justify-center shadow-[0_2px_12px_rgba(10,134,160,0.22)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {/* Fork/split path: represents group expense sharing */}
          <circle cx="12" cy="5"  r="2" fill="white" />
          <circle cx="7"  cy="19" r="2" fill="white" />
          <circle cx="17" cy="19" r="2" fill="white" />
          <path d="M12 7v5M12 12l-3.5 5M12 12l3.5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[18px] font-800 text-[#0F172A] tracking-tight">Triply</span>
    </div>
  );
}

// ─── Shared Form Primitives ───────────────────────────────────────────────────
const INPUT_BASE =
  "w-full h-12 px-4 bg-white border rounded-[12px] text-[15px] font-500 text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors";
const INPUT_NORMAL  = `${INPUT_BASE} border-[#E1E7EF] focus:border-[#0A86A0] focus:ring-2 focus:ring-[#0A86A0]/10`;
const INPUT_ERROR   = `${INPUT_BASE} border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 bg-[#FFFBFB]`;

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-[12px] font-500 text-[#DC2626] mt-0.5">
      <IconAlertSmall />
      {message}
    </p>
  );
}

function FormField({
  label,
  labelRight,
  error,
  children,
}: {
  label: string;
  labelRight?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-600 text-[#0F172A]">{label}</label>
        {labelRight}
      </div>
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        autoComplete={autoComplete ?? "current-password"}
        className={`${hasError ? INPUT_ERROR : INPUT_NORMAL} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  disabled,
  type = "submit",
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="w-full h-12 rounded-[12px] bg-[#0A86A0] text-white text-[15px] font-700 flex items-center justify-center gap-2 shadow-[0_1px_4px_rgba(10,134,160,0.16)] transition-opacity disabled:opacity-60 active:scale-[0.98]"
    >
      {loading && <IconSpinner size={17} />}
      {children}
    </button>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-[#FFF5F5] border border-[#FECACA]">
      <IconAlertSmall size={14} />
      <p className="text-[13px] font-500 text-[#DC2626] leading-snug">{message}</p>
    </div>
  );
}

// ─── Auth Shell Wrapper ───────────────────────────────────────────────────────
// The safe-area zone is a dedicated structural block, kept separate from
// application content so the two never overlap on any device.
//
// Zone map (mobile):
//   ┌──────────────────────────────────┐
//   │  System / Dynamic Island / notch  │  ← NOT our content
//   ├──────────────────────────────────┤  ← safe-area boundary
//   │  safe-top spacer (env inset)     │
//   ├──────────────────────────────────┤
//   │  pt-9 breathing room             │
//   │  ProductMark (logo + wordmark)   │
//   │  ...content...                   │
//   └──────────────────────────────────┘
//
// viewport-fit=cover (set in index.html) must be present for
// env(safe-area-inset-top) to return a real value on iOS devices.
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-white md:bg-[#F4F6F9] flex flex-col">
      {/* Safe-area spacer: height = env(safe-area-inset-top, 0px).
          This is purely structural — it has no visible background or border.
          Content never starts until this block ends. */}
      <div className="safe-top shrink-0" />

      {/* Application content area */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center md:py-10">
        <div className="w-full md:max-w-[420px] md:bg-white md:border md:border-[#E1E7EF] md:rounded-[20px] md:shadow-[0_4px_32px_rgba(15,23,42,0.08)] px-6 pt-9 pb-10 md:px-8 md:py-10 safe-bottom flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Sign In Screen ───────────────────────────────────────────────────────────
function SignInScreen({
  onAuthenticate,
  onSignUp,
  onForgot,
}: {
  onAuthenticate: () => void;
  onSignUp: () => void;
  onForgot: () => void;
}) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});
  const [authErr,  setAuthErr]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())          e.email    = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password)              e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAuthErr("");
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await sleep(900);
    setLoading(false);
    // Demo: treat a specific email as "wrong password" to show error state.
    if (email.trim().toLowerCase() === "error@example.com") {
      setAuthErr("Incorrect email or password. Please try again.");
      return;
    }
    onAuthenticate();
  };

  return (
    <AuthShell>
      {/* Identity — stands alone with generous breathing room below */}
      <ProductMark />

      {/* Welcome section — clear break from the logo */}
      <div className="flex flex-col gap-1.5 mt-9">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Welcome back</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">Sign in to continue managing your tours.</p>
      </div>

      {/* Form — tighter bond with heading above it */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        {authErr && <AuthError message={authErr} />}

        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <FormField
          label="Password"
          error={errors.password}
          labelRight={
            <button
              type="button"
              onClick={onForgot}
              className="text-[12px] font-600 text-[#0A86A0] hover:underline"
            >
              Forgot password?
            </button>
          }
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            hasError={!!errors.password}
            autoComplete="current-password"
          />
        </FormField>

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </div>
      </form>

      {/* Secondary — clear separation from the primary action */}
      <p className="text-center text-[14px] font-500 text-[#64748B] mt-8">
        New here?{" "}
        <button onClick={onSignUp} className="font-700 text-[#0A86A0] hover:underline">
          Create account
        </button>
      </p>
    </AuthShell>
  );
}

// ─── Create Account Screen ────────────────────────────────────────────────────
function CreateAccountScreen({
  onAuthenticate,
  onSignIn,
}: {
  onAuthenticate: () => void;
  onSignIn: () => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim())             e.name     = "Your name is required.";
    if (!email.trim())            e.email    = "Email is required.";
    else if (!isValidEmail(email)) e.email   = "Enter a valid email address.";
    if (!password)                e.password = "Password is required.";
    else if (password.length < 8) e.password = "Use at least 8 characters.";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await sleep(1000);
    setLoading(false);
    onAuthenticate();
  };

  return (
    <AuthShell>
      {/* Identity */}
      <ProductMark />

      {/* Heading */}
      <div className="flex flex-col gap-1.5 mt-9">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Create your account</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">Start tracking your group tour expenses.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        <FormField label="Your name" error={errors.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rafi Islam"
            autoComplete="name"
            autoCapitalize="words"
            className={errors.name ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <FormField label="Password" error={errors.password}>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="8+ characters"
            hasError={!!errors.password}
            autoComplete="new-password"
          />
        </FormField>

        {/* Password strength hint — appears only once user starts typing */}
        {password.length > 0 && password.length < 8 && !errors.password && (
          <p className="text-[12px] font-500 text-[#94A3B8] -mt-2">
            {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
          </p>
        )}

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </div>
      </form>

      {/* Terms note */}
      <p className="text-center text-[12px] font-500 text-[#94A3B8] leading-relaxed mt-4">
        By creating an account you agree to our{" "}
        <span className="text-[#475569] underline underline-offset-2 cursor-pointer">Terms</span>
        {" "}and{" "}
        <span className="text-[#475569] underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
      </p>

      {/* Secondary */}
      <p className="text-center text-[14px] font-500 text-[#64748B] mt-6">
        Already have an account?{" "}
        <button onClick={onSignIn} className="font-700 text-[#0A86A0] hover:underline">
          Sign in
        </button>
      </p>
    </AuthShell>
  );
}

// ─── Forgot Password Screen ───────────────────────────────────────────────────
function ForgotPasswordScreen({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: (email: string) => void;
}) {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim())          { setError("Email is required.");              return; }
    if (!isValidEmail(email))   { setError("Enter a valid email address.");    return; }
    setError("");
    setLoading(true);
    await sleep(900);
    setLoading(false);
    onSent(email.trim());
  };

  return (
    <AuthShell>
      {/* Back navigation — sits just below the safe area with the shell's pt-9 */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[14px] font-600 text-[#475569] hover:text-[#0F172A] -ml-1 w-fit transition-colors"
        aria-label="Back to sign in"
      >
        <IconChevronLeft size={18} />
        Back
      </button>

      {/* Heading */}
      <div className="flex flex-col gap-1.5 mt-8">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Reset password</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">
          Enter your email and we'll send you a password reset link.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        <FormField label="Email" error={error}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            autoFocus
            className={error ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </PrimaryButton>
        </div>
      </form>
    </AuthShell>
  );
}

// ─── Reset Email Sent Screen ──────────────────────────────────────────────────
function ResetEmailSentScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <AuthShell>
      {/* Success indicator */}
      <div className="flex flex-col items-center pt-2">
        <div className="w-16 h-16 rounded-[20px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#15803D]">
          <IconMailCheck size={32} />
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2 text-center mt-8">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Check your email</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">
          We sent a password reset link to:
        </p>
        <p className="text-[15px] font-700 text-[#0F172A]">{email}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-9">
        <a
          href={`mailto:${email}`}
          className="w-full h-12 rounded-[12px] bg-[#0A86A0] text-white text-[15px] font-700 flex items-center justify-center shadow-[0_1px_4px_rgba(10,134,160,0.16)] active:scale-[0.98] transition-transform"
        >
          Open email app
        </a>
        <button
          onClick={onBack}
          className="w-full h-12 rounded-[12px] border border-[#E1E7EF] bg-white text-[15px] font-600 text-[#475569] flex items-center justify-center hover:bg-[#F4F6F9] active:scale-[0.98] transition-all"
        >
          Back to sign in
        </button>
      </div>

      {/* Hint */}
      <p className="text-center text-[13px] font-500 text-[#94A3B8] leading-relaxed mt-7">
        Didn't receive it? Check your spam folder, or{" "}
        <button onClick={onBack} className="text-[#0A86A0] font-600 hover:underline">
          try again
        </button>
        .
      </p>
    </AuthShell>
  );
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────
// Manages screen transitions. Exported for use in App.tsx.
export function AuthFlow({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [screen,     setScreen]     = useState<AuthScreen>("signin");
  const [resetEmail, setResetEmail] = useState("");

  return (
    <>
      {screen === "signin" && (
        <SignInScreen
          onAuthenticate={onAuthenticate}
          onSignUp={() => setScreen("signup")}
          onForgot={() => setScreen("forgot")}
        />
      )}
      {screen === "signup" && (
        <CreateAccountScreen
          onAuthenticate={onAuthenticate}
          onSignIn={() => setScreen("signin")}
        />
      )}
      {screen === "forgot" && (
        <ForgotPasswordScreen
          onBack={() => setScreen("signin")}
          onSent={(email) => { setResetEmail(email); setScreen("reset-sent"); }}
        />
      )}
      {screen === "reset-sent" && (
        <ResetEmailSentScreen
          email={resetEmail}
          onBack={() => setScreen("signin")}
        />
      )}
    </>
  );
}
