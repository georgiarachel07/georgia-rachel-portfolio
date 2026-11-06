# Georgia Rachel — Portfolio

AI Systems & Infrastructure Engineer. Personal portfolio featuring production projects, homelab infrastructure, career history, credentials, and an interactive procedural koi pond.

## Website

Static HTML, CSS, and JavaScript. No build or dependency installation is required. GitHub Pages serves the repository root from the `main` branch.

## Editing

- `index.html`: content and layout
- `style.css`, `immersive.css`: presentation and responsive design
- `app.js`: portfolio interactions, calendar
- `effects.js`: scroll effects and motion preference
- `koi.js`: original articulated koi animation and quick startup intro
- `assets/`: portfolio images and saved public GitHub history

The floating page-wide koi is removed. The pond intro is brief and skippable. Reduced-motion preferences are supported. Public GitHub activity uses a live API with a dated local fallback.

See [CREDITS.md](CREDITS.md) for animation inspiration. No Nagomi source or assets are included.

## Toolkit and testimonials

Twenty-five inline Devicon technology logos accompany eleven user-supplied testimonials. Surnames are masked, companies omitted except AMA University, and professional roles retained. The cards flow right-to-left over a koi backdrop with accessible pause and reduced-motion controls.
Toolkit: 10 languages/web technologies and 15 tools/platforms, displayed in two seamless horizontal rows. Pause on hover/focus, manual pause, offscreen sleep and shared motion preference are supported.

## The Quiet Catch

Section 07 replaces Cyber Gun Defense with an original koi fishing game. Cast, wait for a bite, hook, then hold to lift the green fishing bar and release to lower it. Keep the fish inside the bar to land a catch. Five koi varieties can be caught and released; four cleanup types (bug, virus, discarded can, tangled cable) are tossed into the bin by the fisherman. Gentle mode widens the bar and slows fish movement. Keyboard: Enter to cast/hook, Space to reel, arrows to aim, Escape to pause. Mouse/touch use the action button or pond. Counts and discovered varieties save locally only after release/disposal completes. Progress and game phase pause offscreen, in hidden tabs, or when the immersive pond opens. Global motion preference freezes ambient pond motion; active gameplay remains available. Sources: fishing.js, fishing.css, koi.js. No external game runtime or assets.

Fishing animation refinement: the three nearest koi follow the cast lure. A selected hooked fish darts/shakes around it while the bobber splashes. The fisherman leans, bends the rod under tension, and turns the reel crank. Landing a catch transitions to a standing front-facing victory pose with the item held overhead, ITEM ACQUIRED text, and a short paper/gold particle burst (omitted with ambient motion disabled). Phase and pause events keep the pond and game aligned. No additional assets or dependencies.
