/* Days 0–3. Content is loaded as plain JS so the site also works from file:// */

window.DAYS_A = [
  {
    id: 0,
    label: "Day 0",
    title: "Baseline, workspace, and the shape of the loop",
    kicker: "Setup · 1.5 h",
    mission: "Stop guessing what the interview tests. Get a working Mistral client, a repo, and four honest sentences about where you are weak.",
    chips: ["90 minutes", "No studying yet", "Workspace only"],
    intro: [
      "This sprint assumes roughly <strong>3 focused hours on weekdays and 6 on the weekend</strong> — about 27 hours. If your loop is sooner, compress by dropping Day 5's optional local-model run and doing one design case instead of two on Day 6. Do not skip Day 4 (evaluation); it is the single most differentiating topic for an applied role.",
      "The loop you are preparing for, synthesised from public job descriptions and candidate reports, looks like this: a recruiter conversation, then <strong>2–5 technical exercises</strong> (a live coding or refactoring screen, a pair-programming exercise against the Mistral API plus a third-party API, an LLM deep-dive, a system design), then a project/culture conversation, then references. Applied-track reports consistently say the coding rounds are <em>code craft with real APIs</em>, not LeetCode marathons."
    ],
    blocks: [
      { time: "0:00", label: "Read the two primary sources", task: "The Applied AI job description on jobs.ashbyhq.com/mistral.ai, and docs.mistral.ai/studio (the product map). 20 minutes, no note-taking beyond three questions each." },
      { time: "0:20", label: "Workspace + first real call", task: "Lab below. You should end with a green call, a token count, and the model list." },
      { time: "0:55", label: "Baseline diagnostic", task: "Answer the six questions in the diagnostic card without looking anything up. Score yourself 0/1/2. That score decides where you spend Day 5." },
      { time: "1:20", label: "Write the three stories", task: "Pick three projects you will reuse all week: one systems/scaling, one quality/evaluation, one customer or stakeholder. One line each plus a number." }
    ],
    concepts: [
      {
        title: "What the role actually is",
        body: [
          "Applied AI at Mistral is the customer-facing technical organisation: pre-sales scoping, then owning delivery of a production system on top of Mistral models, then handing over something that keeps working. The job description asks for a full-stack engineer (Python/FastAPI backend, enough React to ship a usable surface), hands-on RAG/agents/evaluation, and the judgement to say no to fine-tuning when retrieval is the right answer.",
          "In an interview this translates into four signals, in roughly this order: <strong>can you build</strong>, <strong>can you diagnose quality</strong>, <strong>can you reason about cost and latency at scale</strong>, and <strong>can you hold a room with a non-technical stakeholder</strong>. Everything in this sprint maps to one of those four."
        ],
        probe: "If you can name which signal a question is testing, you can answer it in the right register."
      },
      {
        title: "The 2026 product surface you must be able to sketch from memory",
        body: [
          "<ul><li><strong>Inference &amp; models</strong> — hosted API (global, EU and US regional endpoints), open weights, batch inference, priority tier.</li><li><strong>Conversations</strong> — chat completions with structured outputs, function calling, vision, citations, prompt caching, predicted outputs.</li><li><strong>Agents</strong> — reusable model + instructions + tools objects, with built-in web search, code interpreter, image generation and document library tools, plus handoffs between agents.</li><li><strong>Knowledge</strong> — OCR and document annotations, Embeddings, Libraries (managed RAG), Search Toolkit (your own ingestion/retrieval stack), Connectors (Drive, MCP).</li><li><strong>Production</strong> — Workflows (durable execution), Observability (traces, datasets, evaluations, judges), moderation and guardrails, Admin API.</li><li><strong>Developer surfaces</strong> — Studio console, Vibe (CLI/IDE/web coding agent), SDKs, cookbook.</li></ul>",
          "You do not need to have used all of it. You do need to place a customer problem on this map in ten seconds — <em>“that is a Libraries job with OCR 4.1 upstream and an evaluation gate before launch”</em> — because that is the move the interviewer is watching for."
        ],
        probe: "Whiteboard test: draw the six boxes above and say what each one replaces in a hand-rolled stack."
      },
      {
        title: "What “good” looks like in the room",
        body: [
          "Applied candidates get rejected for two things more than any other: <strong>not being fluent with APIs</strong> (fighting the SDK, not reading error payloads, no retries) and <strong>proposing fine-tuning without an evaluation set</strong>. Both are habits, and both are fixable in a week.",
          "The other habit worth installing now: every technical claim you make should carry a number, a constraint, or a trade-off. “We used RAG” is junior. “2,000 pages, OCR at about 4 USD per 1,000 pages, text-embedding-3-class retrieval hit@5 of 0.86, p95 first token 900 ms on Medium, cost about 0.4 cents per answer” is the register they hire."
        ],
        probe: "Rehearse a 90-second answer to “walk me through your most technically complex project” that contains three numbers."
      }
    ],
    lab: {
      title: "Green call, model list, and a repo you will keep using",
      goal: "By the end you have an isolated Python 3.12 environment, a working `mistralai` 3.5 client, a cost-and-token readout, and a git repo that will hold every lab this week.",
      steps: [
        "Create the project and an isolated environment. Use <code>uv</code> if you have it; a plain venv is fine.",
        "Install the current SDK. The import path moved: it is <code>from mistralai.client import Mistral</code> in the 3.x line, not <code>from mistralai import Mistral</code>.",
        "Create an API key in Studio and export it. Never commit it — add <code>.env</code> to <code>.gitignore</code> on the first commit.",
        "Run the script below. You should see the reply, the token usage object, and a list of model ids.",
        "Clone the cookbook and note three notebooks you will use later this week: <code>mistral/rag/basic_RAG.ipynb</code>, <code>mistral/evaluation/RAG_evaluation.ipynb</code>, <code>mistral/ocr/documentChunking/document_chunking_cookbook.ipynb</code>."
      ],
      code: [
        {
          lang: "bash",
          name: "setup.sh",
          src: `mkdir -p ~/mistral-sprint-labs && cd ~/mistral-sprint-labs
git init -q
printf ".env\\n.venv/\\n__pycache__/\\n*.pyc\\n" > .gitignore

uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install "mistralai==3.5.0"

echo 'MISTRAL_API_KEY=your-key-here' > .env
export MISTRAL_API_KEY="$(grep -o 'MISTRAL_API_KEY=.*' .env | cut -d= -f2-)"

git clone --depth 1 https://github.com/mistralai/cookbook.git cookbook`
        },
        {
          lang: "python",
          name: "00_smoke.py",
          src: `import os
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

resp = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": "Reply with exactly one word: ready"}],
    temperature=0,
    max_tokens=8,
)
print("reply:", resp.choices[0].message.content)
print("usage:", resp.usage)

models = client.models.list().data
print(f"{len(models)} models available; first ten:")
for m in models[:10]:
    print(" -", m.id)
`
        }
      ],
      verify: "The script prints a reply, a usage object with prompt/completion/total tokens, and at least ten model ids. Save the usage numbers — you will reuse them as your cost baseline.",
      pitfalls: "If you get a 401, the key is not in the environment of the process (a new shell or a backgrounded process is the usual culprit). If you get an import error, you are on SDK 2.x or the wrong import path. If the reply is not exactly “ready”, that is fine — small models ignore instructions at temperature 0 occasionally; note it, it is a real production lesson."
    },
    diagnostic: [
      "Estimate the KV-cache size per token for a 32-layer model with 8 KV heads, head dim 128, fp16. (Target: 128 KiB.)",
      "A customer has 2,000 PDFs and wants a Q&A assistant. Do you fine-tune or build RAG, and what do you measure first?",
      "Explain the difference between the Chat Completions API, the Agents API and Workflows, in one sentence each.",
      "What is the difference between time-to-first-token and inter-token latency, and which one does batching hurt?",
      "Your RAG system answers 80% of a 50-question golden set correctly. Name two changes you would try before touching the model.",
      "Why would an EU bank insist on a regional endpoint, and what does that cost?"
    ],
    questionIds: ["q37", "q2", "q35"],
    deliverable: "A repo with a passing smoke test, a written baseline score out of 12, and three story headlines.",
    checklist: [
      "Isolated env on Python 3.12 with mistralai 3.5",
      "First successful chat completion with usage printed",
      "API key out of git (verified with git status)",
      "Cookbook cloned, three notebooks identified",
      "Baseline diagnostic scored out of 12",
      "Three project stories written, each with a number",
      "Interview date written down, day plan adjusted to it"
    ]
  },

  {
    id: 1,
    label: "Day 1",
    title: "The platform, priced and timed",
    kicker: "Surface · 3 h",
    mission: "Be able to choose a model, a service tier and an endpoint for a workload — and defend the choice with tokens, euros and milliseconds.",
    chips: ["3 hours", "Lab: cost-aware router", "Interview signal: economics"],
    intro: [
      "Most candidates can name models. Few can say what the choice costs. Applied AI engineers are asked to make a customer's bill and latency envelope work, so model selection is a financial and architectural decision, not a benchmark lookup.",
      "Today is about the whole hosted surface: which model, which tier, which region, which endpoint — and what each of those decisions does to the invoice and to p95."
    ],
    blocks: [
      { time: "0:00", label: "Model lineup, cold", task: "Read the current model list on docs.mistral.ai. Write the lineup from memory: generalist, small/dense, code, OCR, audio, embeddings, moderation. Note the alias pattern (‑latest) versus dated ids." },
      { time: "0:40", label: "Tiers, regions, and what they cost", task: "Batch, standard, priority; global, EU, US endpoints. Write the multipliers on a card: batch discount, regional upcharge, priority multiplier, cached-input discount." },
      { time: "1:10", label: "Lab: cost-aware router", task: "Build a tiny router that picks a model per request, estimates cost before the call, and reconciles against returned usage after it." },
      { time: "2:10", label: "Tokenisation and sampling", task: "Read the prompting and sampling docs. Run the same prompt at temperature 0, 0.7 and 1.2 and record the divergence." },
      { time: "2:40", label: "Rehearse", task: "Answer four questions out loud, timed at 2 minutes each." }
    ],
    concepts: [
      {
        title: "The lineup, and how to talk about it",
        body: [
          "Mistral ships a family, not a single model: a frontier multimodal generalist (<code>mistral-large-latest</code>, and the newer Large 4 preview), a mid-tier workhorse (<code>mistral-medium-latest</code>), a small hybrid instruct/reasoning model (<code>mistral-small-latest</code>), dense small models for edge and cost (<code>ministral-*-latest</code>), plus specialists: OCR, Voxtral for speech, Codestral and Devstral for code, Mistral Embed and Codestral Embed, and a moderation model.",
          "Two facts matter more than the list. First, <strong>open weights</strong>: the small and large families are published under permissive licences, so a customer can self-host, fine-tune, or run air-gapped. Second, <strong>aliases move</strong>: <code>-latest</code> is convenient in development and dangerous in production — pin a dated id when a customer's evaluation has signed off on it, and treat an alias bump as a model change that needs a re-run of the eval set.",
          "A good answer to “which model?” names the constraint first — cost per thousand requests, p95 latency, context length, language coverage, or data residency — then picks the smallest model that clears the quality bar on a measured set, with a router for the hard tail."
        ],
        probe: "Expect: “You have 200k requests a day of short classification. Which model, and what does a day cost?”"
      },
      {
        title: "Service tiers are architectural choices",
        body: [
          "The same model behaves differently depending on how you buy it.",
          "<ul><li><strong>Batch</strong> — asynchronous, JSONL in and out, processed over a window (24 h default timeout), commonly around <strong>half the price</strong> of standard. The right answer for backfills, nightly enrichment, document processing, offline evals. Wrong answer for anything a user waits on.</li><li><strong>Standard</strong> — best-effort routing, seconds to minutes.</li><li><strong>Priority</strong> — a priority queue for entitled orgs, with an SLA in the high nineties and a <strong>1.75× list-price multiplier</strong>, still eligible for prompt-cache discounts. This is how you buy predictability for a business-critical path.</li><li><strong>Regional</strong> — <code>api.eu.mistral.ai</code> or <code>api.us.mistral.ai</code>, processing inside that geography at <strong>1.1× list price</strong>. The control plane is still global, and stateful features (Agents, Batch, Files) are not available on regional endpoints — a detail that trips people up in design interviews.</li></ul>",
          "The mature answer is a portfolio: batch for the 80% that is not interactive, standard for user-facing, priority only for the revenue-critical slice, regional where the contract demands it."
        ],
        probe: "Follow-up they like: “What is not available on a regional endpoint?” — Agents, Batch, Files."
      },
      {
        title: "Tokens, sampling, and prompt caching",
        body: [
          "Cost is dominated by input tokens at scale, and input tokens are dominated by context you did not need. Three levers, in order of impact: cut the context (retrieve less, summarise history), cache the stable prefix (long system prompts and instructions are billed at a large discount when cached), and shrink the output (structured outputs that emit only what changed).",
          "Sampling is not a personality dial. <code>temperature</code> and <code>top_p</code> change the distribution; for extraction and classification use temperature 0 and a schema, and treat any remaining variance as a bug to be measured, not a prompt to be reworded. For creative work, temperature alone with a fixed <code>top_p</code> is easier to reason about than moving both.",
          "Prompt caching and predicted outputs are the two features candidates most often forget: the first cuts the cost of repeated long prefixes, the second speeds up edits where most of the output is already known (rewriting a document, patching code)."
        ],
        probe: "“Your customer's bill doubled after a prompt change. What do you look at first?” — input tokens, cache hit rate, output length."
      }
    ],
    lab: {
      title: "A cost-aware router with a pre-call estimate and a post-call reconciliation",
      goal: "Turn model selection into code you can defend: classify the request, pick the cheapest model that should clear the bar, estimate the cost, then reconcile with real usage.",
      steps: [
        "Fill a small price table from the current pricing page (per million input and output tokens). Record the date you fetched it — prices move.",
        "Write a `route()` function that takes the request and picks a model from a policy, not from vibes: short classification → small; long-context synthesis → medium; explicit hard reasoning → large.",
        "Estimate cost before the call from a token approximation, then compare with the real usage after the call. Print the error percentage.",
        "Add a fallback: on a 429 or a 5xx, retry once on the next model up with a log line that says why.",
        "Run the same ten requests through the router and through a fixed large model, and tabulate cost and latency side by side."
      ],
      code: [
        {
          lang: "python",
          name: "01_router.py",
          src: `import json, os, time
from dataclasses import dataclass
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

# USD per 1M tokens (input, output). Fill from mistral.ai/pricing and date it.
# As of Oct 2026 the published list price for Mistral Medium 3.5 is $1.5 / $7.5.
PRICES = {
    "mistral-small-latest": (0.00, 0.00),   # <- fill in
    "mistral-medium-latest": (1.50, 7.50),
    "mistral-large-latest": (0.00, 0.00),   # <- fill in
}

@dataclass
class Policy:
    name: str
    model: str
    max_tokens: int

def route(prompt: str, task: str) -> Policy:
    approx_in = len(prompt) / 4          # rough chars->tokens; replace with a real tokenizer
    if task == "classify" and approx_in < 400:
        return Policy("cheap-classify", "mistral-small-latest", 16)
    if approx_in > 6000:
        return Policy("long-context", "mistral-medium-latest", 500)
    if task == "hard-reasoning":
        return Policy("hard", "mistral-large-latest", 800)
    return Policy("default", "mistral-small-latest", 300)

def estimate(policy: Policy, prompt: str) -> float:
    tin = len(prompt) / 4
    pin, pout = PRICES[policy.model]
    return (tin * pin + policy.max_tokens * pout) / 1_000_000

def call(policy: Policy, prompt: str, retries: int = 1):
    for attempt in range(retries + 1):
        try:
            t0 = time.perf_counter()
            r = client.chat.complete(
                model=policy.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0 if policy.name == "cheap-classify" else 0.3,
                max_tokens=policy.max_tokens,
            )
            return r, (time.perf_counter() - t0) * 1000
        except Exception as e:                       # narrow this to the SDK's status errors
            if attempt == retries:
                raise
            print(f"retrying after {type(e).__name__}: {e}")
            policy = Policy(policy.name + "+fallback", "mistral-medium-latest", policy.max_tokens)

if __name__ == "__main__":
    prompt = "Classify this support ticket as billing, bug, or feature: 'invoice shows a duplicate charge'"
    p = route(prompt, "classify")
    est = estimate(p, prompt)
    resp, ms = call(p, prompt)
    u = resp.usage
    pin, pout = PRICES[p.model]
    actual = (u.prompt_tokens * pin + u.completion_tokens * pout) / 1_000_000
    print(json.dumps({
        "policy": p.name, "model": p.model, "latency_ms": round(ms, 1),
        "tokens": {"in": u.prompt_tokens, "out": u.completion_tokens},
        "est_usd": round(est, 8), "actual_usd": round(actual, 8),
        "estimate_error_pct": round((est - actual) / actual * 100, 1) if actual else None,
    }, indent=2))
`
        }
      ],
      verify: "You have a table of ten requests with model, tokens, latency and cost, and you can state the blended cost per 1,000 requests for both policies. The estimate error should be within a few percent once the token approximation is decent — if it is not, your max_tokens is dominating the estimate, which is itself the lesson.",
      pitfalls: "Do not ship the char/4 token approximation as if it were a tokenizer; say out loud that it is an approximation and that a real system uses the model's tokenizer. Do not retry on 4xx validation errors — only on rate limits and 5xx."
    },
    questionIds: ["q3", "q4", "q5", "q6"],
    deliverable: "A router script plus a one-page cost table: model, price, tokens per request, cost per 1,000, p50/p95 latency measured.",
    checklist: [
      "Can draw the product surface from memory in under two minutes",
      "Can state batch, priority and regional multipliers without notes",
      "Price table filled and dated",
      "Router runs end to end with a measured estimate error",
      "Measured p50/p95 latency for two models on the same prompt",
      "Can answer “which model and why” in 90 seconds with numbers"
    ]
  },

  {
    id: 2,
    label: "Day 2",
    title: "Structured output, tools, and agents that do not fall over",
    kicker: "Build · 3 h",
    mission: "Ship two things a customer would pay for: an extractor that always returns valid JSON, and a tool-using loop that fails safely.",
    chips: ["3 hours", "Lab: extractor + tool loop", "Interview signal: build quality"],
    intro: [
      "This is the day that maps most directly to the pair-programming round. The exercise is rarely clever. It is: integrate a real API, produce a schema-valid object, handle a tool call, degrade gracefully when the third party is down — and narrate your decisions while you do it.",
      "Two APIs to know cold: chat completions with <code>response_format</code> for schemas, and the Agents/Conversations pair for stateful assistants with built-in tools."
    ],
    blocks: [
      { time: "0:00", label: "Structured outputs vs JSON mode", task: "Read both doc pages. Write down when each is correct and what each guarantees — and what neither guarantees." },
      { time: "0:30", label: "The function-calling loop", task: "Trace the five steps: define tools, model emits call, you execute, you append a tool message, model continues. Then read the reliability section below." },
      { time: "1:00", label: "Lab part A: invoice extractor", task: "Pydantic model → JSON schema → strict response_format → validate → repair loop." },
      { time: "1:50", label: "Lab part B: tool loop with a real third party", task: "One weather or FX API, schema validation, max iterations, timeout, idempotency, trace log." },
      { time: "2:30", label: "Agents and Conversations", task: "Create an agent with the built-in web search tool, then a document-library agent. Compare what you had to write by hand." }
    ],
    concepts: [
      {
        title: "Structured output is a contract, not a hope",
        body: [
          "Mistral offers two mechanisms. <strong>JSON mode</strong> guarantees parseable JSON but not your shape: you still have to instruct the model and validate. <strong>Custom structured outputs</strong> take a JSON schema and constrain generation to it, which is what you want for extraction, classification and anything feeding a database.",
          "The practical discipline: define the schema once (Pydantic or JSON Schema), send it as <code>response_format</code>, validate the returned object against the same schema, and treat a validation failure as an observable event with a repair path — re-ask with the validation error appended, at most once, then degrade to a human queue. Schemas should be flat and explicit; deep nesting with many optional fields is where models and validators both get unhappy.",
          "Never ask the model to regenerate an entire document when it needs to change three fields. Smaller outputs are cheaper, faster, and easier to validate."
        ],
        probe: "“What does JSON mode not guarantee?” — the schema. That answer separates people who have shipped from people who have read."
      },
      {
        title: "The tool loop, and where it actually breaks",
        body: [
          "Mechanically: you send tool specifications alongside the messages; the model returns a message whose content includes a tool call (name plus JSON arguments); <em>your</em> runtime executes it and appends a tool-role message with the result and the call id; the model continues. The model never executes anything. Loop until it returns prose or you hit a cap.",
          "Failure modes, and the mitigation you should say out loud in an interview:",
          "<ul><li><strong>Malformed arguments</strong> — validate against the tool's schema before executing, and return a machine-readable error to the model so it can self-correct.</li><li><strong>Wrong tool chosen</strong> — fewer, better-described tools; descriptions are prompts; measure selection accuracy on a labelled set.</li><li><strong>Loops and runaway cost</strong> — hard iteration cap, token budget, and a terminal “ask the user” branch.</li><li><strong>Side effects</strong> — idempotency keys on writes; confirmation gates before anything irreversible (send, pay, delete).</li><li><strong>Prompt injection through tool output</strong> — treat third-party content as data, delimit it, and never let it carry instructions.</li></ul>"
        ],
        probe: "Follow-up you should expect: “How do you regression-test tool calling after a model upgrade?” — pinned ids, per-step evals, end-to-end task success."
      },
      {
        title: "Agents and Conversations: when you want the platform to hold the state",
        body: [
          "An <strong>Agent</strong> is a reusable bundle: model, name, instructions, tools, completion arguments, optional guardrails. A <strong>Conversation</strong> is the history: messages, tool executions, and entries, which can be started by an agent or directly by a model. The public Conversations API can only read and modify conversations owned by the API key that created them.",
          "Built-in tools are the reason to use agents rather than raw chat: <code>web_search</code> (and a premium variant), <code>code_interpreter</code>, <code>image_generation</code>, and <code>document_library</code> pointing at a Library. Handoffs let one agent pass control to another, with <code>handoff_execution</code> set to <code>server</code> (run on Mistral's side) or <code>client</code> (surface the handoff to your code or user).",
          "The engineering trade-off: agents buy you less glue code and more observability, at the cost of control over the loop. If you need deterministic steps, retries with your own backoff, or a step that waits three days for a human, that is <strong>Workflows</strong>, not an agent."
        ],
        probe: "“Agent, Conversations, or Workflows?” Answer with the control-flow requirement, not with the feature list."
      }
    ],
    lab: {
      title: "Two contracts: a schema-strict extractor, and a bounded tool loop",
      goal: "Produce a script that extracts a typed object from messy text with a repair path, and a second that calls a real third-party API through tool calling and survives its failures.",
      steps: [
        "Model the invoice as a Pydantic class with explicit fields and a currency enum. Export the JSON schema.",
        "Send it as `response_format` with `json_schema` and strict validation; parse into the Pydantic class.",
        "Deliberately break it: feed an invoice with a missing field and confirm you get a validation error you can repair, not a crash.",
        "Build the tool loop with two tools: one wrapping a public FX or weather API, one reading from local data. Cap iterations at 5.",
        "Log every step as JSON lines: prompt hash, tool call, arguments, result size, latency, tokens. This log is your future eval set.",
        "Force a failure (bad API key, 500) and confirm the assistant degrades with a caveat instead of a stack trace."
      ],
      code: [
        {
          lang: "python",
          name: "02_extract_and_tools.py",
          src: `import json, os, time
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
MODEL = "mistral-small-latest"

class Currency(str, Enum):
    EUR = "EUR"; USD = "USD"; GBP = "GBP"

class Invoice(BaseModel):
    vendor: str = Field(description="Legal name of the supplier")
    invoice_number: str
    total_amount: float = Field(ge=0)
    currency: Currency
    due_date: str = Field(description="ISO 8601 date, YYYY-MM-DD")

def extract(text: str, repair: bool = True) -> Invoice | None:
    schema = {"type": "json_schema",
              "json_schema": {"name": "invoice", "strict": True,
                              "schema": Invoice.model_json_schema()}}
    messages = [{"role": "system", "content": "Extract the invoice. Use only what is in the text."},
                {"role": "user", "content": text}]
    for attempt in range(2 if repair else 1):
        r = client.chat.complete(model=MODEL, messages=messages, temperature=0,
                                 response_format=schema, max_tokens=400)
        raw = r.choices[0].message.content
        try:
            return Invoice.model_validate_json(raw)
        except ValidationError as e:
            if attempt == 1:
                print("extraction failed after repair:", e.errors()[:2])
                return None
            messages += [{"role": "assistant", "content": raw},
                         {"role": "user", "content": f"That JSON failed validation: {e}. Return corrected JSON only."}]

TOOLS = [
    {"type": "function", "function": {
        "name": "get_fx_rate",
        "description": "Get the exchange rate between two ISO currencies for today.",
        "parameters": {"type": "object",
                       "properties": {"base": {"type": "string"}, "quote": {"type": "string"}},
                       "required": ["base", "quote"]}}},
]

def get_fx_rate(base: str, quote: str) -> str:
    try:
        # replace with a real HTTP call: timeout=5, raise_for_status(), validate payload shape
        return json.dumps({"base": base.upper(), "quote": quote.upper(), "rate": 1.08,
                           "as_of": "2026-10-26", "source": "demo-fixture"})
    except Exception as e:
        return json.dumps({"error": f"fx_unavailable: {e}"})

def run_agent(question: str, max_steps: int = 5) -> str:
    messages = [{"role": "system", "content": "Use tools when needed. Never invent rates."},
                {"role": "user", "content": question}]
    for step in range(max_steps):
        r = client.chat.complete(model=MODEL, messages=messages, tools=TOOLS,
                                 tool_choice="auto", temperature=0.2, max_tokens=500)
        msg = r.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:
            return msg.content or ""
        for call in msg.tool_calls:
            args = json.loads(call.function.arguments or "{}")
            try:
                result = get_fx_rate(**args)
            except TypeError as e:                       # model invented a parameter
                result = json.dumps({"error": f"bad_arguments: {e}"})
            messages.append({"role": "tool", "tool_call_id": call.id,
                             "name": call.function.name, "content": result})
        print(f"step {step}: {len(msg.tool_calls)} tool call(s)")
    return "I could not finish within the step budget — here is what I found so far."

if __name__ == "__main__":
    doc = "ACME GmbH, invoice INV-2031, total 1.240,00 EUR, due 2026-11-15."
    print(extract(doc))
    print(run_agent("What is 250 EUR in USD today?"))
`
        }
      ],
      verify: "The extractor returns a validated `Invoice` for the good document and returns `None` (with two logged error lines) for the broken one. The agent loop prints at least one tool call, caps at five steps, and produces a final sentence when the tool fails.",
      pitfalls: "`model_json_schema()` for an enum emits a `$ref`-free but nested schema — check what you send, because a schema the model cannot honour is worse than none. The tool message must carry the matching `tool_call_id`; a mismatched id produces confusing 400s. Do not let the agent's prose be the only record of what happened — log the steps."
    },
    questionIds: ["q7", "q8", "q9", "q10", "q11"],
    deliverable: "Two scripts plus a JSONL trace of a successful run and a deliberately failed run.",
    checklist: [
      "Can explain JSON mode vs custom schema, including what each guarantees",
      "Extractor has a validation and repair path with a logged failure mode",
      "Tool loop has an iteration cap, schema validation, and a degrade path",
      "Third-party payload is treated as untrusted data in the prompt",
      "Can sketch Agents vs Conversations vs Workflows on a whiteboard",
      "Trace log exists and is JSONL"
    ]
  },

  {
    id: 3,
    label: "Day 3",
    title: "RAG and Document AI, measured",
    kicker: "Quality · 3 h",
    mission: "Build retrieval that a customer can audit: OCR that keeps structure, chunks with provenance, hybrid search with a reranker, and a hit-rate number at the end.",
    chips: ["3 hours", "Lab: PDF → answer + hit@5", "Interview signal: diagnosis"],
    intro: [
      "Every Applied AI loop contains a RAG conversation. The differentiator is not knowing the architecture — it is knowing <em>where it breaks</em>: parsing tables, chunk boundaries, recall versus precision, and the fact that most “the model hallucinated” complaints are retrieval failures wearing a costume.",
      "Today you build the pipeline once, properly, and instrument it. Then you never have to hand-wave about it again."
    ],
    blocks: [
      { time: "0:00", label: "Document AI: OCR 4.1 and annotations", task: "Read the OCR docs. Note blocks, table_format, header/footer extraction, confidence granularity, and the annotated-pages price." },
      { time: "0:35", label: "Chunking that keeps provenance", task: "Structure-aware chunking; page and block ids in metadata; overlap policy; when to keep tables whole." },
      { time: "1:00", label: "Lab: the pipeline", task: "OCR a real PDF, chunk, embed, build BM25 + dense retrieval, rerank, answer with citations." },
      { time: "2:10", label: "Measure it", task: "Twenty questions with known answers. Compute hit@5 and MRR. Then change one thing and re-measure." },
      { time: "2:40", label: "Libraries vs DIY", task: "Read the Libraries docs and the Search Toolkit overview. Write when you would use each, and what you give up." }
    ],
    concepts: [
      {
        title: "Parsing is the bottleneck, not the model",
        body: [
          "OCR 4.1 returns per-page markdown plus, with <code>include_blocks=True</code>, paragraph-level bounding boxes and structural labels (text, title, list, table, image, equation, caption, code, references, header, footer, signature) in reading order. <code>table_format</code> gives you tables as markdown or HTML separately; <code>extract_header</code>/<code>extract_footer</code> pull running furniture out of the body; <code>confidence_scores_granularity</code> gives page, block or word confidence.",
          "Use those affordances instead of flattening everything. A table rendered as HTML keeps its header row, which is the difference between an answer that quotes a price correctly and one that reads across the wrong column. Block confidence is your triage signal: route low-confidence pages to human review rather than into the index.",
          "For structured extraction at scale, annotations let you attach a schema to the OCR call instead of doing a second pass. And when the volume is large, the same jobs belong in batch, at roughly half price."
        ],
        probe: "“200-page scanned contract, tables of fees, multi-column layout. Walk me through ingestion.”"
      },
      {
        title: "Chunking, hybrid retrieval, reranking",
        body: [
          "Chunk on structure, not on characters: split at headings and block boundaries, keep tables whole, carry <code>{doc_id, page, block_id, section_path}</code> as metadata, and store the parent section id so you can expand a hit into context at answer time. 300–800 tokens with modest overlap is a reasonable starting range; the right answer is the one your eval set rewards.",
          "Dense retrieval alone misses exact identifiers — invoice numbers, clause references, product codes. Hybrid retrieval (BM25 plus embeddings, fused with reciprocal rank fusion) is the standard fix, and a cross-encoder or LLM reranker over the top 30–50 candidates is usually the single biggest quality jump per unit of effort. Then answer with citations pointing at page and block, because an enterprise customer's first question is “where did that come from?”.",
          "Permissions belong in retrieval, not in the prompt: filter by the caller's document ACLs at query time. If your vector store cannot express that filter, you have a design problem, not a prompt problem."
        ],
        probe: "“Why hybrid, when embeddings are better?” — exact strings, rare tokens, numbers, and recall on short queries."
      },
      {
        title: "Managed retrieval or your own stack",
        body: [
          "Mistral's <strong>Libraries</strong> are persistent knowledge bases you upload documents to; an agent with the <code>document_library</code> tool retrieves from them and returns answers with tool references. <strong>Search Toolkit</strong> is the bring-your-own-index path: loaders, splitters, enrichers, embedders on ingestion; retrievers, rerankers, semantic cache on the query side; index backends including Vespa, Qdrant and Postgres — for teams that need their own store or hybrid logic.",
          "The trade-off to state cleanly: Libraries minimise infrastructure and time-to-demo and are the right default for a customer whose corpus is documents and whose access model is simple. A custom stack buys control over chunking, fusion, ACLs, freshness and cost — and costs you weeks plus an on-call rotation. Most enterprise deals land in between: managed ingestion, custom retrieval policy.",
          "A serious answer also names freshness and re-ingestion: what happens when a document is replaced, how do you invalidate embeddings, and how do you keep citations stable across versions."
        ],
        probe: "“When would you NOT use managed RAG?” — complex ACLs, strict freshness, non-document data, or a mandated vector store."
      }
    ],
    lab: {
      title: "PDF to cited answer, with hit@5 attached",
      goal: "One pipeline, one measurement. By the end you can say “retrieval hit@5 was 0.85, the failure was the fee table split across pages” — the sentence that gets people hired.",
      steps: [
        "Pick a real public PDF with at least one table and 20+ pages.",
        "OCR it with `include_blocks=True` and `table_format=\"html\"`; keep page index, block labels and confidence.",
        "Chunk by block and section with metadata; store the HTML table as its own chunk.",
        "Embed with `mistral-embed`; implement BM25 over the same chunks; fuse with reciprocal rank fusion; optionally rerank the top 30.",
        "Answer with a prompt that forces citations to page and block id, and refuse when the retrieved context is insufficient.",
        "Write 20 questions with known answers and compute hit@5 and MRR for dense-only versus hybrid. Change one variable and re-measure."
      ],
      code: [
        {
          lang: "python",
          name: "03_rag.py",
          src: `import os, re, math, json
from collections import Counter
from mistralai.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
PDF_URL = "https://arxiv.org/pdf/2201.04234"     # swap for your own document

# ---------- 1. OCR with structure ----------
ocr = client.ocr.process(
    model="mistral-ocr-latest",
    document={"type": "document_url", "document_url": PDF_URL},
    include_blocks=True,
    table_format="html",
)
chunks = []
for page in ocr.pages:
    for b in (page.blocks or []):
        text = (getattr(b, "content", "") or "").strip()
        if len(text) < 40:
            continue
        chunks.append({"id": f"p{page.index}-b{getattr(b, 'index', 0)}",
                       "page": page.index,
                       "label": getattr(b, "type", "text"),
                       "text": text})
print(f"{len(chunks)} chunks from {len(ocr.pages)} pages")

# ---------- 2. Embed ----------
def embed(texts):
    out = []
    for i in range(0, len(texts), 64):                      # batch politely
        r = client.embeddings.create(model="mistral-embed", inputs=texts[i:i+64])
        out += [d.embedding for d in r.data]
    return out

for c, v in zip(chunks, embed([c["text"] for c in chunks])):
    c["vec"] = v

# ---------- 3. Lexical index (BM25) + dense ----------
def tokens(s):
    return re.findall(r"[a-z0-9]+", s.lower())

df = Counter()
for c in chunks:
    for t in set(tokens(c["text"])):
        df[t] += 1
N = len(chunks)
avgdl = sum(len(tokens(c["text"])) for c in chunks) / max(N, 1)
k1, b = 1.5, 0.75

def bm25(q):
    qt = tokens(q)
    scores = []
    for c in chunks:
        tf = Counter(tokens(c["text"]))
        dl = sum(tf.values())
        s = 0.0
        for t in qt:
            if t not in tf:
                continue
            idf = math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5))
            s += idf * (tf[t] * (k1 + 1)) / (tf[t] + k1 * (1 - b + b * dl / avgdl))
        scores.append(s)
    return scores

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb + 1e-9)

def retrieve(q, k=5, mode="hybrid"):
    dense = [cosine(c["vec"], embed([q])[0]) for c in chunks]
    if mode == "dense":
        order = sorted(range(N), key=lambda i: -dense[i])[:k]
        return [chunks[i] for i in order]
    lex = bm25(q)
    # reciprocal rank fusion
    fused = Counter()
    for ranked in (sorted(range(N), key=lambda i: -dense[i]),
                   sorted(range(N), key=lambda i: -lex[i])):
        for rank, i in enumerate(ranked[:50]):
            fused[i] += 1 / (60 + rank)
    return [chunks[i] for i, _ in fused.most_common(k)]

# ---------- 4. Answer with citations ----------
def answer(q, mode="hybrid"):
    hits = retrieve(q, k=5, mode=mode)
    ctx = "\\n\\n".join(f"[{c['id']} | page {c['page']} | {c['label']}]\\n{c['text']}" for c in hits)
    prompt = (
        "Answer only from the context. Cite chunk ids in brackets after each claim. "
        "If the context is insufficient, say exactly: insufficient context.\\n\\n"
        f"CONTEXT\\n{ctx}\\n\\nQUESTION\\n{q}"
    )
    r = client.chat.complete(model="mistral-small-latest", temperature=0,
                             messages=[{"role": "user", "content": prompt}], max_tokens=600)
    return r.choices[0].message.content, [c["id"] for c in hits]

if __name__ == "__main__":
    q = "What evaluation datasets does the paper use, and what are the main results?"
    text, ids = answer(q)
    print(text); print("retrieved:", ids)
`
        }
      ],
      verify: "You have two numbers — hit@5 and MRR — for dense-only and hybrid on the same 20 questions, and at least one concrete failure diagnosis (which question failed and why). Answers cite chunk ids, and the model says “insufficient context” when you ask something out of scope.",
      pitfalls: "Embedding a query inside the loop re-embeds per chunk in this teaching script — in production embed once per query. If `blocks` is empty, your OCR model/output does not support blocks (needs OCR 4+). Chinese/French documents need a tokenizer-aware BM25; the regex above is English-biased, so say so instead of pretending."
    },
    questionIds: ["q15", "q16", "q17", "q18", "q19"],
    deliverable: "A pipeline script, a 20-question eval sheet with hit@5 / MRR for two configurations, and three named failure modes with fixes.",
    checklist: [
      "OCR run with blocks, tables and confidence recorded",
      "Chunks carry doc/page/block provenance",
      "Hybrid retrieval implemented (not just described)",
      "Answers cite sources and refuse when context is thin",
      "hit@5 and MRR measured for two configurations",
      "Can explain Libraries vs Search Toolkit vs DIY in one minute",
      "Can name the ACL and freshness implications of the design"
    ]
  }
];
