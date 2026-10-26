/* System-design playbook page */

window.DESIGN_PLAYBOOK = {
  title: "System design, without the theatre",
  intro: [
    "Applied system design is requirements, arithmetic, topology, quality, failure, release, handover — in that order. The interviewer is not checking whether you can name Kafka; they are checking whether the design survives a customer, a bill and an incident.",
    "Use the same eight steps every time so that under pressure you do not have to invent structure. Two designs from Day 6 are worked in full; the three below are compact briefs to practise against."
  ],
  framework: [
    { n: "01", t: "Restate the job", d: "Who uses it, what decision improves, what failure costs. One sentence each. If you cannot state the failure cost, you cannot choose the right safety posture." },
    { n: "02", t: "Requirements and constraints", d: "Volume, concurrency, latency budget, languages, residency, accuracy floor, budget ceiling, existing stack, timeline, who runs it after you leave." },
    { n: "03", t: "Workload arithmetic", d: "Requests/day → peak QPS → tokens per request → cost per request → capacity. Do it before drawing. Most designs are decided here: if the volume is tiny, residency and auditability are the real constraints." },
    { n: "04", t: "Topology and data boundary", d: "Where inference runs (global / EU / US regional, VPC, on-prem), where data lives, what crosses the boundary, what state the platform holds vs what you hold." },
    { n: "05", t: "Quality architecture", d: "Ingestion, chunking, retrieval, reranking, model choice, structured output, citations, refusal policy, and the one number that says it works." },
    { n: "06", t: "Failure and safety", d: "Timeouts, bounded retries with backoff, fallbacks, idempotency, human-in-the-loop, moderation and guardrails, injection handling, audit trail, kill switch." },
    { n: "07", t: "Evaluation and release", d: "Golden set, judge, gate, canary, pinned model and prompt versions, rollback in one line, and who signs off." },
    { n: "08", t: "Operations and handover", d: "Monitoring, cost alerts, on-call, runbook, training, and an explicit statement of what the customer owns after handover." }
  ],
  toolkit: [
    { k: "Cost per request", v: "(input tokens × input price + output tokens × output price) / 1e6, then add retry overhead and the amortised eval cost." },
    { k: "Peak QPS", v: "requests/day ÷ 86,400 × peak factor. A 10× factor is normal for business-hours products; measure if you can." },
    { k: "KV cache per token", v: "2 × layers × kv_heads × head_dim × bytes_per_element. 32 layers, 8 KV heads, dim 128, fp16 → 128 KiB." },
    { k: "Concurrency per GPU", v: "(VRAM − weights − overhead) ÷ (cache per token × sequence length). Then sanity-check against measured tokens/sec." },
    { k: "MoE footprint", v: "Total parameters × bytes per parameter. 675B at bf16 ≈ 1.35 TB; fp8 ≈ 675 GB; 4-bit ≈ 350–400 GB. Active parameters govern FLOPs, not memory." },
    { k: "OCR volume", v: "pages × price per 1,000 pages. At ~4 USD/1,000 pages, 4.8M pages ≈ 19k USD one-off — a line item worth saying out loud." },
    { k: "Ingestion time", v: "documents ÷ (workers × documents per minute per worker), and remember batch jobs complete over a window rather than instantly." }
  ],
  cases: [
    {
      title: "An LLM gateway for 20 product teams",
      prompt: "Design the internal gateway every team at a 400-person company uses to call models. Nobody may call the provider directly.",
      plan: [
        "Job: make model access safe, cheap and observable. Failure: an outage takes down every product at once, or a team's runaway loop consumes the quarter's budget.",
        "Requirements: ~40M requests/day across teams, mixed latency needs, per-team quotas, PII rules, no vendor keys in product code, p99 overhead under 30 ms at the gateway.",
        "Arithmetic: 40M/day ≈ 460 QPS average, ~2,000 peak. Gateway overhead must be I/O-bound; run it stateless behind a load balancer with connection pooling.",
        "Topology: gateway → provider APIs (regional endpoints where a team has residency needs), plus optional self-hosted inference for bulk. Keys in a secrets manager, never in request logs.",
        "Quality: model allowlist per use case, prompt registry with versions, structured output enforcement, and a shared eval runner teams can call in CI.",
        "Failure: per-team circuit breakers, fallback model per use case, deadline propagation, and a hard spend cap that degrades rather than blocks silently.",
        "Release: versioned routing policy, canary per team cohort, and a change log because routing changes are model changes.",
        "Ops: cost attribution per team on a dashboard, quota alerts, and an SLO on gateway availability separate from provider availability."
      ],
      trap: "Designing it as a proxy only. The value is policy, cost attribution and evaluation, not forwarding bytes."
    },
    {
      title: "5 million pages of OCR, continuously",
      prompt: "A logistics company scans 5M pages a year of invoices and customs forms. Extract structured fields with high accuracy and a human review path.",
      plan: [
        "Job: turn scans into structured records; failure is a wrong customs value, so auditability matters as much as accuracy.",
        "Requirements: ~14k pages/day, 30+ document layouts, field-level confidence, review queue, 99% of pages processed within an hour, EU processing.",
        "Arithmetic: 14k pages/day at ~4 USD per 1,000 pages is roughly 56 USD/day at list price — cheap relative to the labour it replaces; the real cost is the review queue.",
        "Topology: object storage → OCR batch jobs (half price, asynchronous) → schema-anchored annotations → validation → records database; regional endpoint for anything interactive.",
        "Quality: per-layout field accuracy measured against 200 hand-labelled pages per layout; confidence thresholds route low-confidence fields to humans rather than guessing.",
        "Failure: idempotency by document hash, partial-batch recovery, dead-letter queue for unparseable documents, and a re-run path that does not duplicate records.",
        "Release: new layout → labelled sample → accuracy gate per field → shadow run on a day of traffic before promotion.",
        "Ops: daily accuracy sample, queue depth and review latency dashboards, and a documented process for the review team."
      ],
      trap: "Optimising the model before the layout taxonomy and the review queue exist. Parsing and routing are the system."
    },
    {
      title: "A voice agent that books appointments",
      prompt: "Design a phone agent for a clinic network: answers, triages urgency, books or reschedules, and hands off to a human when unsure.",
      plan: [
        "Job: reduce reception load without ever giving clinical advice. Failure: a missed urgent case or a double-booked slot.",
        "Requirements: ~3,000 calls/day, p95 response latency under 800 ms, French and English, telephony integration, full transcript retention per policy.",
        "Arithmetic: 3,000 calls × 4 minutes ≈ 200 concurrent calls at peak; streaming speech-to-text plus TTS dominates latency, not the LLM.",
        "Topology: telephony → realtime speech-to-text → dialogue orchestrator → booking API; text-to-speech streaming back. Keep the LLM out of the audio path where possible.",
        "Quality: constrained dialogue states, tool calls only to the booking API, explicit urgency rubric with a hard rule set, and no free-form medical answers.",
        "Failure: barge-in handling, timeouts that fall back to a human, confirmation of every booking read back to the caller, and a strict tool allowlist.",
        "Release: scripted scenario suite (including angry caller, background noise, accent variation) as the gate; canary by clinic.",
        "Ops: transcript review sampling, escalation-rate monitoring, and a weekly listen-back session with the clinic staff."
      ],
      trap: "Letting the model improvise clinical triage. Encode the rubric, cap the authority, and escalate."
    }
  ],
  redFlags: [
    "Proposing fine-tuning before an evaluation set exists.",
    "A multi-agent swarm for a retrieval problem.",
    "Designing an agent loop for a process that needs durable, resumable execution.",
    "Quoting a benchmark instead of a cost or latency number.",
    "Ignoring handover — the customer's team has to run it.",
    "No refusal policy: a system that always answers is a system you cannot trust.",
    "Treating regional inference as full data residency (the control plane is still global)."
  ],
  rubric: [
    "Requirements stated with numbers before any architecture",
    "At least three pieces of arithmetic (cost, latency, capacity, volume)",
    "Data boundary named explicitly (where inference runs, what crosses it)",
    "Quality plan with a measurable acceptance criterion",
    "Failure modes and human-in-the-loop designed, not hand-waved",
    "Release gate and rollback named",
    "Handover and operations described",
    "One explicit trade-off defended against an alternative"
  ]
};
