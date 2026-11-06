/* Chuma Gebashe · Progress updates — site logic (no build step, no backend) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var DATA = window.PROGRESS || { daily: {}, weekly: {}, monthly: {} };
  var SITE = {
    name: "Chuma Gebashe",
    tagline: "Retention & Renewals Intern at Sage",
    photo: "chuma.jpg"
  };

  var STATUS = {
    "done":        { label: "Done",        desc: "Finished and delivered" },
    "in-progress": { label: "In progress", desc: "Currently being worked on" },
    "todo":        { label: "To do",       desc: "Planned, not started" },
    "blocked":     { label: "Blocked",     desc: "Waiting on someone or something" }
  };
  var ORDER = ["done", "in-progress", "todo", "blocked"];

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  /* ---------- links (pretty URLs online, .html when opened from disk) ---------- */
  var LOCAL = location.protocol === "file:";
  function href(page, query) {
    var base = LOCAL ? (page === "" ? "index.html" : page + ".html") : "/" + page;
    return base + (query ? "?" + query : "");
  }

  /* ---------- dates ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s || "");
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1);
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function longDate(d) { return DAYS[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function monthLabel(d) { return MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function weekLabel(mon) {
    var sun = addDays(mon, 6);
    if (mon.getMonth() === sun.getMonth())
      return mon.getDate() + "–" + sun.getDate() + " " + MON_SHORT[sun.getMonth()] + " " + sun.getFullYear();
    if (mon.getFullYear() === sun.getFullYear())
      return mon.getDate() + " " + MON_SHORT[mon.getMonth()] + " – " + sun.getDate() + " " + MON_SHORT[sun.getMonth()] + " " + sun.getFullYear();
    return mon.getDate() + " " + MON_SHORT[mon.getMonth()] + " " + mon.getFullYear() + " – " + sun.getDate() + " " + MON_SHORT[sun.getMonth()] + " " + sun.getFullYear();
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function items(kind, key) { var b = DATA[kind] || {}; return Array.isArray(b[key]) ? b[key] : []; }
  function normStatus(s) { s = String(s || "todo").toLowerCase().replace(/\s+/g, "-"); return STATUS[s] ? s : "todo"; }
  function counts(list) {
    var c = { total: list.length, done: 0, "in-progress": 0, todo: 0, blocked: 0 };
    list.forEach(function (i) { c[normStatus(i.status)]++; });
    c.pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
    return c;
  }
  function $(id) { return document.getElementById(id); }

  var ICON = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ---------- shared header & footer ---------- */
  function renderChrome(page) {
    var nav = [["", "Overview", "overview"], ["daily", "Daily", "daily"], ["weekly", "Weekly", "weekly"], ["monthly", "Monthly", "monthly"], ["about", "About me", "about"]];
    var initials = SITE.name.split(" ").map(function (w) { return w[0]; }).join("");
    $("site-header").innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="' + href("") + '">' +
          '<span class="avatar"><img src="' + SITE.photo + '" alt="Photo of ' + esc(SITE.name) + '" onerror="this.remove()"><span class="initials">' + initials + '</span></span>' +
          '<span class="brand-text"><strong>' + esc(SITE.name) + '</strong><small>Progress updates</small></span>' +
        '</a>' +
        '<nav class="nav" aria-label="Main">' +
          nav.map(function (n) {
            return '<a href="' + href(n[0]) + '"' + (page === n[2] ? ' aria-current="page" class="active"' : "") + ">" + n[1] + "</a>";
          }).join("") +
        "</nav>" +
      "</div>";

    var upd = parseISO(DATA.lastUpdated);
    $("site-footer").innerHTML =
      '<div class="wrap footer-inner">' +
        "<span>" + esc(SITE.name) + " · " + esc(SITE.tagline) + "</span>" +
        (upd ? '<span class="muted">Last updated ' + longDate(upd) + "</span>" : "") +
      "</div>";
  }

  function progressBar(c) {
    return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + c.pct + '"><span style="--pct:' + c.pct + '%;width:' + c.pct + '%"></span></div>';
  }

  function itemList(list) {
    var sorted = list.slice().sort(function (a, b) { return ORDER.indexOf(normStatus(a.status)) - ORDER.indexOf(normStatus(b.status)); });
    return '<ul class="items">' + sorted.map(function (i) {
      var s = normStatus(i.status);
      return '<li class="item s-' + s + '">' +
        '<span class="pill s-' + s + '">' + STATUS[s].label + "</span>" +
        '<div class="item-body"><p class="item-title">' + esc(i.title) + "</p>" +
        (i.note ? '<p class="item-note">' + esc(i.note) + "</p>" : "") + "</div></li>";
    }).join("") + "</ul>";
  }

  /* ---------- overview ---------- */
  function renderOverview() {
    var t = today(), mon = mondayOf(t);
    var d = counts(items("daily", iso(t)));
    var w = counts(items("weekly", iso(mon)));
    var m = counts(items("monthly", monthKey(t)));
    var allDone = d.done + w.done + m.done;
    var allLeft = (d.total - d.done) + (w.total - w.done) + (m.total - m.done);

    $("status-line").innerHTML =
      '<span class="muted">Status as of ' + longDate(t) + "</span>" +
      '<span class="stat"><b>' + allDone + "</b> Done</span>" +
      '<span class="stat"><b>' + allLeft + "</b> Still to do</span>";

    function card(title, sub, c, page) {
      return '<article class="card">' +
        '<header><h3>' + title + '</h3><p class="muted">' + sub + "</p></header>" +
        '<p class="big">' + c.pct + '<small>%</small></p>' +
        progressBar(c) +
        '<p class="muted">' + (c.total ? c.done + " of " + c.total + " items done" : "Nothing planned yet.") + "</p>" +
        '<a class="btn" href="' + href(page) + '">Open ' + page + " view " + ICON.arrow + "</a>" +
      "</article>";
    }
    $("cards").innerHTML =
      card("Today", longDate(t), d, "daily") +
      card("This week", weekLabel(mon), w, "weekly") +
      card("This month", monthLabel(t), m, "monthly");

    // recently completed: newest first across all views
    var done = [];
    [["daily", "Day"], ["weekly", "Week"], ["monthly", "Month"]].forEach(function (k) {
      var bucket = DATA[k[0]] || {};
      Object.keys(bucket).forEach(function (key) {
        (bucket[key] || []).forEach(function (i) {
          if (normStatus(i.status) === "done") {
            var dt = parseISO(key);
            var when = k[0] === "daily" ? longDate(dt) : k[0] === "weekly" ? "Week of " + weekLabel(dt) : monthLabel(dt);
            done.push({ key: key, when: when, kind: k[1], title: i.title });
          }
        });
      });
    });
    done.sort(function (a, b) { return a.key < b.key ? 1 : -1; });
    $("recent").innerHTML = done.length
      ? '<ul class="recent">' + done.slice(0, 6).map(function (r) {
          return '<li><span class="pill s-done">' + r.kind + "</span><span>" + esc(r.title) + '</span><span class="muted">' + r.when + "</span></li>";
        }).join("") + "</ul>"
      : '<p class="empty-inline">Completed items will appear here as soon as they are ticked off.</p>';
  }

  /* ---------- daily / weekly / monthly ---------- */
  function renderPeriod(kind) {
    var param = new URLSearchParams(location.search).get("date");
    var t = today();
    var cur, key, prev, next, title, crumb, isNow, intro, emptyWord;

    if (kind === "daily") {
      cur = parseISO(param) || t;
      key = iso(cur); prev = iso(addDays(cur, -1)); next = iso(addDays(cur, 1));
      title = longDate(cur); isNow = key === iso(t);
      crumb = "Daily updates"; intro = "What I worked on and what is still outstanding for the day."; emptyWord = "day";
    } else if (kind === "weekly") {
      cur = mondayOf(parseISO(param) || t);
      key = iso(cur); prev = iso(addDays(cur, -7)); next = iso(addDays(cur, 7));
      title = "Week of " + weekLabel(cur); isNow = key === iso(mondayOf(t));
      crumb = "Weekly goals"; intro = "The goals I set for this week and how far along they are."; emptyWord = "week";
    } else {
      var p = parseISO(param) || t;
      cur = new Date(p.getFullYear(), p.getMonth(), 1);
      key = monthKey(cur);
      prev = monthKey(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
      next = monthKey(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
      title = monthLabel(cur); isNow = key === monthKey(t);
      crumb = "Monthly milestones"; intro = "The bigger milestones I'm working towards this month."; emptyWord = "month";
    }

    var nowWord = { daily: "Today", weekly: "This week", monthly: "This month" }[kind];
    var list = items(kind, key), c = counts(list);

    $("crumb").textContent = crumb + (isNow ? " · " + nowWord : "");
    $("title").textContent = title;
    $("intro").textContent = intro;
    document.title = { daily: "Daily updates", weekly: "Weekly goals", monthly: "Monthly milestones" }[kind] + " · " + SITE.name;

    $("pager").innerHTML =
      '<a class="icon-btn" href="' + href(kind, "date=" + prev) + '" aria-label="Previous ' + emptyWord + '">' + ICON.prev + "</a>" +
      '<a class="today-btn' + (isNow ? " is-now" : "") + '" href="' + href(kind) + '">' + nowWord + "</a>" +
      '<a class="icon-btn" href="' + href(kind, "date=" + next) + '" aria-label="Next ' + emptyWord + '">' + ICON.next + "</a>";

    $("summary").innerHTML =
      '<div class="summary-top"><div><p class="summary-head">' + (c.total ? (c.pct === 100 ? "All done" : c.pct + "% complete") : "Nothing logged yet") + "</p>" +
      '<p class="muted">' + c.done + " of " + c.total + " items done</p></div>" +
      '<ul class="counts">' + ORDER.map(function (s) {
        return '<li><span class="dot s-' + s + '"></span>' + STATUS[s].label + " <b>" + c[s] + "</b></li>";
      }).join("") + "</ul></div>" + progressBar(c);

    $("list").innerHTML = list.length
      ? itemList(list)
      : '<div class="empty"><h2>No updates for this ' + emptyWord + '.</h2><p class="muted">Nothing has been logged here yet. Use the arrows to look at another ' + emptyWord + ".</p></div>";
  }

  /* ---------- scroll drop-in animation ---------- */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span");
            w.className = "word"; w.textContent = part; w.style.setProperty("--w", i++);
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    el.classList.add("split");
  }

  function setupReveal() {
    document.querySelectorAll("main h1").forEach(splitWords);
    var groups = [".eyebrow", ".lede", ".role", ".status-line", ".tabs", ".pager", ".summary",
      "section > h2", ".card", ".panel", ".fact", ".focus li", ".item", ".empty", ".cta-row", ".bar"];
    var els = document.querySelectorAll(groups.join(","));
    els.forEach(function (el) {
      el.classList.add("reveal");
      // stagger siblings of the same kind
      var sibs = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) { return c.tagName === el.tagName && c.className === el.className; }) : [];
      var idx = Math.max(0, sibs.indexOf(el));
      el.style.setProperty("--d", Math.min(idx, 8) * 90 + "ms");
    });
    var targets = document.querySelectorAll(".reveal, .split");
    if (!("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    var bg = document.createElement("div");
    bg.className = "bg"; bg.setAttribute("aria-hidden", "true");
    bg.innerHTML = '<span class="g1"></span><span class="g2"></span><span class="g3"></span>';
    document.body.insertBefore(bg, document.body.firstChild);
    renderChrome(page);
    if (page === "overview") renderOverview();
    if (page === "daily" || page === "weekly" || page === "monthly") renderPeriod(page);
    var lg = $("legend");
    if (lg) lg.innerHTML = ORDER.map(function (s) {
      return '<li><span class="pill s-' + s + '">' + STATUS[s].label + "</span>" + STATUS[s].desc + "</li>";
    }).join("");
    setupReveal();
  });
})();
