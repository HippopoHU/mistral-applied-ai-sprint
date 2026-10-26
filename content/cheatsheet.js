/* Reference sheet page */

window.CHEATSHEET = {
  title: "The one-page reference",
  note: "Model names, prices and API shapes below were checked against docs.mistral.ai and the mistralai 3.5 Python SDK in October 2026. Everything here moves — re-check the model list and pricing page the week of your interview, and say the date out loud when you quote a number.",
  sections: [
    {
      id: "lineup",
      title: "Model lineup",
      kind: "table",
      head: ["Family", "Id / alias", "What it is", "Reach for it when"],
      rows: [
        ["Mistral Large 4", "<code>mistral-large-4</code>", "Open-weight multimodal MoE, 1M context, public preview (Oct 2026)", "Long-context synthesis, hard reasoning, agentic coding where quality dominates cost"],
        ["Mistral Large 3", "<code>mistral-large-3</code>", "Open-weight multimodal, sparse MoE (~41B active / ~675B total), Apache 2.0", "Frontier quality with self-hosting or fine-tuning rights"],
        ["Mistral Medium 3.5", "<code>mistral-medium-latest</code>", "Frontier-class multimodal workhorse, 128B, agentic and coding focus. List price ≈ $1.5 / $7.5 per 1M tokens", "The default production choice for agentic and document work"],
        ["Mistral Small 4", "<code>mistral-small-latest</code>", "Hybrid instruct / reasoning / coding, 256k context, Apache 2.0", "High-volume extraction, classification, RAG answers, cheap reasoning"],
        ["Ministral 3", "<code>ministral-3b/8b/14b-latest</code>", "Dense text+vision models, Apache 2.0", "Latency-critical, edge, or high-concurrency serving"],
        ["OCR 4.1", "<code>mistral-ocr-latest</code>", "Document OCR with blocks, bboxes, table formats, confidence. ≈ $4 / 1,000 pages", "Any PDF or scan entering a pipeline"],
        ["Voxtral", "<code>voxtral-small-latest</code>, transcribe / TTS models", "Speech in, speech out, realtime transcription, voice cloning", "Call handling, meeting transcription, voice agents"],
        ["Codestral / Devstral", "<code>codestral-latest</code>, Devstral 2", "Code completion and software-engineering agents", "IDE features and code agents (note: Devstral 2 is being superseded by Medium 3.5)"],
        ["Embeddings", "<code>mistral-embed</code>, <code>codestral-embed</code>", "Text and code vectors", "Retrieval, clustering, deduplication"],
        ["Moderation", "<code>mistral-moderation-latest</code>", "Policy classification with PII and jailbreak categories", "Guardrails, review queues, abuse detection"]
      ]
    },
    {
      id: "tiers",
      title: "Service tiers and endpoints",
      kind: "table",
      head: ["Option", "Price signal", "Use it for", "Watch out"],
      rows: [
        ["Batch", "≈ 50% of standard", "Backfills, nightly enrichment, bulk OCR, offline evals", "Asynchronous; design partial-output and idempotent retries"],
        ["Standard", "list price", "User-facing traffic", "Best-effort routing"],
        ["Priority", "1.75× list", "Revenue-critical real-time paths", "Requires entitlement; still eligible for cache discounts"],
        ["Regional (EU / US)", "1.1× list", "Data-location requirements, latency locality", "No Agents, Batch or Files on regional endpoints; control plane stays global"],
        ["Prompt cache", "large discount on cached input", "Long stable system prompts and instructions", "Only helps if the prefix is genuinely stable and ordered first"]
      ]
    },
    {
      id: "snippets",
      title: "SDK shapes you should be able to type from memory",
      kind: "code",
      blocks: [
        {
          lang: "python", name: "chat.py",
          src: `from mistralai.client import Mistral          # 3.x import path
client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

r = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "system", "content": "..."},
              {"role": "user", "content": "..."}],
    temperature=0.2, max_tokens=400,
)
print(r.choices[0].message.content, r.usage)`
        },
        {
          lang: "python", name: "structured.py",
          src: `r = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": text}],
    temperature=0,
    response_format={"type": "json_schema",
                     "json_schema": {"name": "invoice", "strict": True,
                                     "schema": Invoice.model_json_schema()}},
)`
        },
        {
          lang: "python", name: "tools.py",
          src: `tools = [{"type": "function", "function": {
    "name": "get_rate",
    "description": "FX rate between two ISO currencies.",
    "parameters": {"type": "object",
                   "properties": {"base": {"type": "string"}, "quote": {"type": "string"}},
                   "required": ["base", "quote"]}}}]

r = client.chat.complete(model="mistral-medium-latest", messages=msgs,
                         tools=tools, tool_choice="auto")
msg = r.choices[0].message
if msg.tool_calls:
    call = msg.tool_calls[0]
    result = get_rate(**json.loads(call.function.arguments))
    msgs += [msg, {"role": "tool", "tool_call_id": call.id,
                   "name": call.function.name, "content": result}]`
        },
        {
          lang: "python", name: "docs.py",
          src: `ocr = client.ocr.process(
    model="mistral-ocr-latest",
    document={"type": "document_url", "document_url": url},
    include_blocks=True, table_format="html",
    confidence_scores_granularity="block",
)
emb = client.embeddings.create(model="mistral-embed", inputs=chunks)   # note: inputs=`
        },
        {
          lang: "python", name: "batch.py",
          src: `job = client.batch.jobs.create(
    endpoint="/v1/chat/completions",
    input_files=[file_id],          # uploaded with purpose="batch"
    model="mistral-small-latest",
    timeout_hours=24,
)`
        },
        {
          lang: "python", name: "agents.py",
          src: `agent = client.beta.agents.create(
    model="mistral-medium-latest", name="Doc agent",
    instructions="Answer from the library only.",
    tools=[{"type": "document_library", "library_ids": [lib.id]}],
)
conv = client.beta.conversations.start(agent_id=agent.id, inputs="...", store=True)

eu = Mistral(api_key=key, server="eu")       # regional endpoint`
        }
      ]
    },
    {
      id: "math",
      title: "Serving maths",
      kind: "table",
      head: ["Quantity", "Formula", "Worked example"],
      rows: [
        ["KV cache / token", "2 × layers × kv_heads × head_dim × bytes", "2 × 32 × 8 × 128 × 2 = 131,072 B = 128 KiB"],
        ["Cache for a sequence", "cache/token × tokens", "4,096 tokens → 512 MiB"],
        ["Concurrency on 80 GB", "(80 − weights − 6 GiB overhead) ÷ cache per sequence", "24B at fp8 ≈ 24 GB weights → ~50 × 4k sequences before scheduler limits"],
        ["MoE weights", "total params × bytes", "675B × 2 B ≈ 1.35 TB; fp8 ≈ 675 GB; 4-bit ≈ 350–400 GB"],
        ["Full fine-tune state", "≈16 B/param (bf16 weights+grads, fp32 master+moments)", "7B ≈ 112 GB before activations"],
        ["LoRA footprint", "base weights + adapters + activations", "7B bf16 base ≈ 14 GB; adapters < 1% of params"],
        ["QLoRA footprint", "4-bit base + adapters", "7B ≈ 3.5–4 GB base, fits a consumer GPU"]
      ]
    },
    {
      id: "decide",
      title: "Decision tables",
      kind: "duo",
      tables: [
        {
          title: "RAG vs fine-tuning vs prompting",
          head: ["Symptom", "First move"],
          rows: [
            ["Facts change per document", "RAG with citations"],
            ["Wrong format / schema / tone every time", "Structured output, then few-shot, then fine-tune"],
            ["Too expensive per request", "Smaller model + retrieval discipline + caching"],
            ["Fine model is too slow", "Distil behaviour into a small model via fine-tuning"],
            ["Needs citations and per-user access", "RAG (fine-tuning cannot do this)"],
            ["Domain vocabulary misunderstood", "Prompt + glossary, then retrieval of definitions, then fine-tune"]
          ]
        },
        {
          title: "Deployment topology",
          head: ["Constraint", "Answer"],
          rows: [
            ["Data must stay in the EU", "Regional endpoint (chat + function calling only) or EU-hosted deployment"],
            ["No egress at all", "Self-hosted open weights + self-hosted embeddings"],
            ["Bursty, low average volume", "Hosted API"],
            ["Sustained high volume", "Self-host the bulk, API for the tail"],
            ["Latency-critical interactive", "Smaller model, streaming, priority tier for the critical slice"],
            ["Weeks-long human approvals", "Durable workflow, not an agent loop"]
          ]
        }
      ]
    },
    {
      id: "vocab",
      title: "Vocabulary to use precisely",
      kind: "defs",
      rows: [
        ["TTFT", "Time to first token. Prefill plus queueing. What a user feels after clicking."],
        ["ITL / TPOT", "Inter-token (or time-per-output-token) latency. Decode cost per step."],
        ["Prefill / decode", "Parallel prompt processing / sequential token generation. Compute-bound / bandwidth-bound."],
        ["Paged attention", "KV cache in fixed blocks rather than contiguous per-sequence allocation."],
        ["GQA / MQA", "Grouped / multi-query attention: fewer KV heads than query heads, smaller cache."],
        ["SWA", "Sliding-window attention: each layer sees the last W tokens; ring-buffer cache."],
        ["MoE", "Mixture of experts: routers pick top-k FFNs per token; memory scales with total params."],
        ["Reranker", "Cross-encoder or LLM that re-scores retrieved candidates for precision."],
        ["RRF", "Reciprocal rank fusion: combine ranked lists without score calibration."],
        ["Hit@k / MRR", "Is a correct chunk in the top k / how high the first correct one ranks."],
        ["Faithfulness", "Whether the answer is supported by the retrieved context."],
        ["Golden set", "Versioned, stratified evaluation cases with expected answers or behaviours."],
        ["Gate", "Policy that blocks a release when quality, latency or cost crosses a baseline."],
        ["Canary", "Rolling a change to a traffic slice and comparing against control."],
        ["Guardrail", "Inline policy check on input (and output) that can block with a structured error."],
        ["Durable execution", "Event-history-backed orchestration that resumes after crashes and waits."],
        ["Handoff", "One agent passing control to another, server-side or client-side."]
      ]
    },
    {
      id: "gotchas",
      title: "Four things to verify before you quote them",
      kind: "list",
      items: [
        "<strong>Fine-tuning.</strong> The <code>/v1/fine_tuning/jobs</code> endpoints still appear in the API spec, but the current Python SDK (3.x) does not expose a <code>fine_tuning</code> client and Mistral's fine-tuning guides and cookbooks are archived under deprecated. Discuss it as a capability, and check current availability before promising it in a customer design.",
        "<strong>Alias drift.</strong> <code>-latest</code> aliases move. Pin a dated model id in production and treat an alias bump as a model change that needs the eval suite re-run.",
        "<strong>Regional limitations.</strong> Regional endpoints serve chat plus function calling; Agents, Batch and Files are not available there, and control-plane metadata is still handled globally.",
        "<strong>Prices and deprecations.</strong> Fallback chains change — several Devstral and Magistral ids now route customers to Medium 3.5 or Small 4. Check the model lifecycle page before quoting an id."
      ]
    }
  ]
};
