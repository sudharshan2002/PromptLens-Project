Build a near-1:1 recreation of the live website at https://kyma.framer.ai/ as a responsive marketing site prototype in Figma Make.

Goal:
Match the reference site as closely as possible in layout, spacing, type hierarchy, section order, color palette, density, interactions, loading behavior, and animation feel. Do not redesign it, simplify it, modernize it, or substitute a generic SaaS style. This should feel like the same site rebuilt inside Figma Make.

Overall style:
Premium Framer-style AI automation agency landing page. Editorial, kinetic, bold, sharp, high-contrast. Bright acid-lime background, near-black text, cream content surfaces, dark charcoal cards, restrained but premium micro-interactions.

Color palette:
- Acid lime background: #D1FF00
- Primary text: #050505
- Cream surface/text background: #F4F4E8
- Dark card surface: #1C1E19
- Secondary gray text: #686868
- Light off-white accent: #FFFFED
- Hairline translucent border: #9C9C9C26

Typography:
- Headings: TASA Orbiter, uppercase, weight 800, tight tracking around -0.03em, line-height around 100%
- Body/UI text: Geist or Inter
- Utility labels, small metadata, numbers, form microcopy: Roboto Mono
- Preserve the same contrast between oversized editorial display type and smaller restrained UI text

Page structure:
Create one long landing page with these sections in this order:
1. Fixed top nav
2. Hero
3. Who we are / manifesto
4. Stats / proof metrics
5. Problem statement section with animated issue chips/tickers
6. ROI calculator
7. Services section
8. Process / timeline section
9. Post-launch support section
10. Featured customer story
11. Testimonials
12. Tech stack
13. Team section
14. Pricing
15. FAQ
16. Contact / audit booking form
17. Newsletter footer form

Navigation:
- Fixed header around 60px high
- Wide centered container, desktop max width around 1920px
- Desktop horizontal padding around 40px, mobile around 20px
- Header should feel like it visually inverts over the page, similar to mix-blend-mode:difference
- Minimal, premium, very clean

Hero:
- Massive uppercase editorial headline
- Supporting paragraph below
- Primary CTA and secondary demo/play CTA
- Trust indicator such as “Trusted by 50+ companies”
- A compact live-demo or visual proof block
- Keep the hero spacious but intense, with oversized typography and crisp alignment

Section styling:
- Include editorial section markers like [01], [02], etc.
- Use repeated uppercase reveal headlines
- Combine full-width sections, rows, card grids, timelines, forms, and stacked mobile layouts
- Keep the content density and pacing close to the reference
- Service cards should feel dark, premium, and high contrast
- Pricing should include one emphasized “popular” plan
- FAQ should be clean accordion rows
- Forms should look polished and real, not placeholder-default

Motion:
Match the motion language of the reference as closely as possible.
- Include an intro/loading screen before the page settles
- Use staggered reveal-on-scroll for headlines, paragraphs, chips, cards, stats, and forms
- Headline reveal should feel letter-by-letter or word-by-word, beginning blurred and low-opacity, then becoming crisp
- Text reveal pre-state: opacity around 0.15 with slight blur
- Text reveal transition feel:
  - color 0.3s linear
  - filter 0.6s ease-out
  - opacity 0.6s ease-out
- Small cards/chips should enter from opacity 0 with slight translateX(-15px), translateY(12px), or scale(0.3)
- Use premium Framer-like easing:
  - large entrances: cubic-bezier(0.16, 1, 0.3, 1)
  - small interactions: ease-out
- Avoid playful bounce
- Motion should feel polished, controlled, premium, and cinematic

Loading screen:
- Full-screen branded loading state
- Acid-lime background
- Minimal black brand text/mark
- Fade/scale into the main page
- Intro rhythm should feel cinematic, around 1 to 1.5 seconds total

Micro-interactions:
- Button hover: subtle lift, fast state change, premium easing
- Card hover: slight translation and opacity refinement
- FAQ hover/open: smooth height and opacity transition
- Form focus: subtle border shift and premium focus styling
- Testimonials and story cards: staggered entrance with offset timing
- Do not over-animate; keep everything refined

Shapes and details:
- Corners should feel like soft superellipse or tight rounded corners around 4px
- Use dark pill chips with cream text where appropriate
- Keep shadows subtle
- Rely on contrast, layout, borders, and motion more than large shadows
- Preserve the clean Framer aesthetic and exact premium feel of the reference

Responsive:
- Create desktop, tablet, and mobile versions
- Preserve hierarchy and section order
- Reduce headline size on mobile but keep the same uppercase editorial tone
- Maintain fixed-header feel
- Keep the dense premium look even when stacked

Critical instruction:
This must feel like the same Kyma site rebuilt inside Figma Make, not a new design inspired by it.
Do not change the palette.
Do not replace the typography style with generic fonts.
Do not round everything heavily.
Do not simplify the section structure.
Do not reduce the motion system.
Prioritize fidelity to the reference site over originality.
