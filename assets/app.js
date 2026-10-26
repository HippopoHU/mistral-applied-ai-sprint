/* Mistral Sprint — routing, rendering, progress, timer. No dependencies. */
(function () {
  "use strict";

  var DAYS = (window.DAYS_A || []).concat(window.DAYS_B || []).sort(function (a, b) { return a.id - b.id; });
  var BANK = window.QUESTION_BANK || [];
  var STORE_KEY = "msprint.v1";
  var THEME_KEY = "msprint.theme";
  var TIMER_KEY = "msprint.timer";

  var view = document.getElementById("view");
  var railNav = document.getElementById("rail-nav");
  var railProgress = document.getElementById("rail-progress");
  var crumbs = document.getElementById("crumbs");
  var rail = document.getElementById("rail");
  var scrim = document.getElementById("scrim");
  var menuBtn = document.getElementById("menu-btn");
  var timerEl = document.getElementById("timer");
  var timerDisplay = document.getElementById("timer-display");

  var bankFilter = "All";
  var bankQuery = "";
  var state = load();

  /* ---------------- storage ---------------- */

  function load() {
    var base = { checks: {}, rehearsed: {}, start: todayISO() };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      return {
        checks: parsed.checks || {},
        rehearsed: parsed.rehearsed || {},
        start: parsed.start || base.start
      };
    } catch (e) {
      return base;
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function todayISO() {
    var d = new Date();
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-");
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* ---------------- helpers ---------------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(code, lang) {
    var keywords = {
      python: "import|from|def|class|return|if|elif|else|for|while|try|except|finally|with|as|in|not|and|or|is|None|True|False|lambda|yield|raise|pass|continue|break|assert|async|await|global|nonlocal|del",
      bash: "cd|export|source|echo|git|uv|pip|python|curl|mkdir|printf|grep|cut"
    }[lang] || "";
    var kw = keywords ? new RegExp("\\b(" + keywords + ")\\b", "g") : null;
    var out = "";
    var i = 0;
    var re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?''')|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\()/g;
    var m;
    while ((m = re.exec(code)) !== null) {
      if (m.index > i) out += paint(code.slice(i, m.index));
      if (m[1]) out += '<span class="tok-c">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-s">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-s">' + esc(m[3]) + "</span>";
      else if (m[4]) out += '<span class="tok-n">' + esc(m[4]) + "</span>";
      else if (m[5]) out += '<span class="tok-f">' + esc(m[5]) + "</span>";
      i = re.lastIndex;
    }
    if (i < code.length) out += paint(code.slice(i));
    return out;

    function paint(s) {
      var escaped = esc(s);
      if (kw) escaped = escaped.replace(kw, '<span class="tok-k">$1</span>');
      return escaped;
    }
  }

  function codeBlock(block) {
    var wrap = el("div", "code-wrap");
    var bar = el("div", "code-bar");
    bar.appendChild(el("span", "code-lang", esc(block.lang || "text")));
    bar.appendChild(el("span", "code-name", esc(block.name || "")));
    var btn = el("button", "copy-btn", "copy");
    btn.type = "button";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", function () {
      copy(block.src).then(function () {
        btn.textContent = "copied";
        btn.classList.add("done");
        setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("done"); }, 1600);
      });
    });
    bar.appendChild(btn);
    wrap.appendChild(bar);
    var pre = el("pre");
    var code = el("code");
    code.innerHTML = highlight(block.src, block.lang);
    pre.appendChild(code);
    wrap.appendChild(pre);
    return wrap;
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
    }
    legacyCopy(text);
    return Promise.resolve();
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------------- progress ---------------- */

  function dayItems(day) { return day.checklist || []; }

  function dayDone(day) {
    var done = state.checks["d" + day.id] || [];
    return dayItems(day).length > 0 && done.length >= dayItems(day).length;
  }

  function totals() {
    var total = 0, done = 0;
    DAYS.forEach(function (d) {
      total += dayItems(d).length;
      done += (state.checks["d" + d.id] || []).length;
    });
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function ringSVG(pct) {
    var r = 16, c = 2 * Math.PI * r;
    var off = c - (pct / 100) * c;
    return '<svg class="ring" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">' +
      '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--line-strong)" stroke-width="3"/>' +
      '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="3" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" stroke-linecap="round" ' +
      'transform="rotate(-90 21 21)"/>' +
      '<text x="21" y="25" text-anchor="middle">' + pct + '%</text></svg>';
  }

  function renderProgress() {
    var t = totals();
    railProgress.innerHTML = ringSVG(t.pct) +
      '<div class="progress-copy"><strong>Sprint progress</strong><span>' + t.done + " of " + t.total + " checks</span></div>";
    railProgress.setAttribute("aria-label", t.pct + " percent of the sprint complete");
  }

  /* ---------------- nav ---------------- */

  var ROUTES = [
    { group: "Sprint" },
    { href: "#/home", n: "00", label: "How to use this" }
  ];

  function buildNav() {
    railNav.innerHTML = "";
    var g1 = el("div", "rail-group-label", "Sprint");
    railNav.appendChild(g1);
    railNav.appendChild(link("#/home", "i", "How to use this", null));
    DAYS.forEach(function (d) {
      railNav.appendChild(link("#/day/" + d.id, pad(d.id), d.label.replace("Day ", "D") + " · " + shortTitle(d), d));
    });
    railNav.appendChild(el("div", "rail-group-label", "Reference"));
    var refs = el("div", "rail-refs");
    [
      ["#/bank", "Questions"], ["#/cheatsheet", "Cheat sheet"],
      ["#/design", "Design"], ["#/positioning", "Positioning"], ["#/sources", "Sources"]
    ].forEach(function (r) { refs.appendChild(link(r[0], "", r[1], null)); });
    railNav.appendChild(refs);
  }

  function shortTitle(day) {
    var map = {
      0: "Baseline", 1: "Platform", 2: "Tools", 3: "RAG", 4: "Evaluation",
      5: "Internals", 6: "Design", 7: "Mock loop"
    };
    return map[day.id] || day.title;
  }

  function link(href, n, label, day) {
    var a = el("a", "rail-link" + (day && dayDone(day) ? " done" : ""));
    a.href = href;
    a.innerHTML = '<span class="n">' + esc(n) + '</span><span class="lbl">' + esc(label) + '</span><span class="tick" aria-hidden="true">done</span>';
    return a;
  }

  function markCurrent(route) {
    Array.prototype.forEach.call(railNav.querySelectorAll("a"), function (a) {
      if (a.getAttribute("href") === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------------- router ---------------- */

  function route() {
    var hash = location.hash || "#/home";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var page = parts[0] || "home";
    var id = parts[1];
    closeDrawer();

    if (page === "day") {
      var day = DAYS.filter(function (d) { return String(d.id) === String(id); })[0];
      if (day) { renderDay(day); return; }
    }
    if (page === "bank") { renderBank(); return; }
    if (page === "cheatsheet") { renderCheatsheet(); return; }
    if (page === "design") { renderDesign(); return; }
    if (page === "positioning") { renderPositioning(); return; }
    if (page === "sources") { renderSources(); return; }
    renderHome();
  }

  function mount(nodes, opts) {
    view.innerHTML = "";
    nodes.forEach(function (n) { if (n) view.appendChild(n); });
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    if (!opts || !opts.keepFocus) view.focus({ preventScroll: true });
    renderProgress();
    buildNav();
    markCurrent(location.hash || "#/home");
  }

  /* ---------------- pages ---------------- */

  function renderHome() {
    var wrap = el("div", "view-inner wide");
    var hero = el("div", "hero");
    hero.appendChild(el("p", "kicker", esc(HOME.eyebrow)));
    hero.appendChild(el("h1", "hero-title", esc(HOME.title)));
    hero.appendChild(el("p", "lead", esc(HOME.lede)));
    var stats = el("div", "grid-3");
    HOME.stats.forEach(function (s) {
      stats.appendChild(el("div", "stat", '<div class="v">' + esc(s.v) + '</div><div class="k">' + esc(s.k) + '</div>'));
    });
    hero.appendChild(stats);

    var startRow = el("div", "hero-meta");
    startRow.appendChild(el("span", "chip accent", "Start date"));
    var dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = state.start;
    dateInput.setAttribute("aria-label", "Sprint start date");
    dateInput.style.cssText = "font:inherit;font-size:12px;background:transparent;border:1px solid var(--line-strong);color:var(--ink);border-radius:999px;padding:5px 10px;";
    dateInput.addEventListener("change", function () {
      state.start = dateInput.value || todayISO();
      save();
      renderHome();
    });
    startRow.appendChild(dateInput);
    startRow.appendChild(el("span", "chip", "Dates on each day follow this"));
    hero.appendChild(startRow);
    wrap.appendChild(hero);

    var how = el("div", "");
    how.appendChild(el("div", "section-head", '<span class="idx">01</span><h2>How the week works</h2>'));
    var howGrid = el("div", "grid-3");
    HOME.how.forEach(function (h) {
      howGrid.appendChild(el("div", "card tight", "<h3>" + esc(h.t) + "</h3><p>" + esc(h.d) + "</p>"));
    });
    how.appendChild(howGrid);
    wrap.appendChild(how);

    var plan = el("div", "");
    plan.appendChild(el("div", "section-head", '<span class="idx">02</span><h2>The seven days</h2>'));
    var list = el("div", "day-list");
    DAYS.forEach(function (d) {
      var a = el("a", "day-row");
      a.href = "#/day/" + d.id;
      var cs = state.checks["d" + d.id] || [];
      a.innerHTML =
        '<span class="dn">' + pad(d.id) + '</span>' +
        '<span><span class="dt">' + esc(d.title) + '</span><br><span class="dd">' + esc(d.mission) + '</span></span>' +
        '<span class="dm' + (dayDone(d) ? " ok" : "") + '">' + (dayDone(d) ? "done" : cs.length + "/" + dayItems(d).length) + "</span>";
      list.appendChild(a);
    });
    plan.appendChild(list);
    wrap.appendChild(plan);

    var paths = el("div", "");
    paths.appendChild(el("div", "section-head", '<span class="idx">03</span><h2>If your interview is sooner</h2>'));
    var pGrid = el("div", "grid-3");
    HOME.paths.forEach(function (p) {
      pGrid.appendChild(el("div", "card tight", '<p class="small">' + esc(p.k) + "</p><h3>" + esc(p.t) + "</h3><p>" + esc(p.d) + "</p>"));
    });
    paths.appendChild(pGrid);
    wrap.appendChild(paths);

    var refs = el("div", "");
    refs.appendChild(el("div", "section-head", '<span class="idx">04</span><h2>Reference, when you need it</h2>'));
    var cards = el("div", "route-cards");
    [
      { href: "#/bank", k: "38 answers", t: "Question bank", d: "Every question this sprint rehearses, filterable by topic, with model answers." },
      { href: "#/cheatsheet", k: "One page", t: "Cheat sheet", d: "Lineup, tiers, SDK shapes, serving maths, decision tables, vocabulary." },
      { href: "#/design", k: "8 steps", t: "System design", d: "The framework, a numbers toolkit, three case briefs and red flags." },
      { href: "#/positioning", k: "Your story", t: "Positioning", d: "Turn your background into their vocabulary — stories, bridge, gaps." }
    ].forEach(function (r) {
      var a = el("a", "route-card");
      a.href = r.href;
      a.innerHTML = '<div class="rc-k">' + esc(r.k) + '</div><div class="rc-t">' + esc(r.t) + '</div><div class="rc-d">' + esc(r.d) + "</div>";
      cards.appendChild(a);
    });
    refs.appendChild(cards);
    wrap.appendChild(refs);

    crumbs.innerHTML = "<b>Mistral Sprint</b> / how to use this";
    mount([wrap]);
  }

  function addDays(iso, n) {
    var d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d;
  }

  function dateLabel(day) {
    var d = addDays(state.start, day.id);
    try {
      return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short" })
        .format(d).toUpperCase();
    } catch (e) { return ""; }
  }

  function renderDay(day) {
    var wrap = el("div", "view-inner");
    var head = el("div", "day-head");
    var eyebrow = el("div", "day-eyebrow");
    eyebrow.appendChild(el("span", "small", esc(day.label)));
    eyebrow.appendChild(el("span", "date", esc(dateLabel(day))));
    eyebrow.appendChild(el("span", "line"));
    head.appendChild(eyebrow);
    head.appendChild(el("h1", "hero-title", esc(day.title)));
    var chips = el("div", "hero-meta");
    (day.chips || []).forEach(function (c, i) {
      chips.appendChild(el("span", "chip" + (i === 0 ? " accent" : ""), esc(c)));
    });
    head.appendChild(chips);
    head.appendChild(el("p", "mission", esc(day.mission)));

    var timerRow = el("div", "block-timer");
    [45, 90].forEach(function (mins) {
      var b = el("button", "timer-start", "Start " + mins + "-min block");
      b.type = "button";
      b.addEventListener("click", function () { startTimer(mins); });
      timerRow.appendChild(b);
    });
    var printBtn = el("button", "ghost-btn", "Print this day");
    printBtn.type = "button";
    printBtn.addEventListener("click", function () { window.print(); });
    timerRow.appendChild(printBtn);
    head.appendChild(timerRow);
    wrap.appendChild(head);

    (day.intro || []).forEach(function (p) { wrap.appendChild(el("p", "lead", p)); });

    var tl = el("div", "timeline");
    (day.blocks || []).forEach(function (b) {
      tl.appendChild(el("div", "tl-row",
        '<div class="tl-time">' + esc(b.time) + '</div><div><div class="tl-label">' + esc(b.label) +
        '</div><div class="tl-task">' + esc(b.task) + "</div></div>"));
    });
    wrap.appendChild(el("div", "section-head", '<span class="idx">01</span><h3>Blocks</h3>'));
    wrap.appendChild(tl);

    wrap.appendChild(el("div", "section-head", '<span class="idx">02</span><h3>What to know, and what gets probed</h3>'));
    (day.concepts || []).forEach(function (c, i) {
      var card = el("div", "card");
      var h = el("div", "card-head");
      h.appendChild(el("h3", "", esc(c.title)));
      h.appendChild(el("span", "card-num", "0" + (i + 1)));
      card.appendChild(h);
      (c.body || []).forEach(function (p) { card.appendChild(el("p", "", p)); });
      if (c.probe) card.appendChild(el("div", "probe", "<b>Probed as</b> " + esc(c.probe)));
      wrap.appendChild(card);
    });

    if (day.lab) {
      var lab = el("div", "lab");
      lab.appendChild(el("div", "lab-head", '<span class="lab-tag">Lab</span>'));
      lab.appendChild(el("h3", "", esc(day.lab.title)));
      lab.appendChild(el("p", "goal", esc(day.lab.goal)));
      var ol = el("ol", "steps");
      (day.lab.steps || []).forEach(function (s) { ol.appendChild(el("li", "", s)); });
      lab.appendChild(ol);
      (day.lab.code || []).forEach(function (b) { lab.appendChild(codeBlock(b)); });
      if (day.lab.verify) lab.appendChild(el("div", "verify", "<b>Verified when</b>" + esc(day.lab.verify)));
      if (day.lab.pitfalls) lab.appendChild(el("div", "pitfall", "<b>Watch out</b>" + esc(day.lab.pitfalls)));
      wrap.appendChild(el("div", "section-head", '<span class="idx">03</span><h3>Lab</h3>'));
      wrap.appendChild(lab);
    }

    if (day.diagnostic) {
      var diag = el("div", "card");
      diag.appendChild(el("h3", "", "Baseline diagnostic — no notes, score 0/1/2"));
      var dol = el("ol");
      day.diagnostic.forEach(function (q) { dol.appendChild(el("li", "", esc(q))); });
      diag.appendChild(dol);
      diag.appendChild(el("p", "small", "Below 6: your week is Day 3 (RAG), Day 4 (evaluation), Day 5 (internals). 7–9: skip the optional local model. 10–12: spend the freed hours on Day 6 and mock loops."));
      wrap.appendChild(diag);
    }

    if (day.questionIds && day.questionIds.length) {
      wrap.appendChild(el("div", "section-head", '<span class="idx">04</span><h3>Say it out loud</h3>'));
      var qcard = el("div", "card tight");
      day.questionIds.forEach(function (qid) {
        var q = BANK.filter(function (x) { return x.id === qid; })[0];
        if (q) qcard.appendChild(questionNode(q));
      });
      wrap.appendChild(qcard);
    }

    if (day.checklist) {
      var check = el("div", "check-card");
      check.appendChild(el("h3", "", "Definition of done"));
      var ul = el("ul", "check-list");
      day.checklist.forEach(function (item, i) {
        ul.appendChild(checkRow(day.id, i, item));
      });
      check.appendChild(ul);
      if (day.deliverable) check.appendChild(el("p", "small", "Deliverable: " + esc(day.deliverable)));
      wrap.appendChild(el("div", "section-head", '<span class="idx">05</span><h3>Checklist</h3>'));
      wrap.appendChild(check);
    }

    if (day.id < DAYS.length - 1) {
      var next = DAYS.filter(function (d) { return d.id === day.id + 1; })[0];
      if (next) {
        var nav = el("div", "route-cards");
        var a = el("a", "route-card");
        a.href = "#/day/" + next.id;
        a.innerHTML = '<div class="rc-k">next</div><div class="rc-t">' + esc(next.label + " · " + next.title) + '</div><div class="rc-d">' + esc(next.mission) + "</div>";
        nav.appendChild(a);
        wrap.appendChild(nav);
      }
    }

    crumbs.innerHTML = "<b>Sprint</b> / " + esc(day.label);
    mount([wrap]);
  }

  function checkRow(dayId, idx, text) {
    var li = el("li", "");
    var label = el("label", "check");
    var input = document.createElement("input");
    input.type = "checkbox";
    var arr = state.checks["d" + dayId] || [];
    input.checked = arr.indexOf(idx) !== -1;
    input.addEventListener("change", function () {
      var list = state.checks["d" + dayId] || [];
      if (input.checked) { if (list.indexOf(idx) === -1) list.push(idx); }
      else { list = list.filter(function (x) { return x !== idx; }); }
      state.checks["d" + dayId] = list;
      save();
      renderProgress();
      buildNav();
      markCurrent(location.hash);
    });
    label.appendChild(input);
    label.appendChild(el("span", "", esc(text)));
    li.appendChild(label);
    return li;
  }

  function questionNode(q) {
    var item = el("div", "q-item");
    item.dataset.open = "false";
    var btn = el("button", "q-q", esc(q.q));
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var open = item.dataset.open === "true";
      item.dataset.open = open ? "false" : "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
    var ans = el("div", "q-a");
    var meta = el("div", "q-meta");
    meta.appendChild(el("span", "tag", esc(q.cat)));
    meta.appendChild(el("span", "small", esc(q.id)));
    ans.appendChild(meta);
    (q.a || []).forEach(function (p) { ans.appendChild(el("div", "", p)); });
    if (q.follow) ans.appendChild(el("div", "followup", "<b>Follow-up:</b> " + esc(q.follow)));
    var lab = el("label", "rehearsed");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!state.rehearsed[q.id];
    cb.addEventListener("change", function () {
      if (cb.checked) state.rehearsed[q.id] = true; else delete state.rehearsed[q.id];
      save();
    });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode("rehearsed out loud"));
    ans.appendChild(lab);
    item.appendChild(btn);
    item.appendChild(ans);
    return item;
  }

  function renderBank() {
    var wrap = el("div", "view-inner");
    wrap.appendChild(el("p", "kicker", "Reference"));
    wrap.appendChild(el("h1", "hero-title", "Question bank"));
    wrap.appendChild(el("p", "lead", "Every question this sprint rehearses. Answers are synthesised from public material — say them in your own words, and tick one only after you have said it out loud."));

    var cats = ["All"];
    BANK.forEach(function (q) { if (cats.indexOf(q.cat) === -1) cats.push(q.cat); });
    cats = ["All"].concat(cats.filter(function (c) { return c !== "All"; }));

    var controls = el("div", "filters");
    cats.forEach(function (c) {
      var b = el("button", "filter-btn", esc(c));
      b.type = "button";
      b.setAttribute("aria-pressed", bankFilter === c ? "true" : "false");
      b.dataset.cat = c;
      b.addEventListener("click", function () {
        bankFilter = c;
        document.querySelectorAll(".filter-btn").forEach(function (x) {
          x.setAttribute("aria-pressed", x.dataset.cat === c ? "true" : "false");
        });
        applyBankFilter();
      });
      controls.appendChild(b);
    });
    var search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search questions…";
    search.value = bankQuery;
    search.setAttribute("aria-label", "Search question bank");
    search.style.cssText = "font:inherit;font-size:12px;background:transparent;border:1px solid var(--line-strong);color:var(--ink);border-radius:999px;padding:6px 12px;min-width:180px;";
    search.addEventListener("input", function () { bankQuery = search.value; applyBankFilter(); });
    controls.appendChild(search);
    wrap.appendChild(controls);
    wrap.appendChild(el("p", "small", '<span id="bank-count"></span>'));

    var list = el("div", "card tight");
    list.id = "bank-list";
    BANK.forEach(function (q) {
      var node = questionNode(q);
      node.dataset.cat = q.cat;
      node.dataset.text = (q.q + " " + q.cat + " " + (q.a || []).join(" ")).toLowerCase();
      list.appendChild(node);
    });
    wrap.appendChild(list);
    crumbs.innerHTML = "<b>Reference</b> / question bank";
    mount([wrap]);
    applyBankFilter();
  }

  function applyBankFilter() {
    var list = document.getElementById("bank-list");
    if (!list) return;
    var q = bankQuery.trim().toLowerCase();
    var shown = 0;
    Array.prototype.forEach.call(list.children, function (node) {
      var okCat = bankFilter === "All" || node.dataset.cat === bankFilter;
      var okQ = !q || node.dataset.text.indexOf(q) !== -1;
      var show = okCat && okQ;
      node.style.display = show ? "" : "none";
      if (show) shown++;
    });
    var count = document.getElementById("bank-count");
    if (count) count.textContent = shown + " of " + BANK.length + " questions" + (bankFilter === "All" ? "" : " · " + bankFilter);
  }

  function renderCheatsheet() {
    var wrap = el("div", "view-inner wide");
    wrap.appendChild(el("p", "kicker", "Reference"));
    wrap.appendChild(el("h1", "hero-title", esc(CHEATSHEET.title)));
    wrap.appendChild(el("p", "lead", esc(CHEATSHEET.note)));

    CHEATSHEET.sections.forEach(function (s, i) {
      wrap.appendChild(el("div", "section-head", '<span class="idx">' + pad(i + 1) + "</span><h2>" + esc(s.title) + "</h2>"));
      if (s.kind === "table") {
        var tw = el("div", "table-wrap");
        var t = el("table");
        var thead = el("thead");
        var tr = el("tr");
        s.head.forEach(function (h) { tr.appendChild(el("th", "", esc(h))); });
        thead.appendChild(tr);
        t.appendChild(thead);
        var tb = el("tbody");
        s.rows.forEach(function (row) {
          var r = el("tr");
          row.forEach(function (cell) { r.appendChild(el("td", "", cell)); });
          tb.appendChild(r);
        });
        t.appendChild(tb);
        tw.appendChild(t);
        wrap.appendChild(tw);
      } else if (s.kind === "code") {
        s.blocks.forEach(function (b) { wrap.appendChild(codeBlock(b)); });
      } else if (s.kind === "duo") {
        var duo = el("div", "grid-2");
        s.tables.forEach(function (sub) {
          var box = el("div", "card tight");
          box.appendChild(el("h3", "", esc(sub.title)));
          var w = el("div", "table-wrap");
          var tt = el("table");
          var th = el("thead");
          var trr = el("tr");
          sub.head.forEach(function (h) { trr.appendChild(el("th", "", esc(h))); });
          th.appendChild(trr);
          tt.appendChild(th);
          var tbb = el("tbody");
          sub.rows.forEach(function (row) {
            var r = el("tr");
            row.forEach(function (cell) { r.appendChild(el("td", "", esc(cell))); });
            tbb.appendChild(r);
          });
          tt.appendChild(tbb);
          w.appendChild(tt);
          box.appendChild(w);
          duo.appendChild(box);
        });
        wrap.appendChild(duo);
      } else if (s.kind === "defs") {
        var dl = el("div", "card tight");
        var table = el("table");
        var tbody = el("tbody");
        s.rows.forEach(function (row) {
          var r = el("tr");
          r.appendChild(el("td", "", "<b>" + esc(row[0]) + "</b>"));
          r.appendChild(el("td", "", esc(row[1])));
          tbody.appendChild(r);
        });
        table.appendChild(tbody);
        var w2 = el("div", "table-wrap");
        w2.appendChild(table);
        dl.appendChild(w2);
        wrap.appendChild(dl);
      } else if (s.kind === "list") {
        var c = el("div", "card");
        var ul = el("ul");
        s.items.forEach(function (it) { ul.appendChild(el("li", "", it)); });
        c.appendChild(ul);
        wrap.appendChild(c);
      }
    });
    crumbs.innerHTML = "<b>Reference</b> / cheat sheet";
    mount([wrap]);
  }

  function renderDesign() {
    var wrap = el("div", "view-inner");
    wrap.appendChild(el("p", "kicker", "Reference"));
    wrap.appendChild(el("h1", "hero-title", esc(DESIGN_PLAYBOOK.title)));
    DESIGN_PLAYBOOK.intro.forEach(function (p) { wrap.appendChild(el("p", "lead", p)); });

    wrap.appendChild(el("div", "section-head", '<span class="idx">01</span><h2>The eight steps</h2>'));
    var fw = el("div", "grid-2");
    DESIGN_PLAYBOOK.framework.forEach(function (s) {
      fw.appendChild(el("div", "card tight", '<span class="card-num">' + esc(s.n) + "</span><h3>" + esc(s.t) + "</h3><p>" + esc(s.d) + "</p>"));
    });
    wrap.appendChild(fw);

    wrap.appendChild(el("div", "section-head", '<span class="idx">02</span><h2>Numbers toolkit</h2>'));
    var tw = el("div", "table-wrap");
    var t = el("table");
    var thead = el("thead");
    thead.appendChild(el("tr", "", "<th>Quantity</th><th>How to compute</th>"));
    t.appendChild(thead);
    var tb = el("tbody");
    DESIGN_PLAYBOOK.toolkit.forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", "", "<b>" + esc(r.k) + "</b>"));
      tr.appendChild(el("td", "", esc(r.v)));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    tw.appendChild(t);
    wrap.appendChild(tw);

    wrap.appendChild(el("div", "section-head", '<span class="idx">03</span><h2>Three case briefs</h2>'));
    DESIGN_PLAYBOOK.cases.forEach(function (c, i) {
      var card = el("div", "card");
      card.appendChild(el("span", "card-num", "case " + (i + 1)));
      card.appendChild(el("h3", "", esc(c.title)));
      card.appendChild(el("p", "", "<em>" + esc(c.prompt) + "</em>"));
      var ol = el("ol");
      c.plan.forEach(function (p) { ol.appendChild(el("li", "", esc(p))); });
      card.appendChild(ol);
      card.appendChild(el("div", "pitfall", "<b>Trap</b>" + esc(c.trap)));
      wrap.appendChild(card);
    });

    wrap.appendChild(el("div", "section-head", '<span class="idx">04</span><h2>Red flags</h2>'));
    var rf = el("div", "card");
    var ul = el("ul");
    DESIGN_PLAYBOOK.redFlags.forEach(function (f) { ul.appendChild(el("li", "", esc(f))); });
    rf.appendChild(ul);
    wrap.appendChild(rf);

    wrap.appendChild(el("div", "section-head", '<span class="idx">05</span><h2>Self-scoring rubric</h2>'));
    var rubric = el("div", "check-card");
    rubric.appendChild(el("p", "small", "Score each line 0/1/2 while reviewing a recorded design. Below 10 means the structure is not automatic yet."));
    var rul = el("ul", "check-list");
    DESIGN_PLAYBOOK.rubric.forEach(function (r, i) {
      var li = el("li", "");
      var lab = el("label", "check");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      var key = "design-" + i;
      cb.checked = !!state.rehearsed[key];
      cb.addEventListener("change", function () {
        if (cb.checked) state.rehearsed[key] = true; else delete state.rehearsed[key];
        save();
      });
      lab.appendChild(cb);
      lab.appendChild(el("span", "", esc(r)));
      li.appendChild(lab);
      rul.appendChild(li);
    });
    rubric.appendChild(rul);
    wrap.appendChild(rubric);

    crumbs.innerHTML = "<b>Reference</b> / system design";
    mount([wrap]);
  }

  function renderPositioning() {
    var wrap = el("div", "view-inner");
    wrap.appendChild(el("p", "kicker", "Reference"));
    wrap.appendChild(el("h1", "hero-title", esc(POSITIONING.title)));
    POSITIONING.intro.forEach(function (p) { wrap.appendChild(el("p", "lead", p)); });

    wrap.appendChild(el("div", "section-head", '<span class="idx">01</span><h2>Bridge: your experience to their signal</h2>'));
    var tw = el("div", "table-wrap");
    var t = el("table");
    var thead = el("thead");
    var tr = el("tr");
    POSITIONING.bridge.head.forEach(function (h) { tr.appendChild(el("th", "", esc(h))); });
    thead.appendChild(tr);
    t.appendChild(thead);
    var tb = el("tbody");
    POSITIONING.bridge.rows.forEach(function (row) {
      var r = el("tr");
      row.forEach(function (cell) { r.appendChild(el("td", "", esc(cell))); });
      tb.appendChild(r);
    });
    t.appendChild(tb);
    tw.appendChild(t);
    wrap.appendChild(tw);

    wrap.appendChild(el("div", "section-head", '<span class="idx">02</span><h2>Three stories, written down</h2>'));
    POSITIONING.stories.forEach(function (s) {
      var card = el("div", "card");
      card.appendChild(el("h3", "", esc(s.title)));
      card.appendChild(el("p", "small", esc(s.prompt)));
      card.appendChild(el("p", "", "<em>" + esc(s.example) + "</em>"));
      card.appendChild(el("div", "probe", "<b>Check</b> " + esc(s.check)));
      wrap.appendChild(card);
    });

    wrap.appendChild(el("div", "section-head", '<span class="idx">03</span><h2>Answers you should not improvise</h2>'));
    var qcard = el("div", "card tight");
    POSITIONING.answers.forEach(function (a) {
      qcard.appendChild(questionNode({ id: "p-" + a.q.slice(0, 6), cat: "Positioning", q: a.q, a: ["<p>" + esc(a.a) + "</p>"] }));
    });
    wrap.appendChild(qcard);

    wrap.appendChild(el("div", "section-head", '<span class="idx">04</span><h2>Name your gaps before they do</h2>'));
    var g = el("div", "card");
    var ul = el("ul");
    POSITIONING.gaps.forEach(function (x) { ul.appendChild(el("li", "", esc(x))); });
    g.appendChild(ul);
    wrap.appendChild(g);

    wrap.appendChild(el("div", "section-head", '<span class="idx">05</span><h2>The two-minute opening</h2>'));
    var sc = el("div", "card");
    POSITIONING.script.forEach(function (s, i) {
      sc.appendChild(el("p", "", '<span class="card-num">' + pad(i + 1) + "</span> " + s));
    });
    wrap.appendChild(sc);

    crumbs.innerHTML = "<b>Reference</b> / positioning";
    mount([wrap]);
  }

  function renderSources() {
    var wrap = el("div", "view-inner");
    wrap.appendChild(el("p", "kicker", "Reference"));
    wrap.appendChild(el("h1", "hero-title", esc(SOURCES.title)));
    SOURCES.intro.forEach(function (p) { wrap.appendChild(el("p", "lead", esc(p))); });

    SOURCES.groups.forEach(function (g, i) {
      wrap.appendChild(el("div", "section-head", '<span class="idx">' + pad(i + 1) + "</span><h2>" + esc(g.title) + "</h2>"));
      var card = el("div", "card");
      g.links.forEach(function (l) {
        var row = el("div", "");
        row.style.cssText = "padding:10px 0;border-bottom:1px solid var(--line);";
        row.innerHTML = '<a href="' + l.u + '" target="_blank" rel="noopener"><strong>' + esc(l.t) + "</strong></a>" +
          '<div class="small">' + esc(l.d) + "</div>";
        card.appendChild(row);
      });
      card.lastChild.style.borderBottom = "0";
      wrap.appendChild(card);
    });

    wrap.appendChild(el("div", "section-head", '<span class="idx">05</span><h2>What this site does not know</h2>'));
    var u = el("div", "card");
    var ul = el("ul");
    SOURCES.unknowns.forEach(function (x) { ul.appendChild(el("li", "", esc(x))); });
    u.appendChild(ul);
    wrap.appendChild(u);

    crumbs.innerHTML = "<b>Reference</b> / sources";
    mount([wrap]);
  }

  /* ---------------- timer ---------------- */

  var timerInterval = null;
  var timerState = null;

  function startTimer(mins) {
    timerState = { endAt: Date.now() + mins * 60000, total: mins * 60000, paused: false, remaining: mins * 60000 };
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(timerState)); } catch (e) {}
    timerEl.hidden = false;
    tickTimer();
    timerInterval = setInterval(tickTimer, 500);
  }

  function tickTimer() {
    if (!timerState) return;
    var left = timerState.paused ? timerState.remaining : timerState.endAt - Date.now();
    if (left <= 0) {
      timerDisplay.textContent = "00:00";
      clearInterval(timerInterval);
      timerInterval = null;
      timerState = null;
      try { localStorage.removeItem(TIMER_KEY); } catch (e) {}
      document.title = "Block finished — Mistral Sprint";
      return;
    }
    var s = Math.ceil(left / 1000);
    timerDisplay.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }

  timerDisplay.addEventListener("click", function () {
    if (!timerState) return;
    if (timerState.paused) {
      timerState.endAt = Date.now() + timerState.remaining;
      timerState.paused = false;
    } else {
      timerState.remaining = timerState.endAt - Date.now();
      timerState.paused = true;
    }
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(timerState)); } catch (e) {}
  });

  document.getElementById("timer-stop").addEventListener("click", function () {
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = null;
    timerEl.hidden = true;
    try { localStorage.removeItem(TIMER_KEY); } catch (e) {}
  });

  function restoreTimer() {
    try {
      var raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return;
      var t = JSON.parse(raw);
      if (!t || !t.endAt) return;
      if (!t.paused && t.endAt < Date.now()) { localStorage.removeItem(TIMER_KEY); return; }
      timerState = t;
      timerEl.hidden = false;
      tickTimer();
      timerInterval = setInterval(tickTimer, 500);
    } catch (e) {}
  }

  /* ---------------- theme, drawer, reset ---------------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved) { applyTheme(saved); return; }
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    applyTheme(dark);
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  }

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  document.getElementById("theme-toggle-m").addEventListener("click", toggleTheme);

  function openDrawer() {
    rail.classList.add("open");
    scrim.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    rail.classList.remove("open");
    scrim.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", function () {
    if (rail.classList.contains("open")) closeDrawer(); else openDrawer();
  });
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  document.getElementById("reset-progress").addEventListener("click", function () {
    if (!window.confirm("Clear all checklist progress, rehearsed answers and the start date?")) return;
    try {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(TIMER_KEY);
    } catch (e) {}
    state = load();
    route();
  });

  /* ---------------- boot ---------------- */

  initTheme();
  restoreTimer();
  window.addEventListener("hashchange", route);
  if (!location.hash) location.hash = "#/home";
  route();
})();
