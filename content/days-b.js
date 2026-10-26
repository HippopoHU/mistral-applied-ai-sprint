/* Days 4–7 */

window.DAYS_B = [
  {
    id: 4,
    label: "Day 4",
    title: "Evaluation: the thing that makes you credible",
    kicker: "Quality · 3 h",
    mission: "Replace opinions with a number. Build a golden set, a judge you can defend, and a gate that fails the build.",
    chips: ["3 hours", "Lab: eval harness + gate", "Interview signal: rigour"],
    intro: [
      "This is the highest-leverage day. Anyone can say “we evaluated it”. Very few candidates can describe a dataset, a judge, an agreement check, a threshold, and what happens when the threshold is missed. Applied AI engineers are trusted precisely because they can prove a system got better without shipping a regression.",
      "If your interview is soon and you only do one lab this week, do this one."
    ],
    blocks: [
      { time: "0:00", label: "What to measure, per system type", task: "Retrieval: hit@k, MRR, context precision. Answer: faithfulness, correctness, citation validity, refusal behaviour. Agent: per-step validity, task success, cost and steps per task." },
      { time: "0:35", label: "Judges that are worth trusting", task: "Rubric design, pairwise vs absolute, position bias, agreement with humans on a sample, and why a judge needs its own eval." },
      { time: "1:00", label: "Lab: harness with a gate", task: "30 cases, two prompt variants, rule-based plus judge scoring, pass rate, and a non-zero exit when the gate fails." },
      { time: "2:10", label: "Observability and traces", task: "Read the traces and evaluations docs. Decide what you log on every request and why." },
      { time: "2:40", label: "Rehearse", task: "Explain your harness in 3 minutes to an imaginary sceptical staff engineer." }
    ],
    concepts: [
      {
        title: "A golden set is a product artefact",
        body: [
          "Thirty to fifty cases, drawn from real user questions, each with an expected answer or an expected behaviour, plus a note on <em>why</em> it is hard. Stratify deliberately: happy path, ambiguous query, out-of-scope (must refuse), adversarial or injected content, multilingual if the customer needs it, and at least a few cases with known-bad retrieval.",
          "Keep it versioned in the repo. Grow it every time a production failure appears — one failing case per incident, added before the fix. Track two numbers per run: overall pass rate and the pass rate on the difficult stratum, because an aggregate that hides the adversarial slice is how regressions ship.",
          "Offline evaluation on a fixed set is necessary and insufficient. It tells you whether you changed behaviour; it does not tell you whether the change is better for users. Production traces close that loop, which is why the platform separates datasets/traces from evaluation runs."
        ],
        probe: "“How big is your eval set?” is a trap. The answer is a composition, not a number."
      },
      {
        title: "Judges: an instrument you must calibrate",
        body: [
          "An LLM judge is a measuring instrument, and instruments need calibration. Write the rubric with 3–5 discrete criteria and explicit anchors for each score. Prefer pairwise comparison when you are choosing between two versions, because absolute scores drift. Randomise the order of the pair to blunt position bias, and hide which variant is which.",
          "Then measure the judge itself: hand-label 30 outputs, compute agreement with the judge (raw agreement and Cohen's kappa), and inspect disagreements — they usually reveal an ambiguous rubric, not a bad judge. A judge that disagrees with you on 20% of cases is still useful as a <em>relative</em> signal, but you must know its noise floor before you gate a release on it.",
          "Cheap deterministic checks belong in front of the judge: schema validity, citation ids that exist, no empty answers, refusal when retrieval was empty, latency budget. They catch a large share of failures for free and make the judge's job smaller."
        ],
        probe: "“How do you know your judge is right?” — agreement study, kappa, and a human-labelled slice."
      },
      {
        title: "Gates, canaries, and the cost of a regression",
        body: [
          "A release gate is a policy: the eval suite must pass at or above the last accepted baseline, within a tolerance, on both the aggregate and the hard stratum; latency p95 within budget; cost per request within budget. Failures block promotion, and the failure output names the specific cases that regressed.",
          "In production, canary the change on a slice of traffic, compare judge scores and refusal rates against the control, and keep a one-line rollback: pinned model id, pinned prompt version, pinned index snapshot. Prompt registry and model pinning are not bureaucracy — they are what makes rollback possible.",
          "The subtle risk is eval drift: when the golden set stops resembling traffic. Sample fresh production traces monthly, judge them, and promote failures into the set. A suite that has not changed in six months is measuring last quarter's product."
        ],
        probe: "“What would make you block a release?” — a named case failing, not a vibe."
      }
    ],
    lab: {
      title: "A 30-case harness that exits non-zero when quality drops",
      goal: "Build the smallest credible evaluation system: dataset in JSONL, deterministic checks, a rubric judge, statistical summary, and a gate you can put in CI.",
      steps: [
        "Write 30 cases in JSONL: `{id, question, reference, must_refuse, difficulty}`. Use real questions from your Day 3 corpus plus five out-of-scope ones.",
        "Implement deterministic checks first: non-empty, citations resolve to retrieved ids, refusal exactly when `must_refuse`.",
        "Add the judge: same model, temperature 0, JSON output with per-criterion scores and a one-line justification. Require the justification — it is how you debug the judge.",
        "Run two prompt variants (e.g. strict grounding vs loose) over the same cases; report pass rate overall and by difficulty.",
        "Add the gate: compare to a stored baseline JSON; exit 1 with a diff if any stratum drops more than the tolerance.",
        "Hand-label ten outputs and compute judge agreement. Write down the number, whatever it is."
      ],
      code: [
        {
          lang: "python",
          name: "04_eval_gate.py",
          src: `import json, os, sys
from statistics import mean
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
JUDGE_MODEL = "mistral-medium-latest"
BASELINE = "baseline.json"
TOLERANCE = 0.03

RUBRIC = """Score the answer on three criteria, 0-2 each.
grounded: every claim is supported by the context.
complete: it answers the actual question.
cited: it cites the context ids it used.
Return JSON: {"grounded": int, "complete": int, "cited": int, "why": "one sentence"}"""

def judge(question, context, answer) -> dict:
    r = client.chat.complete(
        model=JUDGE_MODEL, temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": RUBRIC},
                  {"role": "user", "content": f"QUESTION\\n{question}\\n\\nCONTEXT\\n{context}\\n\\nANSWER\\n{answer}"}],
        max_tokens=200,
    )
    try:
        d = json.loads(r.choices[0].message.content)
        return {"score": sum(d[k] for k in ("grounded", "complete", "cited")) / 6,
                "why": d.get("why", "")}
    except Exception:
        return {"score": 0.0, "why": "judge_output_unparseable"}

def run(prompt_variant: str) -> dict:
    cases = [json.loads(l) for l in open("cases.jsonl")]
    rows = []
    for c in cases:
        # stand-in for your Day 3 pipeline: returns answer + retrieved ids
        answer, ids = answer_with_pipeline(c["question"], variant=prompt_variant)
        checks = {
            "non_empty": bool(answer.strip()),
            "cites_known_id": all(x in ids for x in extract_citations(answer)) if extract_citations(answer) else False,
            "refusal_ok": (("insufficient context" in answer.lower()) == c["must_refuse"]),
        }
        j = judge(c["question"], "<retrieved context>", answer)
        rows.append({"id": c["id"], "difficulty": c["difficulty"],
                     "checks": checks, "judge": j,
                     "passed": all(checks.values()) and j["score"] >= 0.66})
    by_difficulty = {}
    for r in rows:
        by_difficulty.setdefault(r["difficulty"], []).append(r["passed"])
    return {"overall": mean([r["passed"] for r in rows]),
            "by_difficulty": {k: mean(v) for k, v in by_difficulty.items()},
            "rows": rows}

def gate(result: dict) -> int:
    base = json.load(open(BASELINE)) if os.path.exists(BASELINE) else None
    print(json.dumps({k: result[k] for k in ("overall", "by_difficulty")}, indent=2))
    if base is None:
        json.dump({"overall": result["overall"], "by_difficulty": result["by_difficulty"]},
                  open(BASELINE, "w"), indent=2)
        print("baseline written"); return 0
    failures = []
    if result["overall"] < base["overall"] - TOLERANCE:
        failures.append(f"overall {result['overall']:.2f} < {base['overall']:.2f}")
    for k, v in result["by_difficulty"].items():
        if v < base["by_difficulty"].get(k, 0) - TOLERANCE:
            failures.append(f"{k} {v:.2f} < {base['by_difficulty'].get(k):.2f}")
    if failures:
        print("GATE FAILED:", *failures, sep="\\n  ")
        return 1
    print("gate passed"); return 0

if __name__ == "__main__":
    sys.exit(gate(run(prompt_variant=sys.argv[1] if len(sys.argv) > 1 else "strict")))
`
        }
      ],
      verify: "Running the script twice with different prompt variants produces two summaries and a non-zero exit when the strict variant regresses on the adversarial stratum. You can state your judge's agreement with your own labels on ten cases.",
      pitfalls: "Do not gate on the mean alone; the hard stratum is where the signal is. Do not let the judge see which variant it is scoring. Do not compare runs across model upgrades without re-baselining — a judge change is a measurement change."
    },
    questionIds: ["q20", "q21", "q22", "q18"],
    deliverable: "cases.jsonl, the harness, a baseline.json, and one paragraph on judge agreement.",
    checklist: [
      "30-case stratified golden set in version control",
      "Deterministic checks before the judge",
      "Judge returns structured output with justification",
      "Judge calibrated against at least ten human labels",
      "Gate exits non-zero and names the regressed cases",
      "Can describe production trace sampling and eval drift",
      "Can explain why offline eval is necessary but insufficient"
    ]
  },

  {
    id: 5,
    label: "Day 5",
    title: "How the models actually work",
    kicker: "Internals · 3 h",
    mission: "Explain GQA, sliding windows, sparse MoE and KV-cache economics with numbers, and implement the one thing they ask you to implement.",
    chips: ["3 hours", "Lab: GQA + cache math", "Interview signal: depth"],
    intro: [
      "A dedicated LLM deep-dive is reported in Mistral loops, and it is not trivia: they ask about the architectural choices their own papers introduced, because those choices are the product. Grouped-query attention, sliding-window attention and sparse mixture-of-experts are why a Mistral model can be cheap to serve, and an applied engineer who can price that is more useful than one who cannot.",
      "You do not need to train anything. You need to be able to implement multi-head attention with grouped KV heads, compute a KV cache, and reason about memory versus FLOPs at batch scale."
    ],
    blocks: [
      { time: "0:00", label: "Attention variants", task: "MHA vs MQA vs GQA: what is shared, what is saved, what it costs in quality. Then RoPE and why it is applied to queries and keys only." },
      { time: "0:35", label: "Sliding-window attention", task: "Compute per token becomes O(W); the rolling-buffer cache caps memory at W per sequence. Know the receptive-field argument." },
      { time: "1:00", label: "Lab: implement GQA", task: "PyTorch, causal mask, grouped KV heads, and a shape test that proves MHA and MQA are special cases." },
      { time: "1:45", label: "Sparse MoE economics", task: "Active versus total parameters; why quality-per-FLOP improves but memory does not; load balancing; expert parallelism." },
      { time: "2:15", label: "Serving math", task: "KV cache per token, concurrent sequences per GPU, continuous batching, paged attention, quantization, speculative decoding." }
    ],
    concepts: [
      {
        title: "GQA and sliding windows: two different bills",
        body: [
          "Multi-head attention keeps one key/value head per query head; multi-query attention keeps a single KV head for all queries; grouped-query attention keeps a small number of KV heads, each serving a group of query heads. Mistral 7B shipped 32 query heads with 8 KV heads — a 4× reduction in KV-cache size and bandwidth at inference, with empirically negligible quality loss at that ratio.",
          "The KV cache is the thing being attacked. Per token it costs <code>2 × layers × kv_heads × head_dim × bytes</code>. For a 32-layer model with 8 KV heads, head dim 128, fp16: 2 × 32 × 8 × 128 × 2 = <strong>131,072 bytes ≈ 128 KiB per token</strong>. A 4k-token sequence is ~512 MiB; thirty of them exceed the weights. At realistic concurrency, <em>cache, not weights, is the capacity constraint</em> — which is why GQA, paged attention and cache-aware schedulers exist.",
          "Sliding-window attention bounds compute per token to the window W instead of the full prefix, and caps cache memory at W per layer with a ring buffer. Information still travels further than W because receptive fields stack across layers (roughly W × L positions), but exact long-range recall degrades — which is why later models mix windowed and full-attention layers when long-context recall matters."
        ],
        probe: "Expect the follow-up: “Why does KV-cache bandwidth, not FLOPs, dominate decode latency?”"
      },
      {
        title: "Sparse MoE: quality per FLOP, not per gigabyte",
        body: [
          "In a Mixtral-style block the attention is ordinary and each FFN is replaced by N expert FFNs plus a router. For every token, the router scores the experts, picks the top k, and the output is the weighted sum of those experts. Mixtral 8x7B stores ~47B parameters but executes ~13B per token, so decode feels like a 13B dense model while quality draws on a much larger pool.",
          "The asymmetry is the interview point: <strong>FLOPs scale with active parameters, memory scales with total parameters</strong>. You must hold every expert in memory (or shuffle them, which destroys latency). For a current large sparse model — Mistral Large 3 is roughly 41B active and 675B total — BF16 weights are about 1.35 TB, FP8 about 675 GB, and a 4-bit checkpoint roughly 350–400 GB. That single calculation decides whether a customer's 8-GPU node can host it at all.",
          "Training adds load-balancing losses (routers collapse onto favourite experts otherwise), non-differentiable top-k routing, and all-to-all communication for expert parallelism. Serving adds per-step imbalance: at batch size 1 a token touches few experts; at realistic batch sizes most of the pool is touched each step, so the byte traffic approaches the full footprint amortised across the batch. A hot expert becomes a straggler."
        ],
        probe: "“Does 675B parameters fit on 8×H100 80 GB?” — 640 GB total, so no at BF16, no at FP8, yes at 4-bit with headroom for cache."
      },
      {
        title: "The serving vocabulary you must not fumble",
        body: [
          "<ul><li><strong>TTFT</strong> (time to first token) — dominated by prefill and queueing; the number users feel when they click.</li><li><strong>ITL/TPOT</strong> (inter-token latency) — dominated by decode bandwidth per step.</li><li><strong>Continuous batching</strong> — reschedule at every decode step so finished sequences leave and queued ones join immediately; throughput rises several-fold on mixed-length traffic, at the cost of TTFT jitter for streams already running.</li><li><strong>Paged attention</strong> — KV cache in fixed-size blocks instead of contiguous per-sequence allocation; makes admission cheap and fragmentation small.</li><li><strong>Quantization</strong> — decode is bandwidth-bound, so weight-only int4 speeds decode and shrinks the footprint; fp8 on Hopper-class hardware is close to lossless with tensor-core gains. Quantization damage is task-uneven: measure on the customer's golden set, not on perplexity alone.</li><li><strong>Speculative decoding</strong> — a small draft model proposes tokens, the large model verifies in one pass; wins when acceptance is high and the draft is cheap.</li></ul>",
          "A candidate who can say “throughput and p95 TTFT fight each other, and I would tune chunked prefill and admission policy rather than batch size” sounds like someone who has run a service."
        ],
        probe: "“Your p95 latency doubled at 3 pm. What are the first three things you check?” — queue depth/batching, cache pressure and preemption, input length distribution."
      }
    ],
    lab: {
      title: "Implement GQA, then price a KV cache",
      goal: "Write grouped-query attention from scratch, prove the special cases, and compute the concurrency a given GPU can actually support.",
      steps: [
        "Implement scaled dot-product attention with a causal mask, then parameterise the number of KV heads.",
        "Assert shapes for MHA (kv_heads = heads), GQA (kv_heads < heads) and MQA (kv_heads = 1).",
        "Write a KV-cache calculator that takes layers, kv heads, head dim, dtype and sequence length and returns GiB.",
        "Use it to answer: how many concurrent 4k-token conversations fit on one 80 GB GPU alongside a 24B model at fp8?",
        "Optional, if you have the hardware: install llama.cpp, pull a Ministral 3 GGUF, and record tokens/sec at two quantisation levels.",
        "Write five sentences on when you would recommend a dense model over a sparse MoE to a customer with limited VRAM."
      ],
      code: [
        {
          lang: "python",
          name: "05_gqa.py",
          src: `import torch, torch.nn.functional as F

def attention(x, wq, wk, wv, wo, n_heads, n_kv_heads, causal=True):
    """x: (B, T, D). Returns (B, T, D). n_kv_heads <= n_heads."""
    B, T, D = x.shape
    assert D % n_heads == 0
    hd = D // n_heads
    q = (x @ wq).view(B, T, n_heads, hd).transpose(1, 2)      # B, H,  T, hd
    k = (x @ wk).view(B, T, n_kv_heads, hd).transpose(1, 2)   # B, Hkv,T, hd
    v = (x @ wv).view(B, T, n_kv_heads, hd).transpose(1, 2)
    rep = n_heads // n_kv_heads
    k = k.repeat_interleave(rep, dim=1)                        # teaching only: copies
    v = v.repeat_interleave(rep, dim=1)
    att = (q @ k.transpose(-2, -1)) / hd ** 0.5
    if causal:
        mask = torch.triu(torch.ones(T, T, dtype=torch.bool, device=x.device), 1)
        att = att.masked_fill(mask, float("-inf"))
    out = F.softmax(att, dim=-1) @ v                            # B, H, T, hd
    return out.transpose(1, 2).reshape(B, T, D) @ wo

def kv_cache_gib(layers, kv_heads, head_dim, seq_len, batch=1, bytes_per=2):
    per_token = 2 * layers * kv_heads * head_dim * bytes_per
    return per_token * seq_len * batch / 1024 ** 3

if __name__ == "__main__":
    torch.manual_seed(0)
    B, T, D, H = 2, 16, 128, 8
    x = torch.randn(B, T, D)
    W = lambda: torch.randn(D, D, requires_grad=False)
    for kvh in (8, 2, 1):
        out = attention(x, W(), W(), W(), W(), H, kvh)
        assert out.shape == (B, T, D)
        print(f"heads={H} kv_heads={kvh}: ok {tuple(out.shape)}")

    for name, cfg in {"7B-like": (32, 8, 128), "24B-like": (40, 8, 128)}.items():
        per_tok = 2 * cfg[0] * cfg[1] * cfg[2] * 2
        print(f"{name}: {per_tok/1024:.0f} KiB/token, 4k seq = {kv_cache_gib(*cfg, 4096):.2f} GiB")
`
        }
      ],
      verify: "All three head configurations return the right shape and differ in parameter count only in the K/V projections. Your KV table shows ~128 KiB/token for the 7B-like config and lets you state a concurrency number for an 80 GB card in one breath.",
      pitfalls: "`repeat_interleave` materialises KV copies — fine for teaching, wrong for production; real kernels index instead, and real code uses `F.scaled_dot_product_attention`. Scaling is by head dim, not model dim. The causal mask must exclude strictly-future positions (diagonal=1), not the diagonal itself."
    },
    questionIds: ["q23", "q24", "q25", "q26", "q27", "q28"],
    deliverable: "A GQA implementation with assertions, a KV-cache table, and a one-paragraph recommendation memo for a VRAM-constrained customer.",
    checklist: [
      "Can implement causal attention with grouped KV heads",
      "Can compute KV cache per token from a config, out loud",
      "Can explain MoE active vs total parameters with a memory number",
      "Can explain continuous batching's throughput/latency trade-off",
      "Can state when to pick int4, fp8, or keep bf16",
      "Has an opinion on dense vs sparse for a constrained customer"
    ]
  },

  {
    id: 6,
    label: "Day 6",
    title: "System design under real constraints",
    kicker: "Architecture · 6 h",
    mission: "Two timed designs, one framework, and a cost model you can defend line by line.",
    chips: ["6 hours", "Two 45-min designs", "Interview signal: structure"],
    intro: [
      "Applied system design is not “draw boxes until the interviewer nods”. It is requirements, workload arithmetic, a topology that satisfies the constraints, a quality plan, and an operations story — in that order, with numbers as you go.",
      "Today you learn one framework well enough to run it under pressure, then use it twice on the two prompts most likely to appear."
    ],
    blocks: [
      { time: "0:00", label: "The eight steps", task: "Memorise the framework below. Then re-read the two worked designs and mark where each step appears." },
      { time: "1:00", label: "Design 1, timed 45 min", task: "EU bank document assistant. Requirements, numbers, topology, quality, ops — on paper, no notes." },
      { time: "1:45", label: "Review against the rubric", task: "Score yourself on the six rubric lines. Note what you skipped under time pressure." },
      { time: "2:15", label: "Design 2, timed 45 min", task: "Multi-tenant agent platform with human-in-the-loop approvals." },
      { time: "3:00", label: "Break", task: "Actually stop. Two designs back to back is the point; a third while tired teaches nothing." },
      { time: "3:30", label: "Cost model worksheet", task: "Build a spreadsheet: requests/day × tokens × price, plus batch share, cache hit rate, retries, eval cost." },
      { time: "4:30", label: "Red flags rehearsal", task: "Say out loud the five things you must never propose without a measurement plan." }
    ],
    concepts: [
      {
        title: "The eight-step framework",
        body: [
          "<ol><li><strong>Restate the job.</strong> Who uses it, what decision does it improve, what does failure cost? One sentence each.</li><li><strong>Requirements and constraints.</strong> Volume, concurrency, latency budget, languages, data residency, accuracy floor, budget ceiling, existing stack, timeline.</li><li><strong>Workload arithmetic.</strong> Requests/day → peak QPS → tokens per request → cost per request → GPU or API capacity. Do this before drawing anything.</li><li><strong>Topology.</strong> Where inference runs (hosted global/regional, VPC, on-prem), where data lives, what crosses the boundary.</li><li><strong>Quality architecture.</strong> Ingestion, retrieval, model choice, prompting, structured output, citations, refusal policy.</li><li><strong>Failure and safety.</strong> Timeouts, retries with backoff, fallbacks, idempotency, human-in-the-loop, moderation, prompt-injection handling, audit trail.</li><li><strong>Evaluation and release.</strong> Golden set, judges, gates, canary, pinned versions, rollback.</li><li><strong>Operations and handover.</strong> Monitoring, cost alerts, on-call, documentation, what the customer's team owns after you leave.</li></ol>",
          "Steps 3 and 7 are where most candidates lose the room. Everything else is drawable."
        ],
        probe: "If you only have 20 minutes, do 1, 2, 3, 4 and 7 — the rest you can narrate."
      },
      {
        title: "Design 1 — EU bank document assistant (worked answer)",
        body: [
          "<strong>Job.</strong> 400 credit analysts ask questions across 120k internal policy and product PDFs; wrong answers create regulatory exposure, so every answer must cite a page and an analyst must be able to audit it.",
          "<strong>Constraints.</strong> Data must be processed in the EU; documents never leave the bank's tenancy; p95 answer latency under 6 s; 900 questions/day with a 10× Monday peak; French, Dutch and English; SOC-style audit trail.",
          "<strong>Arithmetic.</strong> 900/day ≈ 0.01 QPS average, 0.1 QPS peak — trivial compute, so the binding constraints are residency, auditability and quality, not throughput. Ingestion is the heavy job: 120k PDFs, say 40 pages each = 4.8M pages. At OCR list pricing around 4 USD per 1,000 pages that is roughly 19k USD one-off, which is a line item worth naming; incremental re-ingestion is the recurring cost.",
          "<strong>Topology.</strong> Regional EU endpoint for inference with function calling only — remember Agents, Batch and Files are not available on regional endpoints, so the orchestration layer is the bank's own service (FastAPI) and the stateful conveniences are rebuilt there. If the bank demands zero egress, the same architecture on open weights inside their VPC, with vLLM or an enterprise serving stack, and self-hosted embeddings.",
          "<strong>Quality.</strong> OCR 4.1 with blocks and table extraction; structure-aware chunking; hybrid retrieval with a reranker; answers must cite block ids; hard refusal when retrieval confidence is low; a per-department eval set built from real analyst questions, gated per release.",
          "<strong>Failure and safety.</strong> Low-confidence OCR pages and low-recall queries route to a human reviewer queue; prompt-injection defence because documents are untrusted input; every request logged with prompt hash, retrieved ids, model version, and answer — that log is the audit artefact and the eval source.",
          "<strong>Ops and handover.</strong> Pin model ids; re-run the eval suite on any change; monitor refusal rate, citation validity, and answer latency; document the re-ingestion procedure; train two bank engineers to own the index."
        ],
        probe: "The follow-up is almost always money or residency. Have both numbers ready."
      },
      {
        title: "Design 2 — multi-tenant agent platform with approvals (worked answer)",
        body: [
          "<strong>Job.</strong> A SaaS vendor wants each customer to configure an agent that can read their CRM, draft replies, and — with human approval — issue refunds up to a limit.",
          "<strong>Constraints.</strong> 5k tenants, 200k conversations/day, p95 first token under 1.2 s, per-tenant isolation and quotas, irreversible actions gated, full audit, sub-cent unit economics for the free tier.",
          "<strong>Arithmetic.</strong> 200k/day ≈ 2.3 QPS average, ~20 QPS peak; at 1.5k input and 250 output tokens per turn with a mid-tier model, cost per turn lands in the low fractions of a cent — so context discipline (retrieval and cache) decides whether the free tier is viable, not model choice alone.",
          "<strong>Topology.</strong> One inference tier behind a gateway that enforces tenant identity, quota and logging; per-tenant tool registry, credentials and retrieval index; durable orchestration for anything that waits on a human — that is a Workflows-shaped problem, not an agent-shaped one.",
          "<strong>Quality.</strong> Per-step tool validation, idempotency keys on writes, approval gates that are enforced by the platform (never by the prompt), tenant-scoped retrieval, and refusal paths that hand back to a human.",
          "<strong>Failure and safety.</strong> Hard iteration and spend caps per conversation; degraded mode when the CRM is down (draft only, no writes); replayable traces; per-tenant kill switch; prompt-injection isolation between tenant data and tenant instructions.",
          "<strong>Eval and release.</strong> A shared capability suite plus per-tenant smoke cases; per-step tool-call validity and end-to-end task success; canary by tenant cohort; model upgrades gated on both.",
          "<strong>Ops.</strong> Cost attribution per tenant, noisy-neighbour alarms, trace retention policy, and a documented handover of the runbook."
        ],
        probe: "The trap: proposing an agent loop for a process that needs durable, resumable, human-gated execution."
      }
    ],
    lab: {
      title: "Two designs, one rubric",
      goal: "Practise the framework under time pressure twice, then score yourself against the same six lines an interviewer would use.",
      steps: [
        "Set a 45-minute timer. Prompt: “Design the EU bank document assistant.” Whiteboard or paper only, no docs.",
        "At 45 minutes, stop mid-sentence. Score: requirements with numbers, workload arithmetic, topology and data boundary, quality plan, failure/safety, eval and handover.",
        "Take a 15-minute break, then repeat with the multi-tenant agent platform.",
        "For each design, write the three questions you would ask the customer before building, and the one thing you would refuse to promise.",
        "Build the cost worksheet for design 2: turns/day, tokens, price, cache hit rate, batch share for non-interactive work, eval overhead, retries.",
        "Record a 3-minute spoken summary of design 1. Listen back once. Cut filler."
      ],
      code: [
        {
          lang: "text",
          name: "cost_model.txt",
          src: `COST MODEL — fill every cell, name every assumption
requests/day            = 200000
turns/request           = 3
input tokens/turn       = 1500   (context + history + retrieved)
output tokens/turn      = 250
input price / 1M        = ___    (from pricing page, dated)
output price / 1M       = ___
cache hit rate on input = 0.6    (stable system prefix)
cached input price      = ___    (discount per docs)

daily_input_cost  = requests/day * turns * input_tokens  / 1e6 * price * (1 - hit*(1-cached/price))
daily_output_cost = requests/day * turns * output_tokens / 1e6 * price
retry_overhead    = 0.03         (measured, not guessed)
eval_overhead     = runs/week * cases * avg_tokens / 1e6 * price

Ask of every assumption: measured, estimated, or inherited?`
        }
      ],
      verify: "Two complete designs on paper with numbers in four places each, a filled cost worksheet, and a self-score where every line has a specific gap written next to it.",
      pitfalls: "Do not start drawing before the arithmetic. Do not propose a multi-agent swarm to solve a retrieval problem. Do not skip the handover step — applied roles are judged on whether the customer can run it after you leave."
    },
    questionIds: ["q29", "q30", "q31", "q6"],
    deliverable: "Two one-page designs with numbers, six self-scores, and a cost worksheet with assumptions labelled measured/estimated/inherited.",
    checklist: [
      "Framework reproduced from memory in order",
      "Both designs contain workload arithmetic",
      "Residency and data-boundary decisions named explicitly",
      "Failure modes and human-in-the-loop designed, not hand-waved",
      "Eval gate present in both designs",
      "Cost worksheet filled with labelled assumptions",
      "Three customer questions and one refusal written per design"
    ]
  },

  {
    id: 7,
    label: "Day 7",
    title: "Full mock loop and the human round",
    kicker: "Rehearsal · 6 h",
    mission: "Do the loop once, end to end, under time. Then fix the two weakest moments instead of rereading everything.",
    chips: ["6 hours", "Three timed mocks", "Interview signal: all four"],
    intro: [
      "You will not learn anything new today, and that is the design. Today is about retrieval under pressure: which story you reach for, how you open a coding answer, how you say “I don't know” without losing the room.",
      "Do the mocks out loud, standing if you can. Reading answers silently builds recognition, not recall."
    ],
    blocks: [
      { time: "0:00", label: "Mock 1 — 60 min coding screen", task: "Refactor exercise below. Talk while you work. Write one test before you change behaviour." },
      { time: "1:10", label: "Self-review", task: "Did you read the code before editing? Did you name the seam? Did you leave it runnable?" },
      { time: "1:30", label: "Mock 2 — 60 min pair programming", task: "Build a service against the Mistral API plus one third-party API, with an interviewer persona asking “why” every three minutes." },
      { time: "2:40", label: "Mock 3 — 45 min system design", task: "Pick the design you scored worse on. Redo it without notes." },
      { time: "3:30", label: "Break", task: "Walk. No screens." },
      { time: "4:00", label: "Human round", task: "Three stories, five values, why Mistral, why open weights, and the questions you will ask them." },
      { time: "5:00", label: "Fix the weakest two", task: "Re-record only the two worst answers. Stop." },
      { time: "5:30", label: "Logistics", task: "Environment check, time zones, backup internet, a one-page cheat sheet you are allowed to glance at." }
    ],
    concepts: [
      {
        title: "The coding screen is a refactor, not a puzzle",
        body: [
          "Reported applied screens involve reading unfamiliar code, improving it, and integrating against a real API. The behaviours being scored are: do you read before typing, do you name the design problem, do you keep the code runnable, do you write the test that proves the change, do you narrate trade-offs without rambling.",
          "A reliable opening: “Let me restate what this does, then I will name two smells, then I will propose the smallest change that fixes the one that matters. I will add a test first so we can see the behaviour is preserved.” That single sentence buys you structure for the next fifty minutes.",
          "For the pair-programming variant: define the interface before the implementation, isolate the third-party call behind a seam you can mock, make prompt construction a pure function, bound retries, and log the trace. Say each of those out loud as you do it — the interviewer cannot grade a decision you made silently."
        ],
        probe: "If you finish early, the right move is tests and error paths, not new features."
      },
      {
        title: "The human round is a technical round with different evidence",
        body: [
          "Their published values are audacity, rigour, customer centricity, speed and low ego. Map one story to each and do not tell the same story twice. Rigour is the eval story. Customer centricity is the story where you changed the design because of what a user actually did. Speed is a story where you shipped something narrow and correct in days. Audacity is a decision that was uncomfortable and right. Low ego is the story where someone else's idea won.",
          "Prepare substantive answers to two questions: why open weights matter (sovereignty, cost control, customisation, no lock-in, on-prem for regulated customers — and the trade-off: you own the operations) and why Mistral rather than a larger US lab (European footprint and data residency, small teams with real ownership, shipping product and weights together).",
          "Then have four questions for them that prove you understand the job: how is an Applied AI engagement scoped and when does it become a product feature; what does handover look like for a customer without ML engineers; how do you decide between Libraries, a custom retrieval stack, and fine-tuning today; what does success look like at 6 and 12 months for this role."
        ],
        probe: "They are also checking whether you will be pleasant to have on a customer call. Direct, warm, no theatre."
      },
      {
        title: "The last 24 hours",
        body: [
          "Re-read your own three stories and the two designs, not the docs. Sleep. Eat. Check the video link, the time zone, and that your microphone works. Keep one page: the eight-step framework, the KV-cache formula, the tier multipliers, and three numbers from your own projects.",
          "In the interview, when you do not know something, say what you do know and how you would find out in an hour. That is the actual job — nobody at Mistral expects you to have memorised the current model matrix, they expect you to build a correct system quickly and be honest about the edges."
        ],
        probe: "Vagueness is the only real failure mode left by day seven."
      }
    ],
    lab: {
      title: "The three timed mocks",
      goal: "Produce evidence of the loop rather than a feeling about it: a recording, a refactored file with a test, a design on one page, and a scored rubric.",
      steps: [
        "Mock 1: refactor the function below. It calls a model per item, has no retries, and swallows errors. Make it batched, bounded, and testable.",
        "Write the test first: assert that a failing batch does not lose successful items.",
        "Mock 2: record yourself building the pair-programming service for 60 minutes, with an interviewer persona. Watch 10 minutes back.",
        "Mock 3: redo your weaker design in 45 minutes on one page.",
        "Human round: record 90 seconds each for “tell me about yourself”, “why Mistral”, “why open weights”, and one failure story.",
        "Score everything against the rubric, then re-record only the two lowest-scoring items."
      ],
      code: [
        {
          lang: "python",
          name: "06_refactor_me.py",
          src: `# Refactor task: this works, badly. Keep the behaviour, fix the engineering.
import os
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

def classify_all(items):
    out = []
    for item in items:
        try:
            r = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": f"Classify: {item}"}],
            )
            out.append(r.choices[0].message.content)
        except Exception:
            out.append(None)
    return out

# What an interviewer is listening for:
#  1. one request per item -> batch or concurrency, and a cost argument
#  2. no schema -> structured output with a fixed label set
#  3. swallowed exceptions -> typed errors, bounded retries, partial success
#  4. untestable -> inject the client, make the prompt a pure function
#  5. no observability -> log id, latency, tokens, failure reason
`
        },
        {
          lang: "text",
          name: "rubric.txt",
          src: `MOCK RUBRIC — score 0/1/2 per line, 12 total

1. Requirements before solution (asked or stated constraints, with numbers)
2. Arithmetic (tokens, cost, latency, concurrency — at least three)
3. Structure (framework visible; signposted transitions)
4. Depth where it matters (retrieval quality, eval gate, failure modes)
5. Code craft (reads first, tests, bounded retries, typed errors, runnable)
6. Communication (no filler, admits gaps, lands the answer)

Below 8: do not book the interview yet — repeat the weakest two mocks.
8-10: ready. 11-12: ready, and stop over-preparing.`
        }
      ],
      verify: "You have a recording of each mock, a refactored file that runs with a passing test, a one-page design, four recorded 90-second answers, and a rubric score out of 12 with two concrete fixes applied.",
      pitfalls: "Do not do a fourth mock instead of sleeping. Do not memorise answers word for word — the interviewer will ask a follow-up and the script collapses. Do not skip the “questions for us” section; it is scored as engagement."
    },
    questionIds: ["q32", "q33", "q34", "q35", "q36", "q37", "q38"],
    deliverable: "A scored rubric, three mock recordings, a refactor with tests, and a one-page day-of cheat sheet.",
    checklist: [
      "Three mocks done under time, out loud",
      "Refactor includes a test and a batching decision",
      "One-page design redrawn from memory",
      "Four 90-second answers recorded and reviewed",
      "Rubric scored out of 12",
      "Two weakest answers re-recorded",
      "Four questions for the interviewer written",
      "Logistics checked: link, time zone, mic, cheat sheet"
    ]
  }
];
