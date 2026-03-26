Refine this build to match the Kyma reference much more precisely at the small-detail level. Keep the current structure, but correct spacing, component sizing, section rhythm, and all motion behavior so it feels nearly identical to kyma.framer.ai.

Layout corrections:
- Use a wide desktop container with max width around 1920px and horizontal padding around 40px
- Keep the fixed header at about 60px tall
- Make section spacing feel editorial and premium, with large vertical breathing room but tight internal alignment
- Headings should be large, uppercase, and tightly tracked, with short supporting paragraphs beneath
- Keep strong left alignment in most content sections
- Use a clean grid with consistent gutters; avoid generic centered SaaS blocks
- Cards should have tight 4px superellipse-like corners, not large rounded corners
- Service cards, testimonial cards, pricing cards, and feature blocks should feel compact, sharp, and premium
- Forms should be aligned cleanly with consistent label spacing, not loose default spacing
- Keep the page tall and content-rich; do not compress sections

Header behavior:
- Header must stay fixed while scrolling
- Give it a visual “difference blend” feel over the lime background so text remains crisp and premium
- Nav interactions should feel minimal and quick, with subtle opacity and position changes on hover
- Keep the header understated, not heavy

Hero corrections:
- Increase the hero headline scale so it feels dominant and editorial
- Use TASA Orbiter style uppercase display text with very tight tracking
- Keep supporting copy narrower and calmer underneath
- Primary CTA should feel bold and compact
- Secondary CTA should feel like a demo/play interaction with micro-motion
- Preserve trust indicators and visual proof near the hero
- Make the hero entrance feel staged, not everything appearing at once

Animation system:
Use a consistent premium Framer-like motion system across the page.

Main easing:
- Large section entrances: cubic-bezier(0.16, 1, 0.3, 1)
- Small UI interactions: ease-out
- Hover transitions: 180ms to 240ms
- Scroll reveals: 500ms to 700ms
- Loader transition: about 1000ms to 1500ms total

Text reveal behavior:
- Large headings should reveal word-by-word or letter-by-letter
- Initial state: opacity 0.15, slight blur, subtle translateY
- Final state: opacity 1, blur 0, translateY 0
- Use:
  - color 0.3s linear
  - filter 0.6s ease-out
  - opacity 0.6s ease-out
- Do not use bouncy text
- Headline reveals should feel cinematic and intentional

Card reveal behavior:
- Cards enter from opacity 0
- Use translateY 12px to 20px or translateX -15px depending on section
- Some small chips and pills should scale from 0.3 to 1
- Stagger cards by 40ms to 80ms
- Final motion should feel crisp and confident, not floaty

Specific section animation notes:
- Hero: staged reveal sequence: header visible, then headline, then body copy, then buttons, then trust row
- Metrics/stat counters: fade/slide up with subtle stagger; numbers should feel prominent
- Problem chips/ticker rows: slide in horizontally with stagger, each chip revealing from low opacity and slight x-offset
- ROI calculator: inputs and result panels should reveal in sequence; calculator should feel interactive and polished
- Services cards: stagger in row-by-row; each card should have slight hover lift and subtle contrast shift
- Process timeline: each timeline step reveals progressively on scroll, with a crisp line/connector feel
- Post-launch support blocks: fade and move upward with tight stagger
- Featured case study: image and text should offset slightly in timing, not appear together
- Testimonials: cards should reveal one after another with soft upward motion
- Team cards: reveal with subtle upward motion and image-first emphasis
- Pricing cards: stagger in with one featured card slightly more visually dominant
- FAQ rows: accordion open/close should animate height and opacity smoothly, not snap
- Audit/contact form: reveal the text area, fields, and CTA in staged sequence
- Newsletter form: compact fade-up reveal

Hover behavior:
- Buttons: slight upward move 1px to 2px, fast background/contrast change, no oversized glow
- Cards: subtle translateY -2px and tiny shadow/contrast increase
- FAQ rows: soft background or border emphasis on hover
- Team/testimonial cards: slight image scale or content lift, very restrained
- Links: fast opacity or underline shift, minimal but premium

Visual detail corrections:
- Keep the acid lime background dominant
- Use black text with cream and dark charcoal support surfaces
- Avoid extra gradients unless they are extremely subtle
- Keep borders thin and clean
- Use mono utility text for dates, labels, and little UI tags
- Maintain a sharp editorial rhythm between giant headlines and small interface labels
- Avoid generic SaaS iconography, giant shadows, or over-rounded components

Loading screen:
- Add a full-screen intro/loading overlay
- Acid lime background with black brand mark/text
- Simple fade/scale transition into the page
- Loader should feel premium and minimal, not flashy
- After loading, the hero should settle in with a staggered sequence

Responsive corrections:
- On tablet and mobile, preserve the same hierarchy and motion logic
- Reduce headline sizes but keep the uppercase editorial personality
- Keep spacing tight and premium, not airy and generic
- Stack cards cleanly while preserving density
- Preserve the fixed header and staged reveal behavior on smaller screens

Important:
Push this much closer to exact Kyma fidelity. Correct the micro-spacing, reveal timing, card proportions, typography scale, and motion choreography. Remove any generic website feel. This should feel like the same site rebuilt, especially in its small layout details and animation polish.
