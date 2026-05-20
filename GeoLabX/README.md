# GeoLabX

**Virtual Geotechnical Laboratory for Civil Engineering Students**

An interactive web application for undergraduate civil engineering students to learn soil mechanics and geotechnical engineering through virtual laboratory modules.

## Modules

- **Triaxial Test Simulator** — UU, CU, CD tests with stress–strain graphs, Mohr circles, and shear strength parameters
- **Mohr Circle Tool** — Interactive Mohr circle with total and effective stress modes
- **Unconfined Compression Test** — Stress–strain analysis with qᵤ and sᵤ calculation
- **Soil Classification** — USCS classification with plasticity chart

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- Interactive data input and real-time graph updates
- Export data as CSV and PDF laboratory reports
- Dark mode support
- Example datasets included
- Local storage save
- Responsive design for desktop, tablet, and mobile

## Tech Stack

- React + Vite
- Tailwind CSS
- Chart.js
- jsPDF
- PapaParse

## Engineering Standards

- SI units only
- British Standard formatting
- Engineering notation (σ₁, σ₃, τ, φ, c)

## License

MIT
