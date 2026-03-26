import { useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ArrowRight, CalendarRange, Mail, MessageSquareMore, Puzzle, Sparkles } from "lucide-react";
import { AnimatedHeadline, FadeIn } from "../AnimatedText";
import { GrainLocal } from "../GrainOverlay";

const mono: CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const palette = {
  lime: "#D1FF00",
  black: "#050505",
  cream: "#F4F4E8",
  creamBright: "#FFFFED",
  muted: "#686868",
  softBorder: "rgba(156,156,156,0.15)",
};

const projectTypes = [
  "Product demo",
  "Pilot planning",
  "Workflow redesign",
  "Explainability review",
];

const quickLinks = [
  {
    icon: Sparkles,
    label: "Product Demo",
    title: "See the composer live",
    body: "Walk through prompt mapping, live edits, and the trust layer with your own workflow in mind.",
    subject: "Frigate demo request",
  },
  {
    icon: Puzzle,
    label: "Integration",
    title: "Connect Frigate to your stack",
    body: "Use Frigate alongside your generation pipeline, creative tooling, or internal evaluation flow.",
    subject: "Frigate integration inquiry",
  },
  {
    icon: MessageSquareMore,
    label: "Strategy",
    title: "Unblock a stuck prompt workflow",
    body: "Bring the problem area, the messy prompt history, or the quality gap. We will help shape the next move.",
    subject: "Frigate workflow strategy inquiry",
  },
];

function BlurReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function GridFrame({
  children,
  background,
  borderColor,
}: {
  children: React.ReactNode;
  background: string;
  borderColor: string;
}) {
  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: background }}>
      <GrainLocal opacity={background === palette.black ? 0.12 : 0.04} />

      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r" style={{ borderColor }} />
          <div className="border-r" style={{ borderColor }} />
          <div className="border-r" style={{ borderColor }} />
          <div />
        </div>
      </div>

      {children}
    </section>
  );
}

function mailtoLink(subject: string, body?: string) {
  const params = new URLSearchParams({ subject });
  if (body) {
    params.set("body", body);
  }
  return `mailto:hello@frigate.ai?${params.toString()}`;
}

function ContactHero() {
  const navigate = useNavigate();

  return (
    <GridFrame background={palette.black} borderColor="rgba(255,255,255,0.07)">
      <div
        className="relative z-10 mx-auto grid grid-cols-1 md:grid-cols-4"
        style={{
          maxWidth: 1920,
          padding: "clamp(150px, 20vh, 220px) clamp(20px, 3vw, 48px) clamp(72px, 10vw, 120px)",
          minHeight: "100vh",
        }}
      >
        <div className="col-span-1 md:col-span-3 flex flex-col justify-between pr-0 md:pr-10">
          <div>
            <FadeIn delay={0.2}>
              <div
                style={{
                  ...mono,
                  fontSize: 11,
                  color: palette.lime,
                  fontWeight: 700,
                  marginBottom: 22,
                }}
              >
                [01] CONTACT
              </div>
            </FadeIn>

            <AnimatedHeadline delay={0.32} className="max-w-[980px]">
              <span
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.2rem, 6vw, 6.9rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.065em",
                  textTransform: "uppercase",
                  color: palette.cream,
                }}
              >
                Bring us the prompt problem, the workflow mess, or the trust gap.
              </span>
            </AnimatedHeadline>

            <FadeIn delay={0.7}>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(1rem, 1.2vw, 1.12rem)",
                  lineHeight: 1.5,
                  color: "rgba(244,244,232,0.68)",
                  maxWidth: 560,
                  margin: "28px 0 0 0",
                }}
              >
                Frigate is built for teams that need more than outputs. If you are trying to make AI more
                legible, more controllable, and easier to ship, this is the right place to start the conversation.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.84} className="mt-12 md:mt-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={mailtoLink("Frigate contact request")}
                className="group inline-flex items-center justify-between gap-4 no-underline"
                style={{
                  ...mono,
                  backgroundColor: palette.lime,
                  color: palette.black,
                  padding: "18px 22px",
                  minWidth: 260,
                }}
              >
                <span>Email Product Team</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <button
                type="button"
                onClick={() => navigate("/composer")}
                className="group inline-flex items-center justify-between gap-4 border cursor-pointer"
                style={{
                  ...mono,
                  backgroundColor: "transparent",
                  color: palette.cream,
                  borderColor: "rgba(255,255,255,0.18)",
                  padding: "18px 22px",
                  minWidth: 240,
                }}
              >
                <span>Open Composer</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </FadeIn>
        </div>

        <div className="col-span-1 mt-14 md:mt-0 flex items-end">
          <BlurReveal delay={0.92} className="w-full">
            <div
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: 24,
              }}
            >
              <div
                className="absolute top-0 left-0 h-[3px] w-full"
                style={{ background: "linear-gradient(90deg, #D1FF00 0%, rgba(209,255,0,0.15) 100%)" }}
              />

              <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.5)", marginBottom: 24 }}>
                [Direct Lines]
              </div>

              <div className="space-y-6">
                <div>
                  <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.42)", marginBottom: 8 }}>
                    Primary Inbox
                  </div>
                  <a
                    href="mailto:hello@frigate.ai"
                    style={{
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontSize: "clamp(1.1rem, 1.5vw, 1.45rem)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      color: palette.creamBright,
                      textDecoration: "none",
                    }}
                  >
                    hello@frigate.ai
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div
                    className="flex items-start gap-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}
                  >
                    <Mail size={15} style={{ color: palette.lime, marginTop: 2 }} />
                    <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.62)" }}>
                      Best for demos, pilots, workflow reviews, and any question that starts with “our team keeps hitting this wall.”
                    </p>
                  </div>

                  <div
                    className="flex items-start gap-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}
                  >
                    <CalendarRange size={15} style={{ color: palette.lime, marginTop: 2 }} />
                    <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.62)" }}>
                      Useful first note: what you generate, where confidence drops, and what a better outcome should feel like.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BlurReveal>
        </div>
      </div>
    </GridFrame>
  );
}

function QuickRoutes() {
  return (
    <GridFrame background={palette.cream} borderColor="rgba(5,5,5,0.08)">
      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(88px, 10vw, 128px) clamp(20px, 3vw, 48px)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <BlurReveal>
              <div style={{ ...mono, fontSize: 10, color: palette.muted, marginBottom: 18 }}>[02] ROUTE THE ASK</div>
            </BlurReveal>
            <BlurReveal delay={0.08}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.8rem, 3.2vw, 3.4rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.055em",
                  textTransform: "uppercase",
                  color: palette.black,
                  maxWidth: 560,
                }}
              >
                Choose the conversation you need, and we will meet it with the right context.
              </h2>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2 flex items-end">
            <BlurReveal delay={0.14}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(0.98rem, 1.05vw, 1.08rem)",
                  lineHeight: 1.5,
                  color: palette.muted,
                  maxWidth: 620,
                }}
              >
                Frigate conversations usually start in one of three places: seeing the product live, figuring out
                where it fits in an existing stack, or untangling a generation workflow that has become hard to trust.
              </p>
            </BlurReveal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 mt-12 md:mt-16">
          <div className="hidden md:block" />
          {quickLinks.map((item, index) => {
            const Icon = item.icon;

            return (
              <BlurReveal key={item.label} delay={0.16 + index * 0.08}>
                <a
                  href={mailtoLink(item.subject)}
                  className="group block h-full no-underline"
                  style={{
                    border: `1px solid ${palette.softBorder}`,
                    backgroundColor: index === 1 ? "#FBFAF0" : "rgba(255,255,255,0.45)",
                    minHeight: 320,
                    padding: 24,
                  }}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <div
                        style={{
                          ...mono,
                          fontSize: 10,
                          color: palette.muted,
                        }}
                      >
                        {item.label}
                      </div>
                      <Icon size={18} style={{ color: palette.black }} />
                    </div>

                    <div className="mt-auto">
                      <h3
                        style={{
                          margin: "0 0 16px 0",
                          fontFamily: "'TASA Orbiter', Inter, sans-serif",
                          fontWeight: 900,
                          fontSize: "clamp(1.25rem, 1.55vw, 1.7rem)",
                          lineHeight: 0.95,
                          letterSpacing: "-0.045em",
                          textTransform: "uppercase",
                          color: palette.black,
                          maxWidth: 220,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: palette.muted,
                          maxWidth: 280,
                        }}
                      >
                        {item.body}
                      </p>
                      <div
                        className="mt-6 inline-flex items-center gap-2"
                        style={{ ...mono, fontSize: 10, color: palette.black }}
                      >
                        Email this route
                        <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </a>
              </BlurReveal>
            );
          })}
        </div>
      </div>
    </GridFrame>
  );
}

function ContactFormSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    projectType: projectTypes[0],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = [
      `Name: ${form.name || "-"}`,
      `Email: ${form.email || "-"}`,
      `Company: ${form.company || "-"}`,
      `Project type: ${form.projectType}`,
      "",
      "Project context:",
      form.message || "-",
    ].join("\n");

    window.location.href = mailtoLink(`Frigate inquiry: ${form.projectType}`, body);
    setSubmitted(true);
  };

  return (
    <GridFrame background={palette.black} borderColor="rgba(255,255,255,0.07)">
      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(88px, 10vw, 128px) clamp(20px, 3vw, 48px) clamp(100px, 12vw, 150px)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-10">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <BlurReveal>
              <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.45)", marginBottom: 18 }}>[03] START HERE</div>
            </BlurReveal>
            <BlurReveal delay={0.08}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.9rem, 3.4vw, 3.75rem)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.06em",
                  textTransform: "uppercase",
                  color: palette.cream,
                  maxWidth: 620,
                }}
              >
                Give us the shape of the problem. We will take it from there.
              </h2>
            </BlurReveal>
            <BlurReveal delay={0.14}>
              <p
                style={{
                  margin: "22px 0 0 0",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "rgba(244,244,232,0.62)",
                  maxWidth: 470,
                }}
              >
                The strongest first message is not polished. It is specific. Tell us what your team is generating,
                where the black box is hurting decisions, and what you need to trust before rollout.
              </p>
            </BlurReveal>

            <BlurReveal delay={0.2} className="mt-10">
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: 22,
                }}
              >
                <div style={{ ...mono, fontSize: 10, color: palette.lime, marginBottom: 14 }}>[Useful Inputs]</div>
                <div className="space-y-3">
                  {[
                    "What type of outputs are you generating today?",
                    "Where do teams lose confidence or spend too much time iterating?",
                    "What would success look like after the workflow improves?",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-3">
                      <div className="mt-[7px] h-[6px] w-[6px] rounded-full" style={{ backgroundColor: palette.lime }} />
                      <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.5, color: "rgba(244,244,232,0.68)" }}>
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2">
            <BlurReveal delay={0.12}>
              <form
                onSubmit={submitForm}
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  padding: "clamp(20px, 3vw, 30px)",
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.45)", marginBottom: 8 }}>Name</div>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Jane Smith"
                      style={fieldStyle}
                    />
                  </label>

                  <label>
                    <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.45)", marginBottom: 8 }}>Email</div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="jane@company.com"
                      style={fieldStyle}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <label>
                    <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.45)", marginBottom: 8 }}>Company</div>
                    <input
                      value={form.company}
                      onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                      placeholder="Your team or studio"
                      style={fieldStyle}
                    />
                  </label>

                  <div>
                    <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.45)", marginBottom: 8 }}>Project Type</div>
                    <div className="flex flex-wrap gap-2">
                      {projectTypes.map((type) => {
                        const active = form.projectType === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, projectType: type }))}
                            style={{
                              ...mono,
                              fontSize: 9,
                              border: `1px solid ${active ? palette.lime : "rgba(255,255,255,0.12)"}`,
                              backgroundColor: active ? "rgba(209,255,0,0.12)" : "transparent",
                              color: active ? palette.creamBright : "rgba(244,244,232,0.62)",
                              padding: "10px 12px",
                              cursor: "pointer",
                            }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <label className="block mt-4">
                  <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.45)", marginBottom: 8 }}>Project Context</div>
                  <textarea
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Tell us what you are building, where outputs become hard to explain, and what a better workflow should unlock."
                    style={{ ...fieldStyle, minHeight: 180, resize: "vertical" }}
                  />
                </label>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    className="group inline-flex items-center justify-between gap-4"
                    style={{
                      ...mono,
                      backgroundColor: palette.lime,
                      color: palette.black,
                      padding: "16px 18px",
                      border: "none",
                      cursor: "pointer",
                      minWidth: 240,
                    }}
                  >
                    <span>Send Via Email</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.52)", maxWidth: 320 }}>
                    {submitted
                      ? "Your mail app should be opening with the draft prefilled."
                      : "This opens a prefilled email so nothing disappears into a black-box form."}
                  </div>
                </div>
              </form>
            </BlurReveal>
          </div>
        </div>
      </div>
    </GridFrame>
  );
}

function ClosingCTA() {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: palette.lime, padding: "clamp(84px, 12vw, 156px) clamp(20px, 3vw, 48px)" }}
    >
      <GrainLocal opacity={0.04} />

      <div className="relative z-10 mx-auto grid grid-cols-1 md:grid-cols-4" style={{ maxWidth: 1920 }}>
        <div className="col-span-1 md:col-span-3">
          <FadeIn>
            <div style={{ ...mono, fontSize: 10, color: palette.black, opacity: 0.45, marginBottom: 18 }}>[04] NEXT MOVE</div>
          </FadeIn>
          <AnimatedHeadline delay={0.08} className="max-w-[960px]">
            <span
              style={{
                fontFamily: "'TASA Orbiter', Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 5vw, 5.3rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.06em",
                textTransform: "uppercase",
                color: palette.black,
              }}
            >
              Want to show the team first? Start inside the composer, then come back with the rough edges.
            </span>
          </AnimatedHeadline>
        </div>

        <div className="col-span-1 flex items-end mt-10 md:mt-0">
          <FadeIn delay={0.18} className="w-full">
            <button
              type="button"
              onClick={() => navigate("/composer")}
              className="group inline-flex w-full items-center justify-between border-none cursor-pointer"
              style={{
                ...mono,
                backgroundColor: palette.black,
                color: palette.lime,
                padding: "18px 20px",
              }}
            >
              <span>Open Frigate</span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

const fieldStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.03)",
  color: palette.creamBright,
  padding: "14px 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  outline: "none",
};

export function ContactPage() {
  return (
    <>
      <ContactHero />
      <QuickRoutes />
      <ContactFormSection />
      <ClosingCTA />
    </>
  );
}
