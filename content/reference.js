/* Home, positioning, sources */

window.HOME = {
  eyebrow: "Seven days · Applied AI Engineer · Mistral AI",
  title: "A week that ends with you sounding like someone who has shipped this.",
  lede: "Twenty-seven focused hours across seven days: the platform and its economics, structured output and agents, RAG and document AI, evaluation, model internals, system design, and a full timed mock loop. Every lab is runnable. Every number is dated.",
  stats: [
    { v: "7", k: "days, ~27 h" },
    { v: "5", k: "runnable labs" },
    { v: "38", k: "rehearsed answers" },
    { v: "8", k: "design framework steps" }
  ],
  how: [
    { t: "One idea per block", d: "Each day is three to five blocks with a single outcome. If you only get one block done, do the lab — reading without building is how people fail the pair-programming round." },
    { t: "Numbers or it did not happen", d: "Every concept ends with what the interviewer actually probes. Answer in tokens, euros, milliseconds and pass rates, not adjectives." },
    { t: "Your progress is local", d: "Tick boxes and rehearsed answers are stored in this browser only. No account, no tracking, no server. Set your start date and the day labels follow." }
  ],
  paths: [
    { k: "Interview in 3 days", t: "Compress like this", d: "Day 0, then 3 (RAG), 4 (evaluation), 6 (design). Skip Day 5's internals unless the loop includes an LLM deep-dive; skim the cheat sheet instead." },
    { k: "Interview in 2 weeks", t: "Add depth", d: "Do the sprint, then repeat Day 3 and Day 5 with a second corpus and a second model. Re-record the Day 7 mocks a week later." },
    { k: "Already strong on LLMs", t: "Go where the signal is", d: "Day 1, Day 4 and Day 7. Most strong ML candidates lose applied loops on cost arithmetic, evaluation design and customer framing, not on attention maths." }
  ]
};

window.POSITIONING = {
  title: "Positioning: turning your history into their signal",
  intro: [
    "The Applied AI interview is not a knowledge quiz with a personality round attached. It is a judgement interview: they are deciding whether you can be put in front of a customer next month. Your job is to make your background legible in their vocabulary — constraints, measurement, delivery, handover.",
    "This page is a workshop. Fill it in with your own material; the examples are deliberately generic."
  ],
  bridge: {
    head: ["If your background is…", "The signal it proves", "Say it like this"],
    rows: [
      ["Industrial or operations optimisation", "You design under hard constraints and you know a feasible solution beats an elegant one", "“The hard part was never the objective, it was the constraints and proving the result was stable — same as designing a retrieval system that has to be right on the cases that matter.”"],
      ["Data platforms, warehouses, Databricks/Spark", "You can own ingestion, lineage and cost at scale — which is most of a RAG project", "“I have run the pipeline side of this: ingestion, incremental loads, lineage, cost. The model is the small part of the system.”"],
      ["MLOps or model deployment", "You know evaluation, versioning, rollback and drift are the product", "“I treat a prompt change as a model change: pinned versions, an eval gate, a canary, a one-line rollback.”"],
      ["Analytics or consulting", "You can scope an ambiguous ask and say no with evidence", "“I turned an open-ended ask into a backlog with expected value, and killed two of the five use cases in week one.”"],
      ["Research or academic ML", "Depth, but you must show production scars", "“My instinct is to measure — here is the eval set I built and the failure I only found because of it.”"],
      ["Backend or full-stack engineering", "You can ship the service around the model, which is half the job", "“The model call is ten lines; the other nine hundred are auth, retries, idempotency and the audit trail.”"]
    ]
  },
  stories: [
    {
      title: "Story 1 — the systems story",
      prompt: "A system where the constraint, not the algorithm, was the hard part. What you measured, what you traded, what it cost.",
      example: "“A planning service with a hard solve-time budget. I precomputed candidate pools and warm-started the solver, which cut p95 solve time by a measured margin while holding quality on a fixed benchmark. The trade-off was staleness: candidates refreshed nightly, so I added a guard that flagged when the input drifted outside the pool.”",
      check: "Contains: constraint, decision, number, trade-off, guard."
    },
    {
      title: "Story 2 — the quality story",
      prompt: "A time you proved something got better, or caught a regression nobody else saw.",
      example: "“A classifier that looked fine on aggregate but failed on one document class. I built a stratified set, found the failure was a parsing issue rather than a model issue, and added a gate on the hard stratum. The aggregate moved two points; the hard stratum moved nineteen.”",
      check: "Contains: the metric, the stratum, the root cause, the gate you left behind."
    },
    {
      title: "Story 3 — the customer story",
      prompt: "A time you changed the design because of what a user actually did, or said no to a request with evidence.",
      example: "“The customer asked for fine-tuning. I asked for two weeks and fifty labelled questions instead; retrieval alone took accuracy past their bar, and the fine-tuning budget went into the review queue that made the remaining failures visible.”",
      check: "Contains: the request, the evidence, the alternative, the outcome."
    }
  ],
  answers: [
    {
      q: "Why Mistral, rather than a larger US lab?",
      a: "Because the product and the weights ship together, and because the European footprint is a real advantage rather than a slogan: customers with residency obligations can be served properly — regional endpoints today, on-prem or VPC deployments when the contract demands it. Add the structural point: teams are small, so an applied engineer owns scoping, delivery and handover rather than a slice of one."
    },
    {
      q: "Why open weights?",
      a: "Sovereignty, cost control, customisation, and no lock-in — with the honest trade-off that you inherit operations and evaluation. Say which customer type needs which: regulated and public-sector customers need the data boundary; high-volume customers need the economics; both need the ability to pin a model and keep it running."
    },
    {
      q: "What would you do in your first 90 days?",
      a: "Ride along on three deliveries, read the eval sets and the failure logs, and build one thing end to end. Then pick the repeated manual step across engagements and turn it into a reusable component with a test — that is how an applied engineer multiplies a small team."
    },
    {
      q: "What are you weak at?",
      a: "Name a real gap and the mechanism you used: “I had not shipped React beyond prototypes, so I built the delivery UI for the last project myself and had a frontend engineer review it weekly.” Do not name a strength disguised as a weakness."
    }
  ],
  gaps: [
    "No shipped frontend? Say what you did build and how you would scope the UI for a delivery: one screen, one job, no design system.",
    "No fine-tuning at scale? Say what you know conceptually and how you would decide — and that you would measure before spending.",
    "No customer-facing experience? Use an internal stakeholder story; the skills transfer, and the vocabulary is the same.",
    "No GPU operations? Say you would start hosted, and describe exactly what you would measure before recommending self-hosting."
  ],
  script: [
    "<strong>Opening (15 s).</strong> “I build systems where the constraint is the hard part — most recently [domain], where [number] improved under [constraint].”",
    "<strong>Evidence (45 s).</strong> One systems story with three numbers, told as decision → trade-off → result.",
    "<strong>Relevance (20 s).</strong> “The Applied AI role is that job with a customer attached: scope it, ship it, prove it works, hand it over.”",
    "<strong>Invitation (10 s).</strong> “Happy to go deep on either the evaluation side or the deployment side — whichever is more useful.”"
  ]
};

window.SOURCES = {
  title: "Sources, and what this site does not know",
  intro: [
    "Everything factual here traces to one of the links below: Mistral's own documentation and job postings, their open repositories, or publicly shared candidate reports. The question bank is synthesised from those public materials — it is not leaked, and no claim here comes from a private interview debrief.",
    "Two honest limits. First, interview processes vary by team, seniority and quarter; treat the loop description as a map, not a contract. Second, the product surface moves monthly: model ids, prices and deprecations in this site are dated October 2026 and should be re-checked before you quote them."
  ],
  groups: [
    {
      title: "Role and process",
      links: [
        { t: "Mistral job board (Ashby)", u: "https://jobs.ashbyhq.com/mistral.ai", d: "The authoritative role descriptions. Read the Applied AI and Forward Deployed postings and note the must-haves you cannot yet evidence." },
        { t: "Mistral careers", u: "https://mistral.ai/careers/", d: "Official process skeleton: intro conversations, technical exercises, values conversation, references." },
        { t: "Public interview-question compilation (unofficial)", u: "https://github.com/ombharatiya/AI-Engineer-Interview-Questions/blob/main/14-company-interview-questions/mistral.md", d: "A careful public compilation with sourced candidate reports. Useful for the shape of the technical rounds; not authoritative." },
        { t: "Glassdoor — Mistral AI interviews", u: "https://www.glassdoor.com/Interview/Mistral-AI-Interview-Questions-E9945031.htm", d: "Aggregated candidate reports. Read for round structure and tone, discount for recency and selection bias." }
      ]
    },
    {
      title: "Documentation you will actually use",
      links: [
        { t: "Studio documentation map", u: "https://docs.mistral.ai/studio", d: "Conversations, Agents, Connectors, Workflows, Search, Audio, Document AI, Batch, Observability, Moderation." },
        { t: "Chat completions", u: "https://docs.mistral.ai/studio/conversations/chat-completion", d: "Message roles, prefix, safe_prompt, multi-turn, content chunks." },
        { t: "Structured outputs", u: "https://docs.mistral.ai/studio/conversations/structured-output", d: "Custom schemas versus JSON mode, and what each guarantees." },
        { t: "Agents and Conversations", u: "https://docs.mistral.ai/studio/agents/agents-api", d: "Agent and conversation objects, tool types, handoffs, storage opt-out." },
        { t: "Libraries", u: "https://docs.mistral.ai/studio/search/libraries", d: "Managed RAG: create, upload, poll status, attach to an agent, read citations." },
        { t: "Search Toolkit", u: "https://docs.mistral.ai/studio/search/search-toolkit", d: "Bring-your-own-index ingestion and retrieval, rerankers, semantic cache, Vespa/Qdrant/Postgres." },
        { t: "OCR processor", u: "https://docs.mistral.ai/studio/document-processing/basic_ocr", d: "Blocks, table formats, header/footer, confidence granularity, output schema." },
        { t: "Document annotations", u: "https://docs.mistral.ai/studio/document-processing/annotations", d: "Schema-driven structured extraction inside the OCR call." },
        { t: "Batch processing", u: "https://docs.mistral.ai/studio/batch-processing", d: "JSONL format, endpoints supported, inline batching, output/error files." },
        { t: "Observability", u: "https://docs.mistral.ai/studio/observability", d: "Traces, datasets, evaluations, judges, plus the offline evaluation SDK for enterprise tiers." },
        { t: "Workflows", u: "https://docs.mistral.ai/studio/workflows/getting-started/overview", d: "Durable execution, activities, hybrid mode, payload offloading, encryption." },
        { t: "Moderation and guardrails", u: "https://docs.mistral.ai/studio/safety-moderation", d: "Categories, thresholds, inline guardrails, override behaviour, error shape." },
        { t: "Regional inference", u: "https://docs.mistral.ai/inference/regional-inference", d: "EU and US endpoints, what is not supported, and the 1.1× upcharge." },
        { t: "Priority tier", u: "https://docs.mistral.ai/inference/priority-tier", d: "Priority queueing, SLA, the 1.75× multiplier, cache interaction." },
        { t: "Model lifecycle", u: "https://docs.mistral.ai/inference/model-lifecycle", d: "Deprecation and retirement policy — the reason to pin dated model ids." },
        { t: "Model list and selection guide", u: "https://docs.mistral.ai/models", d: "Current lineup, capabilities, context windows, licences, prices." }
      ]
    },
    {
      title: "Repositories worth reading, not cloning",
      links: [
        { t: "mistralai/cookbook", u: "https://github.com/mistralai/cookbook", d: "Runnable notebooks for RAG, evaluation, OCR, agents, batch. Start with mistral/rag/basic_RAG.ipynb and mistral/evaluation/RAG_evaluation.ipynb." },
        { t: "mistralai/mistral-inference", u: "https://github.com/mistralai/mistral-inference", d: "Reference implementation for running open-weight models; read the model configs to practise KV-cache arithmetic on real numbers." },
        { t: "mistralai/mistral-common", u: "https://github.com/mistralai/mistral-common", d: "Tokenisers and message pre-processing. The fastest way to understand why token counting is not char/4." },
        { t: "mistralai/client-python", u: "https://github.com/mistralai/client-python", d: "The SDK you will use in the pair-programming round. Skim the error types and retry configuration." },
        { t: "mistralai/mistral-vibe", u: "https://github.com/mistralai/mistral-vibe", d: "Mistral's own CLI coding agent — useful context for how they think about agent loops and permissions." },
        { t: "mistralai/timestral", u: "https://github.com/mistralai/timestral", d: "Time-series foundation model. Relevant if your background is industrial or operational data — a genuine conversation opener." }
      ]
    },
    {
      title: "Papers and announcements",
      links: [
        { t: "Mistral 7B (arXiv 2310.06825)", u: "https://arxiv.org/abs/2310.06825", d: "GQA and sliding-window attention, from the source. Short and readable." },
        { t: "Mixtral of Experts (arXiv 2401.04088)", u: "https://arxiv.org/abs/2401.04088", d: "Sparse MoE routing, load balancing, and the active-versus-total parameter story." },
        { t: "Introducing Mistral 3", u: "https://mistral.ai/news/mistral-3", d: "The open-weight generation behind current Large and Ministral models, with parameter counts." },
        { t: "Pricing", u: "https://mistral.ai/pricing", d: "Check the week of your interview; quote the date when you use a number." }
      ]
    }
  ],
  unknowns: [
    "Exact interview content per team and level — not public, and this site does not pretend to know it.",
    "Current compensation bands — ask the recruiter; any number published elsewhere is likely stale.",
    "Whether a given region serves a given model today — check the model page, since availability varies by region and tier.",
    "Whether fine-tuning is generally available for your account — the API spec still lists the endpoints while the SDK and guides no longer lead with them."
  ]
};
