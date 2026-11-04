(() => {
  /* Core */
  const CLS = "ov-active";
  const root = document.documentElement;
  let theaterWasOff = false;
  let hideTimer = null;

  const isWatch = () => location.pathname === "/watch";
  const flexy = () => document.querySelector("ytd-watch-flexy");
  const isTheater = () => !!flexy()?.hasAttribute("theater");
  const masthead = () => document.getElementById("masthead-container");

  const poke = () => {
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
  };

  const clickTheater = () =>
    document.querySelector(".ytp-size-button:not(.ov-button)")?.click();

  function enable() {
    if (!isWatch() || root.classList.contains(CLS)) return;
    if (!isTheater()) {
      theaterWasOff = true;
      clickTheater();
    }
    root.classList.add(CLS);
    window.scrollTo({ top: 0 });
    updateTooltip();
    poke();
  }

  function disable() {
    if (!root.classList.contains(CLS)) return;
    root.classList.remove(CLS);
    masthead()?.classList.remove("ov-show");
    if (theaterWasOff && isTheater()) clickTheater();
    theaterWasOff = false;
    updateTooltip();
    poke();
  }

  const toggle = () => (root.classList.contains(CLS) ? disable() : enable());

  /* Header functions */
  function showHeader() {
    clearTimeout(hideTimer);
    masthead()?.classList.add("ov-show");
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      const m = masthead();
      if (!m) return;
      /* keep open while typing in search */
      if (m.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
      m.classList.remove("ov-show");
    }, 350);
  }

  function setupHeader() {
    if (!document.getElementById("ov-hotzone")) {
      const z = document.createElement("div");
      z.id = "ov-hotzone";
      z.addEventListener("mouseenter", showHeader);
      document.body.appendChild(z);
    }
    const m = masthead();
    if (m && !m.dataset.ovBound) {
      m.dataset.ovBound = "1";
      m.addEventListener("mouseenter", showHeader);
      m.addEventListener("mouseleave", scheduleHide);
      m.addEventListener("focusout", scheduleHide);
    }
  }

  /* Recreate YouTube default tooltip */
  let tip = null;
  const tipLabel = () =>
    root.classList.contains(CLS) ? "Exit other view" : "Other view";

  function ensureTip() {
    if (tip && tip.isConnected) return tip;
    tip = document.createElement("div");
    tip.id = "ov-tooltip";
    tip.innerHTML = '<span class="ov-label"></span><span class="ov-key">O</span>';
    document.body.appendChild(tip);
    return tip;
  }

  function updateTooltip() {
    const t = ensureTip();
    t.querySelector(".ov-label").textContent = tipLabel();
    const b = document.querySelector(".ov-button");
    if (b) {
      b.setAttribute("aria-label", tipLabel() + " (O)");
      const active = root.classList.contains(CLS);
      if (b.dataset.ovState !== String(active)) {
        b.dataset.ovState = String(active);
        b.innerHTML = active ? ICON_EXIT : ICON;
      }
    }
  }

  function showTip(btn) {
    const t = ensureTip();
    updateTooltip();
    t.style.display = "inline-flex";
    const r = btn.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    t.style.left = left + "px";
    t.style.top = r.top - th - 21.5 + "px";
  }

  function hideTip() {
    if (tip) tip.style.display = "none";
  }

  /* Main icon */
  const ICON =
    '<svg viewBox="0 0 36 36" aria-hidden="true">' +
    '<path fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" ' +
    'd="M5 15v-3a4 4 0 0 1 4-4h4M31 15v-3a4 4 0 0 0-4-4h-4M5 21v3a4 4 0 0 0 4 4h4M31 21v3a4 4 0 0 1-4 4h-4"/></svg>';

  /* Exit icon */
  const ICON_EXIT =
    '<svg viewBox="0 0 36 36" aria-hidden="true">' +
    '<path fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" ' +
    'd="M3 13h6a4 4 0 0 0 4-4V5M33 13h-6a4 4 0 0 1-4-4V5M3 23h6a4 4 0 0 1 4 4v4M33 23h-6a4 4 0 0 0-4 4v4"/></svg>';

  function addButton() {
    if (document.querySelector(".ov-button")) return;
    const size = document.querySelector(".ytp-size-button");
    if (!size) return;
    const b = document.createElement("button");
    b.className = "ytp-button ov-button";
    b.setAttribute("aria-label", "Other view (o)");
    b.innerHTML = ICON;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      hideTip();
      toggle();
    });
    b.addEventListener("mouseenter", () => showTip(b));
    b.addEventListener("mouseleave", hideTip);
    size.parentElement.insertBefore(b, size);
    updateTooltip();
  }

  /* Keyboard shortcut */
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "o" || e.key === "O") {
        if (!isWatch()) return;
        e.preventDefault();
        e.stopPropagation();
        toggle();
      } else if (e.key === "Escape" && root.classList.contains(CLS)) {
        disable();
      }
    },
    true
  );

  /* Lifecycle */
  document.addEventListener("yt-navigate-finish", () => {
    if (!isWatch()) {
      root.classList.remove(CLS);
      theaterWasOff = false;
    }
    hideTip();
    setupHeader();
    addButton();
    updateTooltip();
  });

  setupHeader();
  addButton();

  setInterval(() => {
    setupHeader();
    if (isWatch()) addButton();
  }, 1500);
} )();
