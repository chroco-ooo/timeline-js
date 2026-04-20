# Timeline Generator

A lightweight, zero-dependency JavaScript library for visualizing projects on a timeline with relationship arrows between them.

## Core Purpose

- Render projects as horizontal bars on a time-based grid
- Draw bezier curve arrows between related projects (links)
- Support multiple time scales: `hour`, `day`, `month` (default), `quarter`, `year`

## Key Features

- Auto-placement of project nodes on configurable lanes
- SVG-based connection lines with color-coded groups (connected components)
- "Today" indicator marker
- Virtual scrolling for large timelines (>180 columns by default)
- Click modes: event callback (`"event"`) or anchor link (`"link"`)
- Optional background image icons per project node
- Japanese UI labels (month/hour display uses Japanese suffixes)

## Target Usage

Embedded directly in HTML pages via `<script>` and `<link>` tags — no build step required for consumers.
