import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { GrainLocal } from "../GrainOverlay";
import { useAuth } from "../../lib/auth";
import {
  clearLocalProfileDraft,
  getActorDescriptor,
  readLocalProfileDraft,
  writeLocalProfileDraft,
} from "../../lib/actor";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import {
  AccountActionButton,
  AccountField,
  ease,
  mono,
} from "./AccountUi";

type ProfileFormState = {
  fullName: string;
  role: string;
  workspace: string;
};

type StatusTone = "error" | "success";

function getProviders(user: ReturnType<typeof useAuth>["user"]) {
  const providerSet = new Set<string>();

  const appProviders = user?.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === "string" && provider.trim()) {
        providerSet.add(provider.trim());
      }
    }
  }

  for (const identity of user?.identities || []) {
    if (typeof identity.provider === "string" && identity.provider.trim()) {
      providerSet.add(identity.provider.trim());
    }
  }

  if (providerSet.size === 0) {
    providerSet.add("email");
  }

  return [...providerSet];
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong while updating your profile.";
}

function isMissingProfilesTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? (error as { code?: unknown }).code : null;
  const message = "message" in error ? (error as { message?: unknown }).message : null;

  return (
    code === "42P01" ||
    (typeof message === "string" &&
      message.toLowerCase().includes("profiles") &&
      message.toLowerCase().includes("not exist"))
  );
}

function StatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: StatusTone;
}) {
  return (
    <motion.div
      key={message}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease }}
      style={{
        border: `1px solid ${tone === "error" ? "rgba(255,107,107,0.28)" : "rgba(26,61,26,0.16)"}`,
        backgroundColor: tone === "error" ? "rgba(255,107,107,0.08)" : "rgba(209,255,0,0.1)",
        padding: "14px 16px",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        color: tone === "error" ? "#8A2626" : "#1A3D1A",
      }}
    >
      {message}
    </motion.div>
  );
}

function ProfileLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        paddingBottom: 16,
        borderBottom: "1px solid rgba(5,5,5,0.12)",
      }}
    >
      <span style={{ ...mono, fontSize: 9, color: "#686868" }}>{label}</span>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.5,
          color: "#050505",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function AnimatedWordLine({
  text,
  delay = 0,
  style,
}: {
  text: string;
  delay?: number;
  style: CSSProperties;
}) {
  return (
    <div aria-label={text} role="text" style={style}>
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.52, ease, delay: delay + index * 0.05 }}
          style={{ display: "inline-block", marginRight: "0.24em", willChange: "transform, opacity, filter" }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { displayName, isAuthenticated, signOut, user } = useAuth();
  const metadata = user?.user_metadata || {};
  const actor = getActorDescriptor(user, displayName);
  const providers = isAuthenticated ? getProviders(user) : ["local browser"];
  const [form, setForm] = useState<ProfileFormState>(() =>
    isAuthenticated
      ? {
          fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
          role: typeof metadata.role === "string" ? metadata.role : "",
          workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
        }
      : readLocalProfileDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: StatusTone } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setForm({
        fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
        role: typeof metadata.role === "string" ? metadata.role : "",
        workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
      });
      return;
    }

    setForm(readLocalProfileDraft());
  }, [displayName, isAuthenticated, metadata.full_name, metadata.role, metadata.workspace, user?.id]);

  const busy = saving || signingOut || deletingAccount;
  const initialsSource = (form.fullName || displayName || user?.email || actor.label || "FR").trim();
  const initials = initialsSource
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const accountLabel = isAuthenticated ? "Account" : "Guest";
  const primaryIdentity = isAuthenticated ? user?.email || "Unavailable" : "Local browser profile";
  const providerLabel = providers[0]?.toUpperCase() || "EMAIL";
  const profileFacts = [
    {
      label: "Workspace",
      value: form.workspace || (isAuthenticated ? "Default workspace" : "Local workspace"),
    },
    {
      label: "Role",
      value: form.role || (isAuthenticated ? "Member" : "Guest"),
    },
    {
      label: "Mode",
      value: isAuthenticated ? "Authenticated account" : "Guest browser session",
    },
  ];

  function updateField(field: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const nextForm = {
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      workspace: form.workspace.trim(),
    };

    try {
      if (!isAuthenticated) {
        writeLocalProfileDraft(nextForm);
        setStatus({
          message: "Guest profile saved locally.",
          tone: "success",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          full_name: nextForm.fullName,
          role: nextForm.role,
          workspace: nextForm.workspace,
        },
      });

      if (error) {
        throw error;
      }

      const { error: profileSyncError } = await supabase.from("profiles").upsert({
        id: user?.id,
        email: user?.email || null,
        full_name: nextForm.fullName,
        role: nextForm.role,
        workspace: nextForm.workspace,
        avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
        provider: providers[0] || "email",
      });

      if (profileSyncError && !isMissingProfilesTableError(profileSyncError)) {
        throw profileSyncError;
      }

      setStatus({
        message: profileSyncError
          ? "Profile saved. The public profiles table is not set up yet."
          : "Profile updated.",
        tone: "success",
      });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setSigningOut(true);
    setStatus(null);

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
      setSigningOut(false);
    }
  }

  function handleResetGuestProfile() {
    clearLocalProfileDraft();
    setForm({ fullName: "", role: "", workspace: "" });
    setStatus({ message: "Guest profile cleared from this browser.", tone: "success" });
  }

  async function handleDeleteAccount() {
    if (!isAuthenticated) {
      handleResetGuestProfile();
      return;
    }

    const confirmed = window.confirm("Delete this account permanently? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setStatus(null);

    try {
      await api.deleteAccount();
      await signOut().catch(() => undefined);
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
      setDeletingAccount(false);
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#F3F0E6", paddingTop: 72 }}>
      <GrainLocal opacity={0.035} />

      <div
        className="pointer-events-none absolute inset-x-0 top-[72px]"
        style={{ height: 1, backgroundColor: "rgba(5,5,5,0.08)" }}
      />

      <div
        className="relative z-10 mx-auto grid gap-12"
        style={{ maxWidth: 1360, padding: "clamp(28px, 4vw, 44px) clamp(20px, 3vw, 40px) clamp(48px, 5vw, 72px)" }}
      >
        <motion.section
          className="grid gap-8 border-b border-[rgba(5,5,5,0.08)] pb-10 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)] xl:gap-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease }}
        >
          <div className="grid gap-5">
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: "#1A3D1A",
                display: "inline-block",
                width: "fit-content",
              }}
            >
              [Profile]
            </div>

            <AnimatedWordLine
              text="Your Profile."
              delay={0.08}
              style={{
                fontFamily: "'TASA Orbiter', Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2.2rem, 4.5vw, 4.8rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.08em",
                color: "#050505",
                textTransform: "uppercase",
                maxWidth: 560,
              }}
            />
          </div>

          <div
            className="grid gap-6 xl:pl-8"
            style={{
              borderLeft: "1px solid rgba(5,5,5,0.08)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-5">
                <div
                  style={{
                    ...mono,
                    fontSize: 36,
                    lineHeight: 0.9,
                    color: "#050505",
                    flexShrink: 0,
                    paddingTop: 6,
                  }}
                >
                  {initials || "FR"}
                </div>

                <div className="grid gap-2">
                  <AnimatedWordLine
                    text={form.fullName || actor.label}
                    delay={0.18}
                    style={{
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(1.7rem, 2.3vw, 2.5rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.07em",
                      color: "#050505",
                      textTransform: "uppercase",
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease, delay: 0.34 }}
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: 1.6, color: "#5F5D57" }}
                  >
                    {primaryIdentity}
                  </motion.div>
                </div>
              </div>

              <div className="grid gap-2 sm:justify-items-end">
                <span
                  style={{
                    ...mono,
                    fontSize: 9,
                    color: "#050505",
                    backgroundColor: "#D1FF00",
                    border: "1px solid #D1FF00",
                    padding: "7px 10px",
                  }}
                >
                  {accountLabel}
                </span>
                <span style={{ ...mono, fontSize: 9, color: "#686868" }}>{providerLabel}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {profileFacts.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2"
                  style={{
                    paddingTop: 14,
                    borderTop: "1px solid rgba(5,5,5,0.12)",
                  }}
                >
                  <span style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      lineHeight: 1.5,
                      color: "#050505",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          className="grid gap-12 xl:grid-cols-[minmax(0,1.12fr)_320px] xl:items-start"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.76, ease, delay: 0.08 }}
        >
          <div className="grid gap-8">
            <form onSubmit={handleSave}>
              <section className="grid gap-8">
                <div className="grid gap-4 border-t-2 border-[#050505] pt-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
                <div className="grid gap-3">
                  <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Edit Profile</div>
                  <AnimatedWordLine
                    text="Update Details."
                    delay={0.1}
                    style={{
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontSize: "clamp(1.45rem, 2.25vw, 2.2rem)",
                      fontWeight: 800,
                      letterSpacing: "-0.06em",
                      lineHeight: 0.96,
                      textTransform: "uppercase",
                      color: "#050505",
                    }}
                  />
                </div>

                  <div className="grid gap-2 border-t border-[rgba(5,5,5,0.12)] pt-4 lg:border-t-0 lg:pt-0">
                    <span style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Current Mode</span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#050505",
                      }}
                    >
                      {isAuthenticated ? "Signed-in profile" : "Guest profile"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <AccountField
                    autoComplete="name"
                    disabled={busy}
                    icon={<UserRound size={15} />}
                    label="Full Name"
                    onChange={(value) => updateField("fullName", value)}
                    placeholder={isAuthenticated ? "Ava Morgan" : "Your name"}
                    type="text"
                    value={form.fullName}
                  />
                  <AccountField
                    autoComplete="organization-title"
                    disabled={busy}
                    icon={<ShieldCheck size={15} />}
                    label="Role"
                    onChange={(value) => updateField("role", value)}
                    placeholder={isAuthenticated ? "Product lead" : "Role"}
                    type="text"
                    value={form.role}
                  />
                  <AccountField
                    autoComplete="organization"
                    disabled={busy}
                    icon={<BriefcaseBusiness size={15} />}
                    label="Workspace"
                    onChange={(value) => updateField("workspace", value)}
                    placeholder={isAuthenticated ? "Northwind Studio" : "Workspace"}
                    type="text"
                    value={form.workspace}
                  />
                  <AccountField
                    autoComplete="email"
                    disabled
                    icon={<Mail size={15} />}
                    label={isAuthenticated ? "Email" : "Mode"}
                    onChange={() => undefined}
                    placeholder={isAuthenticated ? "Email" : "Guest"}
                    type="text"
                    value={isAuthenticated ? user?.email || "" : "Guest mode"}
                  />
                </div>

                <div className="grid gap-3 border-t border-[rgba(5,5,5,0.08)] pt-5 sm:grid-cols-2">
                  <AccountActionButton disabled={busy} emphasize type="submit">
                    <span>{saving ? "Saving..." : "Save Profile"}</span>
                    <Sparkles size={13} />
                  </AccountActionButton>

                  <AccountActionButton disabled={busy} onClick={() => navigate("/dashboard")}>
                    <span>Open Dashboard</span>
                    <ArrowRight size={13} />
                  </AccountActionButton>
                </div>
              </section>
            </form>

            <AnimatePresence mode="wait">
              {status ? <StatusMessage message={status.message} tone={status.tone} /> : null}
            </AnimatePresence>
          </div>

          <aside className="grid gap-8 xl:border-l xl:border-[rgba(5,5,5,0.08)] xl:pl-8">
            <section className="grid gap-4 border-t-2 border-[#050505] pt-6">
              <div className="grid gap-2">
                <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Live Readout</div>
              </div>

              <ProfileLine label="Identity" value={form.fullName || actor.label} />
              <ProfileLine label="Contact" value={primaryIdentity} />
              <ProfileLine label="Provider" value={providers.join(", ")} />
            </section>

            <section className="grid gap-4 border-t border-[rgba(5,5,5,0.12)] pt-6">
              <div className="grid gap-2">
                <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>
                  {isAuthenticated ? "Account Actions" : "Guest Actions"}
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <AccountActionButton disabled={busy} onClick={() => void handleSignOut()}>
                    <span className="inline-flex items-center gap-2">
                      <LogOut size={13} />
                      {signingOut ? "Signing Out..." : "Sign Out"}
                    </span>
                    <ArrowRight size={13} />
                  </AccountActionButton>

                  <AccountActionButton disabled={busy} onClick={() => void handleDeleteAccount()}>
                    <span className="inline-flex items-center gap-2" style={{ color: "#8A2626" }}>
                      <Trash2 size={13} />
                      {deletingAccount ? "Deleting..." : "Delete Account"}
                    </span>
                    <ArrowRight size={13} />
                  </AccountActionButton>
                </>
              ) : (
                <AccountActionButton disabled={busy} onClick={handleResetGuestProfile}>
                  <span className="inline-flex items-center gap-2" style={{ color: "#8A2626" }}>
                    <Trash2 size={13} />
                    Clear Guest Profile
                  </span>
                  <ArrowRight size={13} />
                </AccountActionButton>
              )}

              <div className="grid gap-3 border-t border-[rgba(5,5,5,0.12)] pt-5">
                <AccountActionButton disabled={busy} emphasize onClick={() => navigate("/composer")}>
                  <span>Go To Composer</span>
                  <ArrowRight size={13} />
                </AccountActionButton>
              </div>
            </section>
          </aside>
        </motion.div>
      </div>
    </section>
  );
}
