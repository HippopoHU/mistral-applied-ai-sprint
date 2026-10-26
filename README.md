# Mistral Sprint — Applied AI Engineer

A self-contained, offline-capable seven-day preparation site for the Mistral AI Applied AI Engineer interview.

## Run locally

```bash
python3 -m http.server 4399
open http://127.0.0.1:4399/
```

No build step or external runtime dependency is required. The site stores checklist and rehearsal progress in browser `localStorage` only. It does not collect API keys, interview data, or analytics.

## What is included

- Seven-day plan (~27 focused hours), with timed blocks and runnable Python labs.
- Five build labs: SDK smoke test and cost router; structured extraction and tool loop; OCR → hybrid RAG → citations; evaluation gate; GQA and KV-cache arithmetic.
- 38 expandable technical and behavioural questions, filterable by topic and searchable.
- System-design framework, worked cases, cost/capacity maths, and a positioning workshop.
- One-page model/tier/SDK/serving reference.
- Theme toggle, day timer, checklist persistence, answer-rehearsal persistence, print-friendly day views.

## Sources and scope

The content is synthesised from public Mistral documentation, public job descriptions, Mistral's open GitHub repositories, and publicly shared candidate reports. It is not affiliated with Mistral AI and does not contain leaked interview material. Product names, model aliases, availability and prices move; the site marks October 2026 as its research snapshot and links back to primary sources for re-checking.

## GitHub Pages

The `gh-pages.yml` workflow publishes the root of `main` as a static site when GitHub Pages is configured to use **GitHub Actions**. The site is intentionally dependency-free so the Pages artifact is just the repository.
