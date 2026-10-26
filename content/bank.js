/* Question bank — 38 rehearsable answers. Synthesised from public job descriptions,
   Mistral documentation, and publicly reported candidate experiences. Not leaked material. */

window.QUESTION_BANK = [
  {
    id: "q1", cat: "Role", q: "What does an Applied AI Engineer at Mistral actually do, and how is it different from a research engineer?",
    a: [
      "<p>It is a customer-facing engineering role, not a research role. You sit in pre-sales conversations to scope what is feasible, then own delivery: the retrieval layer, the prompt and evaluation harness, the thin full-stack service around it, the deployment topology, and the handover. Research engineers train and improve the models; you make them work inside someone else's constraints.</p>",
      "<p>The four things you are judged on are build quality, quality diagnosis (can you prove a system got better), cost and latency reasoning, and communication with non-ML stakeholders. In practice a week might be a bank's document assistant on Monday, an agent workflow for a retailer on Wednesday, and feeding field failures back to the product and science teams on Friday.</p>"
    ],
    follow: "Expect a follow-up on how you handle a customer who wants a capability the models cannot deliver yet."
  },
  {
    id: "q2", cat: "Strategy", q: "Why do open weights matter to customers, and what is the trade-off?",
    a: [
      "<p>Four things: sovereignty (the model runs where the data is, including air-gapped), cost control (no per-token margin at scale, and you can right-size hardware), customisation (fine-tune, distil, quantise, or modify for a domain), and no lock-in (a checkpoint you can keep running if a vendor changes terms).</p>",
      "<p>The honest trade-off is that you inherit operations: GPU capacity planning, serving stack, upgrades, evaluation on every model change, and the on-call. That is why the same deal often starts on the hosted API and moves on-prem only when residency or volume justifies it. A good answer names the tipping point — usually a compliance requirement or a sustained volume where owned GPUs beat per-token pricing.</p>"
    ],
    follow: "“When would you tell a customer not to self-host?” — small volume, no GPU team, or a need to always be on the newest model."
  },
  {
    id: "q3", cat: "Platform", q: "A customer has 200,000 short classification requests a day. Which model, and what does it cost?",
    a: [
      "<p>Start with the constraint: classification with a fixed label set, short inputs, high volume, low tolerance for latency. That is a small-model job with structured output, not a frontier model. Measure a small model against a labelled sample first; most classification tasks saturate well below the frontier tier.</p>",
      "<p>Then do the arithmetic out loud: 200k requests × ~700 input and ~10 output tokens ≈ 140M input and 2M output tokens per day. At a small-model list price that is single-digit dollars per day; at a frontier price it can be two orders of magnitude more. Add the levers: batch the non-interactive share at roughly half price, cache the stable instruction prefix, and keep the output to a schema so you are not paying for prose.</p>",
      "<p>Close with the escape hatch: route a small percentage of low-confidence cases to a larger model after a confidence check, which usually recovers most of the quality gap for a few percent of the cost.</p>"
    ],
    follow: "“What if accuracy is 4 points short after that?” — relabel, add few-shot examples, then consider fine-tuning, with a held-out set."
  },
  {
    id: "q4", cat: "Platform", q: "Explain batch, standard, priority and regional inference — and when you would use each.",
    a: [
      "<p><strong>Batch</strong> is asynchronous JSONL processing over a window, commonly around half price: backfills, nightly enrichment, bulk OCR, offline evaluation. <strong>Standard</strong> is best-effort hosted inference, seconds to minutes. <strong>Priority</strong> is a priority queue for entitled organisations with a high-nineties SLA at a 1.75× list multiplier, still eligible for prompt-cache discounts — for the revenue-critical slice only. <strong>Regional</strong> endpoints (<code>api.eu.mistral.ai</code>, <code>api.us.mistral.ai</code>) process inference inside that geography at 1.1× list price.</p>",
      "<p>Two details that show depth: regional inference constrains where inference runs, not where your control-plane metadata lives, and stateful features — Agents, Batch, Files — are not available on regional endpoints, so the orchestration layer has to be yours. Batch also changes your retry and idempotency design, because a job's output arrives later and partially.</p>"
    ],
    follow: "“A customer needs EU processing and agentic tools. What now?” — regional chat + function calling, orchestration on their side or an EU-hosted deployment."
  },
  {
    id: "q5", cat: "Prompting", q: "How do temperature, top_p and max_tokens change behaviour, and what do you set for extraction?",
    a: [
      "<p><code>temperature</code> rescales the logits before sampling; <code>top_p</code> truncates the nucleus before sampling. Moving both at once makes runs hard to compare, so fix one and vary the other. For extraction and classification: temperature 0, a schema in <code>response_format</code>, and a <code>max_tokens</code> that is generous enough for the object but not for an essay — output tokens are the expensive, slow half.</p>",
      "<p>Note that temperature 0 is not determinism on a hosted service: batching and kernel nondeterminism can still flip a near-tied token. That is why production extraction validates and repairs rather than assuming reproducibility, and why a “flaky extraction” bug is usually a schema or prompt clarity bug, not a sampling bug.</p>"
    ],
    follow: "“How do you stop a model from rambling in a JSON field?” — schema constraints plus an explicit field description with a length rule."
  },
  {
    id: "q6", cat: "Platform", q: "Hosted API or self-hosted open weights — how do you decide?",
    a: [
      "<p>Decide on four axes: data boundary, volume economics, latency control, and operating capacity. Hosted API wins when volume is modest, the team has no GPU operations experience, and you want the newest models without owning upgrades. Self-hosting wins when data cannot leave a tenancy, when sustained volume makes owned GPUs cheaper, when you need a pinned model forever, or when you need to modify the model.</p>",
      "<p>The middle path is common and worth naming: hosted for burst and for the hard tail, self-hosted for the steady-state bulk, with a router in front and one evaluation suite across both. The thing candidates forget is that self-hosting moves the evaluation burden onto you — every driver upgrade, quantisation change and model swap needs the same gate you had on the API.</p>"
    ],
    follow: "“What is the first thing you would measure before recommending self-hosting?” — tokens/day and the current bill, then tokens/sec/GPU on their hardware."
  },
  {
    id: "q7", cat: "Structured output", q: "JSON mode versus custom structured outputs — what does each guarantee?",
    a: [
      "<p>JSON mode guarantees parseable JSON; it does not guarantee your keys, your types or your enums, so you still instruct and validate. Custom structured outputs take a JSON schema and constrain generation to it, which is what you want for anything that feeds a database or a downstream service.</p>",
      "<p>Even with schema constraints, validate on your side and keep a repair path, because semantic validity is not schema validity: a date can be a string and still be wrong, a total can be a float and still be in the wrong currency. Model the object in Pydantic, send its schema, validate the response, re-ask once with the validation error appended, then degrade to a human queue. And keep the schema shallow — deep optional nesting is where both models and validators get unreliable.</p>"
    ],
    follow: "“Where would you still use JSON mode?” — exploratory or open-ended output where the shape genuinely varies."
  },
  {
    id: "q8", cat: "Tools", q: "Walk me through function calling, and the failure modes you design for.",
    a: [
      "<p>You send tool specifications (name, description, JSON-schema parameters) with the conversation. The model returns a message containing a tool call with a name and JSON arguments. Your runtime validates and executes it, appends a tool-role message with the result and the call id, and calls the model again. Loop until it returns prose or you hit your cap. The model never executes anything — it proposes.</p>",
      "<p>Failure modes: malformed arguments (validate, return a machine-readable error so it self-corrects); wrong tool (fewer, better-described tools, and measure selection accuracy); loops and runaway spend (iteration cap, token budget, terminal ask-the-user branch); side effects (idempotency keys, confirmation gates on irreversible actions); injection through tool output (treat third-party content as data, delimit it, never let it carry instructions).</p>",
      "<p>Production hardening is unglamorous: log every step, evaluate per-step validity and end-to-end task success, and pin the model version, because tool-calling behaviour shifts more across model updates than prose quality does.</p>"
    ],
    follow: "“How would you regression-test an agent before a model upgrade?” — replay recorded trajectories, compare per-step and end-to-end scores."
  },
  {
    id: "q9", cat: "Agents", q: "Chat Completions, Agents, or Workflows — how do you choose?",
    a: [
      "<p>Choose by control flow. <strong>Chat Completions</strong> when you own the loop and the state: one request, or a simple conversation you assemble yourself. <strong>Agents</strong> when you want the platform to hold a reusable model + instructions + tools bundle, with built-in web search, code interpreter, image generation and document-library retrieval, plus server-side conversation history and handoffs. <strong>Workflows</strong> when the process must survive failure: multi-step, retries, waits for human approval, runs for hours or days, durable event history.</p>",
      "<p>The trap is using an agent loop for a business process. If a step waits for a human or an external event, or the whole thing must resume after a crash, that is durable execution, not a chat loop. Conversely, if the requirement is a single tool call plus an answer, a workflow engine is ceremony.</p>"
    ],
    follow: "“Where does evaluation live in each?” — per-step for agents, per-activity plus end-to-end for workflows."
  },
  {
    id: "q10", cat: "Agents", q: "What are agent handoffs for, and what does handoff_execution change?",
    a: [
      "<p>Handoffs let one agent pass control to another with its own instructions and tools — a triage agent routing to a billing specialist, for example — instead of stuffing every tool and rule into one prompt. Splitting responsibilities keeps tool descriptions tight, which measurably improves selection accuracy, and lets you evaluate each specialist separately.</p>",
      "<p><code>handoff_execution</code> decides where the handoff happens: <code>server</code> runs it on Mistral's side, transparent to the client; <code>client</code> surfaces it to your code or the user, so you can insert a confirmation, a policy check, or a different agent runtime. If a handoff crosses a permission boundary — customer to human, or tenant to tenant — you want the client mode so that the gate is enforced by your system rather than by a prompt.</p>"
    ],
    follow: "“What breaks when two agents share one tool?” — ambiguous selection and double execution; scope tools per agent."
  },
  {
    id: "q11", cat: "Tools", q: "How do you defend against prompt injection when your tools read untrusted content?",
    a: [
      "<p>Treat every tool result as data, never as instruction. Concretely: delimit it clearly and label it (“the following is untrusted content retrieved from a customer document”), keep it out of the system prompt, and instruct the model that instructions inside it are content to report, not follow. That reduces but does not eliminate the risk.</p>",
      "<p>The real defence is architectural. Tools have least privilege and no ambient credentials; irreversible actions require a confirmation the model cannot forge; outputs are validated against a schema before they reach another system; and the retrieval layer filters by the caller's ACLs so a successful injection cannot reach documents the user could not read anyway. Then measure it: an adversarial slice in the golden set with injection attempts, scored pass/fail, run on every change.</p>"
    ],
    follow: "“Can you fully prevent it?” — no; you bound the blast radius and detect attempts."
  },
  {
    id: "q12", cat: "Agents", q: "What is the difference between an Agent object and a Conversation?",
    a: [
      "<p>An Agent is configuration: model, name, description, instructions, tools, completion arguments, optional guardrails and handoffs — a reusable definition with versions and aliases. A Conversation is state: the ordered history of messages, tool executions and entries with an assistant, started either by an agent id or by a model id directly. They are independent: you can have conversations without agents.</p>",
      "<p>Two operational details: the public Conversations API only reads and modifies conversations owned by the API key that created them, which shapes how you design per-user access; and <code>store=False</code> lets you opt out of storing history, which matters for data-handling commitments. Guardrails attached to an agent are inherited by its conversations and can be overridden per request.</p>"
    ],
    follow: "“Where would you keep conversation state instead?” — your own database, when residency or retention rules forbid platform storage."
  },
  {
    id: "q13", cat: "Agents", q: "When is durable execution the right tool, and what does it buy you?",
    a: [
      "<p>When a process has multiple steps, external calls, and failure that must not lose work: every step recorded in an event history, another worker resumes from the last completed step, retries with backoff are first-class, and the process can pause on a human signal for days. That is the shape of most enterprise AI delivery — ingest, wait for approval, enrich, publish — and it is exactly what a naive loop gets wrong.</p>",
      "<p>The design consequence is that your workflow code must be deterministic and side effects must live in activities, so replay is safe. In practice that means activities for model calls and API writes, and workflow code for branching and state. Evaluation still applies: per-activity assertions plus end-to-end task success, with the event history giving you a free trace for debugging.</p>"
    ],
    follow: "“What is the anti-pattern?” — putting an unbounded agent loop inside one activity so retries replay the whole conversation."
  },
  {
    id: "q14", cat: "Safety", q: "How would you add guardrails to a customer-facing assistant?",
    a: [
      "<p>Two layers. Inline, declarative guardrails on the request block unsafe input before it reaches the model, returning a structured error you can handle — category thresholds, an allowlist of categories, and a fail-closed option if the moderation call itself errors. Then a post-generation check on the output for the categories the business cares about (PII leakage, medical or financial advice, brand policy), because input moderation cannot catch a model that volunteers something.</p>",
      "<p>The moderation model classifies across policy categories including PII, health, financial, legal and jailbreak attempts, and returns scores you can threshold yourself. Calibrate those thresholds against your own labelled sample — the default threshold is tuned to their test set, not your domain — and log every block as an event so you can review false positives, which is the failure mode customers actually complain about.</p>",
      "<p>Finally, guardrails are not the whole safety story: least-privilege tools, human approval for irreversible actions, and an audit trail matter more than a classifier.</p>"
    ],
    follow: "“Your block rate spikes after a model upgrade. What do you check?” — threshold drift, category mix, and the false-positive sample."
  },
  {
    id: "q15", cat: "RAG", q: "2,000 pages of PDFs, a Q&A assistant: RAG or fine-tuning?",
    a: [
      "<p>RAG, and the reasoning is the answer. Fine-tuning teaches behaviour — format, tone, task procedure, domain vocabulary. It is unreliable for injecting facts, impossible to update per document, cannot cite, and cannot enforce per-user access control. RAG keeps facts in a store you can update in minutes, gives citations, and lets permissions be applied at retrieval time, which is non-negotiable for enterprise documents.</p>",
      "<p>Name when fine-tuning enters instead: the model keeps failing on the <em>form</em> of the task despite good retrieval (schema, jargon, tone); you want a small cheap model to imitate a larger one on one narrow task; or latency and cost pressure argue for shorter prompts than few-shot needs. The mature framing is RAG first, measure, then fine-tune the generator on top of RAG traces if the remaining gap is behavioural.</p>",
      "<p>Then show system judgement: parsing quality dominates (tables, scans, headers), chunking must be structure-aware, retrieval should be hybrid with a reranker, and you need a golden set of ~50 questions before you change anything.</p>"
    ],
    follow: "“The customer says fine-tuning because they do not want data in prompts.” How do you respond? Data-handling terms, zero retention, regional endpoints, or on-prem — not fine-tuning."
  },
  {
    id: "q16", cat: "RAG", q: "How do you chunk documents, and what goes in the metadata?",
    a: [
      "<p>Chunk on structure, not character count: split at section and block boundaries from the parser, keep tables whole (an HTML table chunk, not half a table), and use 300–800 tokens with modest overlap as a starting range — then let the eval set decide. Store <code>doc_id, version, page, block_id, section_path, label</code>, plus a parent-section id so a hit can be expanded into surrounding context at answer time.</p>",
      "<p>Two failure modes worth naming: a chunk that starts mid-sentence loses the antecedent (“the fee is 0.4%” — of what?), which is fixed by structure-aware boundaries and by prepending the section title to the chunk text; and re-ingestion with changed chunk ids breaks citations and cached answers, so version the id scheme and keep a mapping.</p>"
    ],
    follow: "“Fixed-size chunking is cheaper to build. When is it fine?” — homogeneous prose, no tables, and a retrieval metric that shows no difference."
  },
  {
    id: "q17", cat: "RAG", q: "Why hybrid retrieval and a reranker, when embeddings are already semantic?",
    a: [
      "<p>Embeddings are good at meaning and bad at exact strings: invoice numbers, clause references, product codes, rare proper nouns, and short keyword queries. BM25 is the mirror image. Fusing both (reciprocal rank fusion is a solid default) recovers recall that either alone misses, and it costs almost nothing to add.</p>",
      "<p>A reranker then fixes precision: retrieve 30–50 candidates cheaply, score them jointly with the query using a cross-encoder or an LLM, keep the top 5–8. In most enterprise corpora this is the single biggest quality gain per unit of effort, and it is also the place where you can show measurement discipline — hit@5 before and after, on the same questions.</p>",
      "<p>Add a semantic cache only after measuring: caching near-duplicate questions cuts cost and latency, but a stale cache entry in a compliance context is a correctness bug, so it needs an invalidation story.</p>"
    ],
    follow: "“How do you fuse the two ranked lists?” — RRF with a k around 60, or weighted score normalisation if you have labels."
  },
  {
    id: "q18", cat: "RAG", q: "Which retrieval metrics do you track, and how do they relate to answer quality?",
    a: [
      "<p>Retrieval: <strong>hit@k</strong> (is a correct chunk in the top k), <strong>MRR</strong> (how high the first correct chunk ranks), and context precision (what fraction of retrieved chunks are actually relevant). Answer: faithfulness to the retrieved context, completeness against a reference, citation validity, and correct refusal when the context is insufficient.</p>",
      "<p>They relate but do not substitute. A high hit@5 with a low faithfulness score means the model is ignoring or over-reading context; a low hit@5 with confident answers means the model is filling gaps from parametric memory, which is the dangerous case in an enterprise. Track them separately so the fix is aimed correctly: retrieval work for the first, prompting and refusal policy for the second.</p>",
      "<p>Keep the set small and honest — 20–50 questions with known answers, stratified by difficulty — and re-measure on every change. A number you cannot reproduce is worse than no number.</p>"
    ],
    follow: "“How do you build the set without a labelled corpus?” — sample real questions from support or search logs, and hand-answer 50."
  },
  {
    id: "q19", cat: "Document AI", q: "Design ingestion for 100,000 scanned PDFs with tables and multi-column layouts.",
    a: [
      "<p>Pipeline: OCR with structure first, then chunk, then embed, then index — with provenance at every hop. OCR 4.1 gives per-page markdown plus, with <code>include_blocks</code>, paragraph-level bounding boxes and structural labels in reading order; <code>table_format</code> returns tables separately as markdown or HTML; header and footer extraction keeps running furniture out of the body; confidence scores at page, block or word granularity drive triage.</p>",
      "<p>At 100k documents this is a batch job, not 100k synchronous calls: JSONL of OCR requests, roughly half price, with partial-output handling and idempotent re-runs by document hash. Low-confidence pages and failed pages go to a human review queue rather than silently into the index. Multi-column layouts are where naive text order fails, which is exactly why block reading order matters.</p>",
      "<p>Then the cost line: at list pricing around 4 USD per 1,000 pages, a 100k-document corpus of 40 pages each is about 16k USD one-off — the kind of number an enterprise buyer needs to hear before signing, and re-ingestion is the recurring cost you should design to minimise by hashing and skipping unchanged documents.</p>"
    ],
    follow: "“Where does the schema go?” — annotations, so structured extraction happens in the OCR pass instead of a second model call."
  },
  {
    id: "q20", cat: "Evaluation", q: "How do you design and calibrate an LLM judge?",
    a: [
      "<p>Rubric first: 3–5 discrete criteria with anchors for each score, and a forced justification string so failures are debuggable. Use pairwise comparison when choosing between versions (it is more stable than absolute scores), randomise the order to blunt position bias, and hide which variant is which. Temperature 0, a small <code>max_tokens</code>, and JSON output.</p>",
      "<p>Then calibrate the instrument: hand-label 30 outputs, compute raw agreement and Cohen's kappa against the judge, and read the disagreements — they usually reveal an ambiguous criterion. Know the noise floor before you gate a release on it; a judge that agrees 80% of the time is useful as a relative signal and dangerous as an absolute verdict.</p>",
      "<p>Cheap deterministic checks should run before the judge: schema validity, cited ids that exist, non-empty, correct refusal, latency budget. They catch a large share of failures for free and shrink the judge's job to judgement.</p>"
    ],
    follow: "“What if the judge and the human disagree on safety?” — human wins; safety criteria should not be judge-gated below a human review threshold."
  },
  {
    id: "q21", cat: "Evaluation", q: "What do you log on every request, and why?",
    a: [
      "<p>Request id and tenant; prompt template version and model id (pinned); token counts and cost; latency split into queue, prefill and decode where available; retrieved chunk ids and scores; tool calls with arguments, results and durations; guardrail decisions; the final answer; and the user feedback signal if one exists. Redact PII at the logging boundary, not at the analytics boundary.</p>",
      "<p>The reason is that this log is three things at once: the audit trail a regulated customer requires, the debugging surface when something goes wrong, and the raw material for the next golden set. Every production failure should become a test case, which only works if the trace is complete enough to replay.</p>",
      "<p>Retention is a design decision, not a default: what you keep, for how long, where, and who can read it. That is a customer conversation as much as an engineering one.</p>"
    ],
    follow: "“How do you sample traces for evaluation?” — stratified by failure signals and by tenant, not uniformly."
  },
  {
    id: "q22", cat: "Evaluation", q: "What does a release gate look like, and what makes it trustworthy?",
    a: [
      "<p>A gate is a policy with a baseline: the suite must pass at or above the last accepted baseline within a tolerance, on both the aggregate and the hard stratum; p95 latency within budget; cost per request within budget; and no new safety-criterion failures. Failure blocks promotion and names the regressed cases by id — a gate that says “score dropped 3%” is unusable.</p>",
      "<p>What makes it trustworthy: a versioned golden set that grows from real incidents, a calibrated judge, deterministic checks in front of the judge, pinned model and prompt versions so a failure is attributable, and a re-baseline procedure when the judge or model changes. Without that last piece you get drift where every change looks like a regression or none does.</p>",
      "<p>In production the same policy becomes a canary: slice traffic, compare judge scores and refusal rates against control, and keep a one-line rollback.</p>"
    ],
    follow: "“A change improves the average but hurts the adversarial slice. Ship?” — no; the adversarial slice is the point."
  },
  {
    id: "q23", cat: "Internals", q: "What do grouped-query attention and sliding-window attention each buy, and what do they cost?",
    a: [
      "<p>They attack different bottlenecks. GQA attacks KV-cache size and bandwidth at inference: with 32 query heads sharing 8 KV heads, the cache shrinks 4× — from roughly 512 KiB to 128 KiB per token at fp16 — which increases the batch and context a GPU can serve. Quality loss at that ratio is empirically small, which is why it became the default in open models.</p>",
      "<p>Sliding-window attention attacks quadratic compute: each layer attends only to the last W tokens, so compute per token is O(W) instead of O(n), and a ring-buffer cache caps memory at W per layer. Information still propagates beyond W because receptive fields stack across layers — roughly W × L positions — but exact long-range recall degrades, so long-context-sensitive models mix windowed and full-attention layers.</p>",
      "<p>The unifying point: both are inference-economics decisions made at architecture time, not quality knobs.</p>"
    ],
    follow: "“What breaks if you use a ring buffer but keep the wrong positions?” — RoPE rotations must match absolute positions; renumerated slots corrupt attention."
  },
  {
    id: "q24", cat: "Internals", q: "Implement causal multi-head attention, then convert it to GQA.",
    a: [
      "<p>Project to q, k, v with learned matrices, reshape to (batch, heads, seq, head_dim), apply RoPE to q and k, compute scaled dot-product with a strict upper-triangular mask, softmax, multiply by v, merge heads, project out. For GQA, make the k/v projections produce <code>n_kv_heads</code> heads and expand them to match query heads before the attention computation.</p>",
      "<p>Details that get probed: the mask must exclude strictly-future positions (<code>triu(diagonal=1)</code>); scale by head dimension, not model dimension; the saving lives in the k/v projection shapes and in caching before expansion — at inference you cache <code>n_kv_heads</code>, not the repeated tensor. In production you use a fused kernel; <code>repeat_interleave</code> is for teaching because it materialises copies.</p>",
      "<p>Then extend: add a KV cache and write the single-token decode path. That is where understanding becomes visible — prefill versus decode asymmetry, and what the cache actually stores.</p>"
    ],
    follow: "“Where does RoPE go, and why only q and k?” — relative position enters the attention score; v carries content, not position."
  },
  {
    id: "q25", cat: "Internals", q: "Explain sparse mixture-of-experts: why is a 47B-parameter model priced like a 13B one?",
    a: [
      "<p>The attention is ordinary; each FFN is replaced by N expert FFNs plus a small router. Per token, the router scores all experts, picks the top k (2 in Mixtral 8x7B), and the output is the weighted sum of those experts. You store ~47B parameters but execute ~13B per token, so decode FLOPs resemble a 13B dense model while quality draws on a larger pool.</p>",
      "<p>The asymmetry is the point: FLOPs scale with active parameters, memory scales with total. You must hold all experts in VRAM, or shuffle them at a latency cost. So MoE buys quality per FLOP, not quality per gigabyte — great when compute-bound with memory to spare, wrong for one consumer GPU.</p>",
      "<p>Training adds an auxiliary load-balancing loss (otherwise routers collapse onto favourite experts), non-differentiable top-k selection, and all-to-all communication for expert parallelism. Serving adds imbalance: at batch 1 a token touches few experts; at realistic batch sizes most of the pool is touched each step, so bandwidth approaches the full footprint amortised over the batch, and a hot expert becomes a straggler.</p>"
    ],
    follow: "“675B total, 41B active. Does it fit on 8×H100 80GB?” — 640GB total; not at bf16 (~1.35TB) or fp8 (~675GB), yes at 4-bit (~350-400GB) with cache headroom."
  },
  {
    id: "q26", cat: "Internals", q: "Estimate the KV cache for a 32-layer model with 8 KV heads, head dim 128, fp16, and tell me what it implies.",
    a: [
      "<p>Per token: 2 (K and V) × 32 layers × 8 KV heads × 128 head dim × 2 bytes = 131,072 bytes, so <strong>128 KiB per token</strong>. A 4,096-token sequence is about 512 MiB. Thirty concurrent sequences at that length ≈ 15 GiB, which exceeds the ~14 GiB of bf16 weights for a 7B model.</p>",
      "<p>The implication is the interesting part: at realistic concurrency the cache, not the weights, is the capacity constraint. That is why GQA exists, why paged attention exists, and why admission control and preemption are real production behaviours rather than theory. It is also how you answer “how many concurrent users per GPU?” without guessing — divide available VRAM after weights by cache per sequence, then sanity-check against your measured batch throughput.</p>"
    ],
    follow: "“What if the customer wants 32k context?” — per-sequence cache becomes the scheduler's problem; expect far lower concurrency, or quantise the cache."
  },
  {
    id: "q27", cat: "Serving", q: "Why does continuous batching beat static batching, and what does it cost you?",
    a: [
      "<p>Static batching runs a fixed batch until every request finishes, so short requests wait for the longest and new arrivals wait for the whole batch to drain — padded compute and cratered utilisation. Continuous (iteration-level) batching reschedules every decode step: finished sequences leave immediately, queued requests join immediately, and the GPU always works on a full batch. On mixed-length traffic throughput improves several-fold.</p>",
      "<p>Costs: TTFT jitter for streams already running when a prefill joins the batch (chunked prefill and prefill-priority policies tune this); memory admission control, because the batch is bounded by cache capacity and overcommitting forces preemption; and fairness, because pure throughput scheduling starves long requests, so production needs priority queues. MoE adds per-step cost variance within a batch.</p>",
      "<p>The signal is thinking in tokens/sec/GPU and p95 TTFT at the same time, knowing they fight.</p>"
    ],
    follow: "“How does speculative decoding interact?” — it changes tokens per step, so the scheduler's cost model and acceptance-rate monitoring change too."
  },
  {
    id: "q28", cat: "Serving", q: "How do you choose a quantisation scheme and prove quality did not regress?",
    a: [
      "<p>Choose by hardware and bottleneck. Decode is bandwidth-bound, so weight-only int4 (AWQ/GPTQ family) is the workhorse: ~4× smaller, faster decode, runs on older GPUs. On Hopper/Blackwell-class hardware, fp8 keeps near-lossless quality with tensor-core speedups and is the low-drama default; Blackwell adds native fp4. Under memory pressure, quantise the KV cache too — often the bigger win at long context. Below 4-bit is a last resort.</p>",
      "<p>Proving no regression is the part most people do badly: perplexity deltas are necessary and insufficient, because damage is task-uneven — math, code, extraction fidelity and long-context recall degrade first, casual chat does not. Run the customer's golden set before and after, run capability probes in the damage-prone areas, do a paired diff on a few hundred cases, and check calibration-data bias (English web text for a French legal customer is a bad calibration set).</p>",
      "<p>Ship with per-scheme version pinning and a one-config rollback.</p>"
    ],
    follow: "“Why does weight-only quantisation speed decode but barely help prefill?” — prefill is compute-bound; decode is bandwidth-bound."
  },
  {
    id: "q29", cat: "Design", q: "Design an on-prem deployment for a European bank that cannot send data to any external API.",
    a: [
      "<p>Requirements first: workloads (assistant, document processing, code), concurrency and latency targets, GPU reality (often a handful of A100/H100 nodes), and compliance — residency, audit logging, model-risk documentation, and the bank's obligations as a deployer under the EU AI Act.</p>",
      "<p>Architecture: weights and inference entirely inside the bank's network — an inference server with continuous batching and paged KV cache, model size chosen against VRAM (MoE memory scales with total parameters). A gateway in front for authn/z, per-team quotas, full request/response audit logging into the bank's SIEM, and PII redaction hooks. Retrieval components self-hosted too, including the embedding model — teams forget that an embedding API is also an external call. Per-department adapters can share one base model if fine-tuning is needed.</p>",
      "<p>Operations is where these die: pinned model versions, a re-run of the eval suite before any swap, capacity planning from KV-cache math, monitoring of TTFT, tokens/sec and GPU utilisation, quality drift on a golden set, and a human-in-the-loop story for customer-facing output. The offline eval set is the only quality instrument the bank will have.</p>"
    ],
    follow: "“4×A100 80GB total — what do you deploy?” — a 24B-class model at fp8 with cache headroom, or a smaller dense model with higher concurrency; quantify both."
  },
  {
    id: "q30", cat: "Design", q: "How do you estimate and then control cost for a production LLM feature?",
    a: [
      "<p>Bottom-up: requests/day × turns × (input tokens × input price + output tokens × output price), then add retry overhead, evaluation runs, and embedding or OCR costs if the feature has ingestion. Convert to cost per request and per active user, because those are the numbers a product owner can act on.</p>",
      "<p>Control levers in order of impact: retrieve less and summarise history (input tokens usually dominate); cache the stable prefix (large discount on repeated long instructions); constrain output with schemas (output tokens are the expensive half); route routine traffic to a small model and only the hard tail up; batch anything that is not interactive at roughly half price; and reserve priority tier for the revenue-critical slice at its premium.</p>",
      "<p>Then instrument it: cost per request on a dashboard with an alert on the p95, and a weekly review of the top three cost drivers. Cost regressions usually come from a prompt change that silently doubled context, so track tokens per request as a first-class metric.</p>"
    ],
    follow: "“The bill doubled overnight. First three checks?” — input tokens per request, cache hit rate, retry rate."
  },
  {
    id: "q31", cat: "Design", q: "Design a multi-tenant agent platform where agents can take actions in customer systems.",
    a: [
      "<p>Constraints: tenant isolation, per-tenant credentials and quotas, irreversible actions gated, full audit, and unit economics that survive a free tier.</p>",
      "<p>Topology: one inference tier behind a gateway that enforces tenant identity, quota, logging and model routing; a per-tenant tool registry with scoped credentials; per-tenant retrieval indexes; and durable orchestration for anything that waits on a human, because approval flows are not chat loops. Tools are versioned and described per tenant, since tool descriptions are prompts and a shared mega-toolset measurably degrades selection.</p>",
      "<p>Safety: least-privilege tools, idempotency keys on writes, platform-enforced approval gates (never prompt-enforced), a per-tenant kill switch, and injection isolation between tenant data and tenant instructions. Evaluation: shared capability suite plus per-tenant smoke cases, per-step tool validity and end-to-end task success, canary by tenant cohort, and model upgrades gated on both.</p>",
      "<p>Economics: cost attribution per tenant, context discipline on the free tier, and batch for anything that can be asynchronous.</p>"
    ],
    follow: "“A tenant asks for a tool that can send email to their customers.” — approval gate, rate limits, template constraints, and an audit trail; not a prompt instruction."
  },
  {
    id: "q32", cat: "Coding", q: "You are handed a 200-line script that calls the API in a loop. What do you do in the first five minutes?",
    a: [
      "<p>Read it end to end before typing, then say what it does in one sentence and name two smells with their consequences: a per-item request with no batching (cost and latency), swallowed exceptions (silent data loss), a hard-coded model and prompt (untestable), no schema (unvalidated output).</p>",
      "<p>Then propose the smallest change that removes the most risk — usually a seam: inject the client, extract prompt construction into a pure function, and add one test that pins current behaviour. Only then batch, add typed errors with bounded retries, and validate output. Say explicitly what you are not changing and why, so the interviewer sees deliberate scope.</p>",
      "<p>Close by leaving it runnable and telling them how you would verify: a test that a failed batch does not lose successful items, and a log line per item with id, latency, tokens and failure reason.</p>"
    ],
    follow: "“Now make it handle 10,000 items.” — batch API or bounded concurrency, checkpointing, idempotency by item id, and partial-failure reporting."
  },
  {
    id: "q33", cat: "Coding", q: "Pair-programming: build a service that answers questions using a third-party API plus a chat model. Structure it out loud.",
    a: [
      "<p>Layers with seams: an <code>Enrichment</code> value object, a third-party client behind an interface (so it is swappable and mockable), a pure prompt-rendering function, an <code>Answerer</code> that composes enrichments and calls the model, and a thin HTTP handler. Define the interface before the implementation — that sentence alone signals experience.</p>",
      "<p>Then the behaviours: timeouts and bounded retries with backoff on both APIs, never retrying non-idempotent operations blindly; degrade to answering without enrichment (with a caveat in the prompt) rather than failing the request; validate and truncate third-party payloads before they enter the prompt; label them as untrusted data; and log the full trace, because that trace becomes the eval set.</p>",
      "<p>Finally, say how you would know it works: a fixture-based test for the client, a unit test for the renderer, and one end-to-end test with a recorded response.</p>"
    ],
    follow: "“The third party rate-limits you at 10 rps.” — queue with backpressure, cache by query, and degrade rather than block."
  },
  {
    id: "q34", cat: "Coding", q: "How do you stream a response to a user and handle failures without a broken UI?",
    a: [
      "<p>Stream tokens from the model to the client over SSE or a websocket, but keep the contract explicit: a first event carrying metadata (request id, model), then deltas, then a terminal event with usage and finish reason, and a distinct error event type. The client should never have to infer completion from a closed socket.</p>",
      "<p>Failure handling: if the stream breaks mid-answer, retry once from the start only when the request is idempotent and the user has not acted on partial output; otherwise surface a resumable state. Bound the total time, not just the first token — a stuck stream is worse than a fast error. On the server, wrap the stream in a context manager that always records usage and errors, so a cancelled request still produces a trace line.</p>",
      "<p>For tool-using streams, emit tool-start and tool-end events so the UI can show progress instead of a frozen cursor.</p>"
    ],
    follow: "“What do you do about partial JSON while streaming?” — stream prose, not structured objects; validate at the end."
  },
  {
    id: "q35", cat: "Behavioural", q: "Walk me through the most technically complex thing you have built.",
    a: [
      "<p>Structure: the constraint that made it hard, the decision you made, the number that proved it worked, and what you would change now. Ninety seconds, three numbers, one trade-off. For example: an optimisation service with a hard solve-time budget, where the decision was to precompute candidates and warm-start, cutting solve time by a measured percentage while holding solution quality on a benchmark set — and the thing to change would be the evaluation harness, which was bolted on late.</p>",
      "<p>Pick the story that matches the role: production deployment, quality measurement, or a customer-facing rescue. Say “I” for your decisions and “we” for the team's work, and do not spend the first minute on context nobody needs.</p>"
    ],
    follow: "“What would you do differently?” Have a real answer — a design choice, not a platitude about communication."
  },
  {
    id: "q36", cat: "Behavioural", q: "Tell me about a time you shipped something fast and it was the right call — or the wrong one.",
    a: [
      "<p>Use the version where you scoped down deliberately: a narrow, correct slice in days, with the risk named and bounded, and a measurement that told you whether to continue. The lesson to land is judgement about what not to build — that is what “speed” means at a company that values it, and it is the value candidates most often answer with busyness instead of decisions.</p>",
      "<p>If you use a failure, make it real and specific: what you shipped, the signal you ignored, the cost, and the mechanism you added afterwards so it cannot recur. A candidate who says “we shipped too fast” without a mechanism has not learned anything.</p>"
    ],
    follow: "“How do you decide what to cut?” — the smallest thing that produces a real signal for the customer."
  },
  {
    id: "q37", cat: "Behavioural", q: "Tell me about yourself, in two minutes.",
    a: [
      "<p>Three beats: what you build (one sentence with a domain), the evidence (two numbers from production work), and why this role (one sentence tying your constraint-driven background to applied AI delivery). No chronological résumé — they have it.</p>",
      "<p>A workable shape: “I build systems where the hard part is the constraint, not the model — most recently X, where I got Y% improvement under a hard budget by Z. Before that I did A, which is where I learned to measure rather than argue. I want the Applied AI role because it is the same job with a customer attached: scoping, shipping, proving it works, handing it over.”</p>"
    ],
    follow: "They will pick one of your three beats and go deep. Know which one."
  },
  {
    id: "q38", cat: "Behavioural", q: "What questions do you have for us?",
    a: [
      "<p>Ask four, in this spirit: how an engagement is scoped and when it turns into a product feature; what handover looks like for a customer without ML engineers; how the team chooses between managed retrieval, a custom stack, and fine-tuning today; and what success looks like at 6 and 12 months in this role.</p>",
      "<p>Then one that is specific to the interviewer: what is the most common way a delivery goes wrong here. Avoid compensation, holiday and remote policy in the technical rounds — ask the recruiter — and avoid questions whose answers are on the careers page.</p>"
    ],
    follow: "Their answers are your evidence for the final decision. Take notes afterwards."
  }
];
