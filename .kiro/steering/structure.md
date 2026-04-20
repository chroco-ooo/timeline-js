# Project Structure

```
/
├── index.html        # Demo page and integration example
├── timeline.js       # Core library — single class TimelineGenerator
├── css/
│   └── timeline.css  # All styles for the timeline component
├── thumbnail.png     # Demo screenshot used in README
└── README.md         # Usage documentation (Japanese)
```

## Key Conventions

- All library logic lives in `timeline.js` as a single `TimelineGenerator` class
- CSS is scoped under `#timeline-container` to avoid global style leakage
- The HTML container requires three child divs with specific IDs: `timeline-years`, `timeline-months`, `timeline-grid`
- Project boxes are rendered as `<div>` or `<a>` elements positioned absolutely inside the CSS grid
- SVG for connection lines is appended as a child of `#timeline-grid` with `id="timeline-svg"`
- The "Today" marker is appended directly to `#timeline-container`

## Adding Features

- New rendering logic goes in `timeline.js` as methods on `TimelineGenerator`
- New styles go in `css/timeline.css`, scoped under `#timeline-container` where possible
- `index.html` is updated to demonstrate new options
