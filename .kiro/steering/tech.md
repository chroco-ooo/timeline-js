# Tech Stack

## Core Technologies

- **Vanilla JavaScript (ES6+)** — single class `TimelineGenerator` in `timeline.js`, no frameworks or bundlers
- **Plain CSS** — `css/timeline.css` (README mentions SCSS as an optional source, but the distributed file is compiled CSS)
- **SVG** — used for drawing bezier connection lines between projects
- **HTML5** — `index.html` serves as both the demo page and integration example

## Dependencies

None. Zero external libraries or package managers.

## No Build System

There is no `package.json`, bundler, or compilation step. Files are used directly in the browser.

If editing styles from SCSS source (if maintained separately), compile to `css/timeline.css` before use:

```bash
sass timeline.scss css/timeline.css
```

## Common Commands

No build/test/lint commands are defined. Open `index.html` directly in a browser to run the demo.
