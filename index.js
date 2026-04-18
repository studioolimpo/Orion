/* ==========================================================================

   STUDIO OLIMPO — ORION SRL

   Custom JavaScript

   ========================================================================== */


// -----------------------------------------
// BOOTSTRAP + GLOBAL STATE
// -----------------------------------------

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let navThemeTriggers = [];

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const hasSmooothy = typeof window.Smooothy !== "undefined";
if (typeof scrollLocked !== "undefined" && scrollLocked) lenis.stop();

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("loader", "0.16, 1, 0.3, 1");
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");

gsap.defaults({ ease: "osmo", duration: durationDefault });

const SEL_BASE = '[data-wf--transition--variant="base"]';
const SEL_PEEK = '[data-wf--transition--variant="peek"]';

let isFromPeek = false;

function lockScroll()   { if (lenis) lenis.stop(); }
function unlockScroll() { if (lenis) lenis.start(); }


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  preventSamePageClicks();
  initLanguageSwitcher();
  initNavThemeScroll();
  initIubendaPreferencesLink();
  initSignature();

  const ns = document.querySelector("[data-barba-namespace]")?.dataset?.barbaNamespace;
  
  if (ns === "soon") {
    if (typeof lockScroll === "function") lockScroll();
    initComingSoonLoader();
  } else {
    const loaderTl = initLogoRevealLoader();
    if (loaderTl) {
      window.__loaderTl = loaderTl;
      loaderTl.eventCallback("onComplete", () => {
        initMaskTextScrollReveal(document);
        initLogoWallCycle();
        initGlobalParallax();
      });
    }
  }

  if (document.querySelector('.nav_wrap')) initMenu();

  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  initPeekReset();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;
  
  sendGAPageView();
  initNavThemeScroll();
  initDynamicYear();
  initRevealOnScroll();
  initButtonReveal();
  cleanupFooterReveal();
  
  
  if (has('[data-sticky-steps-init]')) initStickyStepsBasic();
  
  if (has('[data-split="heading"]')) initMaskTextScrollReveal(nextPage);
  
  if (has('[data-smooothy]')) initSmoothySlider();
  
  if (has('[data-logo-wall-cycle-init]')) initLogoWallCycle();
  
  if (has('[data-parallax="trigger"]')) initGlobalParallax();

  if (hasLenis) lenis.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();

  setTimeout(() => initFooterPeek(), 150);
}


// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  tl.call(() => resetPage(next), null, 0);
  tl.call(() => { cleanupFooterReveal(); initFooterReveal(); }, null, 0.1);


  const loaderTl = window.__loaderTl;
  if (loaderTl) {
    const heroDelay = loaderTl.labels["heroReady"] ?? loaderTl.duration();
    gsap.delayedCall(heroDelay, () => runHero(document));
  }

  return tl;
}

// DEFAULT
function runPageLeaveAnimation(current, next) {
  const wrap  = document.querySelector(SEL_BASE);
  const panel = wrap.querySelector("[data-transition-panel]");
  const label = wrap.querySelector("[data-transition-label]");
  const text  = wrap.querySelector("[data-transition-label-text]");
  const index = wrap.querySelector("[data-transition-label-index]");
  const dark  = wrap.querySelector("[data-transition-dark]");

  const nextPageName = next.getAttribute("data-page-name");
  text.innerText = nextPageName || "Page";

  const nextPageIndex = next.getAttribute("data-page-index");
  index.innerText = nextPageIndex || "000";

  const navWrap = document.querySelector(".nav_wrap");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
      if (navWrap?.getAttribute("data-nav") === "open") {
        window.__resetNavState?.();
      }
    }
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(panel, { autoAlpha: 1 }, 0);
  tl.set(next,  { autoAlpha: 0 }, 0);

  tl.fromTo(panel,   { yPercent: 0 }, { yPercent: -100, duration: 0.8 }, 0);
  tl.fromTo(current, { y: "0vh" },    { y: "-15vh", duration: 0.8 }, 0);

  // ─── MENU SHIFT ───
  if (navWrap?.getAttribute("data-nav") === "open") {
    tl.to(navWrap, { y: "-15vh", duration: 0.5, ease: "power1.in" }, 0);
  }
  // ──────────────────

  if (dark) {
    tl.fromTo(dark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0);
  }

  tl.add(animateTransitionPanelContent(panel, "default"), 0.1);

  return tl;
}

function runPageEnterAnimation(next) {
  const wrap  = document.querySelector(SEL_BASE);
  const panel = wrap.querySelector("[data-transition-panel]");
  const label = wrap.querySelector("[data-transition-label]");
  const dark  = wrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    tl.call(() => { cleanupFooterReveal(); initFooterReveal(); }, null, "pageReady+=0.1");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 2.5);

  tl.call(() => applyNavThemeFromPage(next), null, "startEnter");
  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.fromTo(panel,
    { yPercent: -100 },
    { yPercent: -200, duration: 1, overwrite: "auto", immediateRender: false },
    "startEnter"
  );
  tl.set(panel, { autoAlpha: 0, yPercent: 0 }, ">");

  tl.fromTo(label,
    { autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.4, overwrite: "auto", immediateRender: false },
    "startEnter+=0.1"
  );

  if (dark) {
    tl.to(dark, {
      autoAlpha: 0,
      duration: 0.8,
      ease: "power2.inOut",
      overwrite: "auto",
      immediateRender: false,
    }, "startEnter");
  }

  tl.from(next, { y: "15vh", duration: 1 }, "startEnter");
  tl.add(runHero(next), "startEnter+=0.4");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");
  tl.call(() => initFooterReveal(), null, "pageReady+=0.1");

  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}

// PEEK
function runPeekLeaveAnimation(current, next) {
  const wrap      = document.querySelector(SEL_PEEK);
  const panel     = wrap.querySelector("[data-transition-panel]");
  const label     = wrap.querySelector("[data-transition-label]");
  const text      = wrap.querySelector("[data-transition-label-text]");
  const index     = wrap.querySelector("[data-transition-label-index]");
  const dark      = wrap.querySelector("[data-transition-dark]");
  const container = document.querySelector("[data-barba='container']");

  const nextPageName = next.getAttribute("data-page-name");
  if (text) text.innerText = nextPageName || "Page";

  const nextPageIndex = next.getAttribute("data-page-index");
  index.innerText = nextPageIndex || "000";

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
      const navWrap = document.querySelector(".nav_wrap");
      if (navWrap?.getAttribute("data-nav") === "open") {
        window.__resetNavState?.();
      }
    }
  });

  tl.set(next, { autoAlpha: 0 }, 0);

  tl.fromTo(panel, { yPercent: peekOffset() }, { yPercent: -100, duration: 0.8 }, 0);
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.8 }, 0);

  if (dark) {
    tl.to(dark, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0);
  }

  if (container) {
    tl.to(container, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0);
  }

  tl.add(animateTransitionPanelContent(panel, "peek-leave"), 0);

  return tl;
}

function runPeekEnterAnimation(next) {
  const wrap  = document.querySelector(SEL_PEEK);
  const panel = wrap.querySelector("[data-transition-panel]");
  const label = wrap.querySelector("[data-transition-label]");
  const dark  = wrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline();

  tl.add("startEnter", 2.5);

  tl.call(() => applyNavThemeFromPage(next), null, "startEnter");
  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.fromTo(panel,
    { yPercent: -100 },
    { yPercent: -200, duration: 1, overwrite: "auto", immediateRender: false },
    "startEnter"
  );
  tl.set(panel, { yPercent: 100 }, ">");
  tl.set(label, { autoAlpha: 0 }, ">");

  if (dark) {
    tl.to(dark, {
      autoAlpha: 0,
      duration: 0.8,
      ease: "power2.inOut",
      overwrite: "auto",
      immediateRender: false,
    }, "startEnter");
  }

  tl.from(next, { y: "15vh", duration: 1 }, "startEnter");
  tl.add(runHero(next), "startEnter+=0.4");

  tl.add("pageReady");
  tl.call(() => { isFromPeek = false; }, null, "pageReady");
  tl.call(resetPage, [next], "pageReady");
  tl.call(() => {
    document.body.style.overflow = "";
    document.documentElement.style.removeProperty('--viewport-height');
    gsap.set(wrap, { clearProps: "top,bottom,height,position,overflow,zIndex" });
  }, null, "pageReady+=0.05");

  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (!isFromPeek) cleanupFooterPeek();
  
  if (parallaxMM) {
    parallaxMM.revert();
    parallaxMM = null;
  }

  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);
  
  initLanguageSwitcher();

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) ScrollTrigger.refresh();
  
  applyNavThemeFromPage(data.next.container);
});

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,

  prevent: ({ el }) => {
    const href = el.getAttribute("href") || "";
    if (!href) return false;

    try {
      const currentURL = new URL(window.location.href);
      const nextURL = new URL(href, window.location.origin);

      const normalizePath = path => path.replace(/^\/it/, "").replace(/\/$/, "") || "/";

      const currentLang = currentURL.pathname.startsWith("/it") ? "it" : "en";
      const nextLang    = nextURL.pathname.startsWith("/it")    ? "it" : "en";

      const isSamePath   = normalizePath(currentURL.pathname) === normalizePath(nextURL.pathname);
      const isLangChange = currentLang !== nextLang;


      return isSamePath && isLangChange;
    } catch (_) {
      return false;
    }
  },

  transitions: [
    {
      name: "peek",
      custom: () => isFromPeek,
      sync: true,

      async leave(data) {
        return runPeekLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPeekEnterAnimation(data.next.container);
      }
    },
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});


// -----------------------------------------
// SHARED HELPERS
// -----------------------------------------

const themeConfig = {
  light: { nav: "dark",  transition: "light" },
  dark:  { nav: "light", transition: "dark"  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;

  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) transitionEl.dataset.themeTransition = config.transition;

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) nav.dataset.themeNav = config.nav;
}

function applyNavThemeFromPage(container) {
  const nav = document.querySelector(".header_wrap");
  if (!nav || !window.colorThemes?.getTheme) return;

  const firstBlock = container?.querySelector("[data-animate-theme-to]");
  if (!firstBlock) return;

  const theme = firstBlock.getAttribute("data-animate-theme-to") || "dark";
  const brand = firstBlock.getAttribute("data-animate-brand-to") || undefined;

  gsap.to(nav, { ...colorThemes.getTheme(theme, brand), duration: 0, overwrite: true });
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1.0,
    normalizeWheel: true, // ← chiave per Safari
    smoothWheel: true
    
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) { last = innerWidth; fn.apply(this, args); }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) curr.setAttribute('aria-current', newStatus);
    else curr.removeAttribute('aria-current');

    curr.setAttribute('class', next.getAttribute('class') || '');
  });
}

function animateTransitionPanelContent(panel, type = "default") {
  const eyebrow     = panel.querySelector(".transition__eyebrow");
  const eyebrowKids = eyebrow ? Array.from(eyebrow.children) : [];
  const logo        = panel.querySelector(".transition__logo");
  const icon        = panel.querySelector(".transition__icon");

  const tl = gsap.timeline();

  if (type === "default") {
    if (eyebrowKids.length) gsap.set(eyebrowKids, { autoAlpha: 0, y: 6 });
    if (logo)  gsap.set(logo,  { autoAlpha: 0, y: 12 });
    if (icon)  gsap.set(icon,  { autoAlpha: 0, x: -10 });

    eyebrowKids.forEach((child, i) => {
      tl.to(child, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => gsap.set(child, { clearProps: "all" }),
      }, i * 0.09);
    });

    if (logo) {
      tl.to(logo, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => gsap.set(logo, { clearProps: "all" }),
      }, eyebrowKids.length * 0.09 + 0.3);
    }

    if (icon) {
      tl.to(icon, {
        autoAlpha: 1,
        x: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => gsap.set(icon, { clearProps: "all" }),
      }, eyebrowKids.length * 0.09 + 0.6);
    }

  } else if (type === "peek-leave") {

    // eyebrow già visibile dal _showPeek — init e anima solo logo e icon
    if (logo)  gsap.set(logo,  { autoAlpha: 0, y: 12 });
    if (icon)  gsap.set(icon,  { autoAlpha: 0, x: -10 });

    if (logo) {
      tl.to(logo, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => gsap.set(logo, { clearProps: "all" }),
      }, 0.5);
    }

    if (icon) {
      tl.to(icon, {
        autoAlpha: 1,
        x: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => gsap.set(icon, { clearProps: "all" }),
      }, 0.7);
    }
  }

  return tl;
}

function cleanupFooterReveal() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  delete footer.dataset.soFooterInit;
}

function showHeroHeadingsWithoutMotion(scope = document) {
  const root = scope || document;
  const heroHeadings = Array.from(
    root.querySelectorAll('[data-split="heading"][data-split-scope="hero"]')
  );

  if (!heroHeadings.length) return;

  heroHeadings.forEach((heading) => {
    heading.dataset.soHeroAnimated = "true";

    gsap.set(heading, {
      clearProps: "visibility",
      autoAlpha: 1,
    });

    const splitParts = heading.querySelectorAll(".line, .word, .letter");
    if (splitParts.length) {
      gsap.set(splitParts, {
        clearProps: "all",
        autoAlpha: 1,
      });
    }

    heading.querySelectorAll("strong").forEach((strong) => {
      strong.classList.add("u-underline-visible");
    });
  });
}


// -----------------------------------------
// GLOBAL FEATURES
// -----------------------------------------

function preventSamePageClicks() {
  // Bind once, Barba-safe
  if (window.__soSamePageGuardBound) return () => {};
  window.__soSamePageGuardBound = true;

  const normPath = (p) =>
    (p || "")
      .replace(/\/index\.html?$/i, "")
      .replace(/\/+$/g, "") || "/";

  const getOffset = () =>
    parseFloat(document.documentElement.getAttribute("data-anchor-offset") || "0") || 0;

  const getTargetFromHash = (hash) => {
    if (!hash || hash.length < 2) return null;

    const id = decodeURIComponent(hash.slice(1));
    if (!id) return null;

    // Prima prova getElementById
    const byId = document.getElementById(id);
    if (byId) return byId;

    // Fallback querySelector escaped
    try {
      const safeId = window.CSS?.escape ? CSS.escape(id) : id;
      return document.querySelector(`#${safeId}`);
    } catch (_) {
      return null;
    }
  };

  const isModifiedClick = (e) =>
    e.defaultPrevented ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button === 1;

  const isSkippableLink = (a, e) => {
    const href = (a.getAttribute("href") || "").trim();
    const hrefLower = href.toLowerCase();

    return (
      !href ||
      href === "#" ||
      hrefLower.startsWith("javascript:") ||
      hrefLower.startsWith("mailto:") ||
      hrefLower.startsWith("tel:") ||
      isModifiedClick(e) ||
      a.target === "_blank" ||
      a.hasAttribute("download") ||
      a.rel === "external" ||
      a.dataset.allowSame === "true"
    );
  };

  const scrollToTarget = (target, offset = 0) => {
    if (!target) return;

    if (lenis?.scrollTo) {
      lenis.scrollTo(target, { offset: -offset });
    } else {
      const top = window.pageYOffset + target.getBoundingClientRect().top - offset;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    if ((window.scrollY || window.pageYOffset || 0) < 2) return;

    if (lenis?.scrollTo) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const onClick = (e) => {
    const a = e.target.closest?.("a[href]");
    if (!a || isSkippableLink(a, e)) return;

    let dest;
    try {
      dest = new URL(a.getAttribute("href"), location.href);
    } catch (_) {
      return;
    }

    // Solo stessa origin
    if (dest.origin !== location.origin) return;

    const sameBase =
      normPath(dest.pathname) === normPath(location.pathname) &&
      dest.search === location.search;

    if (!sameBase) return;

    // Da qui in poi: è stessa pagina
    e.preventDefault();

    const offset = getOffset();

    if (dest.hash) {
      const target = getTargetFromHash(dest.hash);

      if (target) {
        scrollToTarget(target, offset);
        return;
      }

      // Se hash esiste ma target non trovato, fallback:
      // aggiorna comunque URL hash senza jump brusco
      try {
        history.pushState(null, "", dest.hash);
      } catch (_) {}
      return;
    }

    // Nessun hash: scroll top
    scrollToTop();
  };

  document.addEventListener("click", onClick, true);

  // Cleanup opzionale
  return () => {
    try {
      document.removeEventListener("click", onClick, true);
    } catch (_) {}

    try {
      delete window.__soSamePageGuardBound;
    } catch (_) {}
  };
}

function initDynamicYear() {
        const year = String(new Date().getFullYear());

        // 1) Cerca dentro lo scope corrente (container Barba o document)
        const scopedEls = document.querySelectorAll("[data-dynamic-year]");

        // 2) Cerca anche in tutto il documento (per elementi globali fuori container)
        const docEls = document.querySelectorAll("[data-dynamic-year]");

        // 3) Deduplica (nel caso un elemento sia in entrambe le liste)
        const all = new Set([...scopedEls, ...docEls]);

        all.forEach((el) => {
            el.textContent = year;
        });

        return () => { };
    }

function initIubendaPreferencesLink() {
  if (window.__iubendaPrefBound) return;
  window.__iubendaPrefBound = true;

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".iubenda-cs-preferences-link");
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();


    if (window._iub?.cs?.api?.openPreferences) {
      _iub.cs.api.openPreferences();
    } else {
      console.warn("[iubenda] openPreferences OFF");
    }
  }, true);
}

function sendGAPageView() {
  if (typeof gtag !== "function") return;

  const lastUpdate = [...(window.dataLayer || [])]
    .reverse()
    .find(item => Array.isArray(item) && item[0] === "consent" && item[1] === "update");

  const isGranted = lastUpdate?.[2]?.analytics_storage === "granted";
  if (!isGranted) return;

  gtag("event", "page_view", {
    page_path:     window.location.pathname,
    page_title:    document.title,
    page_location: window.location.href,
    send_to:       "G-2WL4DJFC3W",
  });
}

function initLanguageSwitcher() {
  const currentLang = window.location.pathname.startsWith("/it") ? "it" : "en";

  const getHrefForLang = (targetLang) => {
    const currentPath = window.location.pathname;
    const isCurrentlyIt = currentPath.startsWith("/it");

    if (targetLang === "it") {
      // Da EN → IT: aggiungi /it davanti
      if (isCurrentlyIt) return null; // già su italiano
      return "/it" + currentPath;
    } else {
      // Da IT → EN: rimuovi /it davanti
      if (!isCurrentlyIt) return null; // già su inglese
      return currentPath.replace(/^\/it/, "") || "/";
    }
  };

  document.querySelectorAll(".w-locales-item").forEach(item => {
    const btn   = item.querySelector("button.clickable_btn");
    const label = btn?.getAttribute("aria-label")?.trim().toLowerCase();
    if (!btn || !label) return;

    const wrap = item.querySelector(".button_main_wrap");
    const isCurrent = label === currentLang;

    if (isCurrent) {
      // Lingua corrente: disabilita hover, click e riduci opacità
      if (wrap) {
        wrap.style.opacity = "0.5";
        wrap.style.pointerEvents = "none";
      }
      btn.disabled = true;
      btn.dataset.langBound = "true";
      return;
    }

    // Lingua non corrente: ripristina stato
    if (wrap) {
      wrap.style.opacity = "";
      wrap.style.pointerEvents = "";
    }
    btn.disabled = false;

    if (btn.dataset.langBound) return;
    btn.dataset.langBound = "true";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const href = getHrefForLang(label);
      if (!href) return;

      window.location.href = href;
    });
  });
}

function initNavThemeScroll() {
  if (!window.gsap || !window.ScrollTrigger) return;

  const nav = document.querySelector(".header_wrap");
  if (!nav) return;

  navThemeTriggers.forEach((t) => t && t.kill && t.kill());
  navThemeTriggers = [];

  const blocks = Array.from(document.querySelectorAll("[data-animate-theme-to]"));
  if (!blocks.length) return;

  const run = () => {
    if (!window.colorThemes || typeof window.colorThemes.getTheme !== "function") return;

    const sorted = [...blocks].sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    sorted.forEach((el, i) => {
      const theme = el.getAttribute("data-animate-theme-to") || "light";
      const brand = el.getAttribute("data-animate-brand-to") || undefined;

      const prevEl = sorted[i - 1] || null;
      const prevTheme = prevEl?.getAttribute("data-animate-theme-to") || "light";
      const prevBrand = prevEl?.getAttribute("data-animate-brand-to") || undefined;

      const applyTheme = () => {
        gsap.to(nav, { ...colorThemes.getTheme(theme, brand), overwrite: "auto" });
      };

      const applyPrevTheme = () => {
        if (!prevEl) return;
        gsap.to(nav, { ...colorThemes.getTheme(prevTheme, prevBrand), overwrite: "auto" });
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 2%",
        end: "bottom 2%",
        onEnter:     applyTheme,
        onEnterBack: applyTheme,
        onLeaveBack: applyPrevTheme,
      });

      navThemeTriggers.push(st);
    });
  };

  if (window.colorThemes && typeof window.colorThemes.getTheme === "function") {
    run();
  } else {
    document.addEventListener("colorThemesReady", run, { once: true });
  }
}

function initMenu() {
  if (window.__menuInit) return;
  window.__menuInit = true;

  CustomEase.create("main", "0.62, 0.05, 0.01, 0.99");
  CustomEase.create("mainOut", "0.55, 0.05, 0.18, 1");

  const navWrap = document.querySelector(".nav_wrap");
  if (!navWrap) return;

  const overlay = navWrap.querySelector(".nav_overlay");
  const menu = navWrap.querySelector(".nav_menu");
  const bgPanels = navWrap.querySelectorAll(".nav_menu_panel");
  const menuToggles = document.querySelectorAll("[data-menu-toggle]");
  const menuLinks = navWrap.querySelectorAll(".nav_menu_link");
  const menuIndexs = navWrap.querySelectorAll(".nav_menu_index");
  const menuButton = document.querySelector(".menu_btn_wrap");
  const menuButtonLayout = menuButton?.querySelectorAll(".menu_btn_layout") || [];
  const menuDivider = navWrap.querySelectorAll(".nav_menu_divider");
  const menuList = navWrap.querySelector(".nav_menu_list");
  const menuFooter = navWrap.querySelector(".nav_menu_footer");

  const SHIFT_Y = 70;
  const SHIFT_DURATION = 0.9;
  const SHIFT_EASE = "power2.out";

  let tl = gsap.timeline();
  const getContainer = () => document.querySelector("[data-barba='container']");

  const stopSlideshow  = () => window.__slideshowStop?.();
  const startSlideshow = () => window.__slideshowStart?.();

  // --- NAV THEME SNAPSHOT ---
  let savedNavTheme = null;

  const snapNavTheme = () => {
    const blocks = Array.from(document.querySelectorAll("[data-animate-theme-to]"));

    if (!blocks.length) {
      savedNavTheme = { theme: "light", brand: undefined };
      return;
    }

    const scrollY = window.scrollY || 0;
    const threshold = window.innerHeight * 0.02;

    let active = blocks[0];
    for (const el of blocks) {
      const top = el.getBoundingClientRect().top + scrollY;
      if (top <= scrollY + threshold) {
        active = el;
      } else {
        break;
      }
    }

    savedNavTheme = {
      theme: active.getAttribute("data-animate-theme-to") || "light",
      brand: active.getAttribute("data-animate-brand-to") || undefined,
    };

  };

  const restoreNavTheme = () => {
    const nav = document.querySelector(".header_wrap");
    if (!nav || !savedNavTheme || !window.colorThemes?.getTheme) return;
    gsap.to(nav, { ...colorThemes.getTheme(savedNavTheme.theme, savedNavTheme.brand), overwrite: true });
    savedNavTheme = null;
  };

  const forceNavLight = () => {
    const nav = document.querySelector(".header_wrap");
    if (!nav) return;
    if (window.colorThemes?.getTheme) {
      gsap.to(nav, { ...colorThemes.getTheme("light"), overwrite: true });
    } else {
      nav.setAttribute("data-theme-nav", "light");
    }
  };

  const resetNavState = () => {
    restoreNavTheme();
    tl.clear();
    navWrap.setAttribute("data-nav", "closed");
    gsap.set(navWrap, { clearProps: "y,opacity,visibility", display: "none" });
    gsap.to(menuButtonLayout, { yPercent: 0, duration: 0.5, ease: "power2.out" });
    const barbaContainer = getContainer();
    if (barbaContainer) gsap.set(barbaContainer, { clearProps: "y" });
  };

  window.__resetNavState = resetNavState;

  const openNav = () => {
    snapNavTheme();

    if (window.colorThemes?.getTheme) {
      forceNavLight();
    } else {
      document.addEventListener("colorThemesReady", forceNavLight, { once: true });
    }

    navWrap.setAttribute("data-nav", "open");
    const barbaContainer = getContainer();

    stopSlideshow();

    // ─── HIDE PEEK ─────────────────────────────────────────
    const peekWrap = document.querySelector(SEL_PEEK);
    const wasP = isPeeking;
    if (peekWrap) {
      if (isPeeking) {
        const peekPanel = peekWrap.querySelector("[data-transition-panel]");
        const peekLabel = peekWrap.querySelector("[data-transition-label]");
        _hidePeek(peekWrap, peekPanel, peekLabel);
      }
      gsap.set(peekWrap, { zIndex: 0 });
    }
    window.__peekWasVisible = wasP;
    // ─────────────────────────────────────────────────────────────────────

    tl.clear()
      .set(navWrap, { display: "block" })
      .set(menu, { yPercent: 0 }, "<")
      .set(menuLinks, { autoAlpha: 0, y: 0, yPercent: 0 }, "<")
      .set(menuIndexs, { autoAlpha: 0, yPercent: 20 }, "<")
      .set(menuFooter, { autoAlpha: 0, yPercent: 30 }, "<")
      .set(menuButtonLayout, { yPercent: 0 }, "<")
      .set(overlay, { autoAlpha: 0 }, "<")
      .set(bgPanels, { yPercent: 101 }, "<")
      .set(menuList, { yPercent: 10 }, "<")
      .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "<")
      .fromTo(bgPanels, { yPercent: 101 }, { yPercent: 0, duration: 0.85 }, "<0.05")
      .fromTo(menuButtonLayout, { yPercent: 0 }, { yPercent: -110, duration: 1 }, "<")
      .to(barbaContainer, { y: -SHIFT_Y, duration: SHIFT_DURATION, ease: SHIFT_EASE }, 0.25)
      .fromTo(menuList, { yPercent: 10 }, { yPercent: 0, duration: 1, ease: "power2.out" }, "-=0.9")
      .fromTo(menuIndexs, { y: 0, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, "<")
      .fromTo(menuLinks, { autoAlpha: 0, y: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, "<0.1")
      .fromTo(menuFooter, { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.7 }, "<0.3");

    navWrap.querySelectorAll("a[href]").forEach(a => {
      try {
        const url = new URL(a.getAttribute("href"), location.href);
        if (url.origin === location.origin) barba.prefetch(url.pathname);
      } catch (_) {}
    });
  };

  const closeNav = () => {
    navWrap.setAttribute("data-nav", "closed");
    const barbaContainer = getContainer();

    startSlideshow();

    // ─── RESTORE PEEK ─────────────────────────────────────────────────
    const peekWrap = document.querySelector(SEL_PEEK);
    if (peekWrap) {
      gsap.set(peekWrap, { zIndex: 200 });
    }
    // ─────────────────────────────────────────────────────────────────────

    tl.clear()
      .to(menuLinks, { yPercent: -40, autoAlpha: 0, duration: 0.35, stagger: 0.03, ease: "osmo" })
      .to(menuIndexs, { autoAlpha: 0, duration: 0.25 }, "<")
      .to(menuFooter, { autoAlpha: 0, yPercent: 15, duration: 0.25 }, "<")
      .to(barbaContainer, { y: 0, duration: 0.25, ease: "power2.inOut" }, "<")
      .set(barbaContainer, { y: SHIFT_Y })
      .call(() => restoreNavTheme())
      .to(bgPanels, { yPercent: -101, duration: 0.5, ease: "mainOut" }, "<")
      .to(barbaContainer, { y: 0, duration: 0.6, ease: SHIFT_EASE }, "-=0.5")
      .to(overlay, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, "<0.02")
      .to(menuButtonLayout, { yPercent: 0, duration: 0.7 }, "<")
      .set(navWrap, { display: "none" })
      .set(barbaContainer, { clearProps: "y" })
      .call(() => {
        // ─── REOPEN PEEK IFVISIBLE ─────────────────────────────────
        if (window.__peekWasVisible && peekWrap && peekHref) {
          const peekPanel = peekWrap.querySelector("[data-transition-panel]");
          const peekLabel = peekWrap.querySelector("[data-transition-label]");
          _showPeek(peekWrap, peekPanel, peekLabel);
        }
        window.__peekWasVisible = false;
        // ─────────────────────────────────────────────────────────────────
      });
  };

  // TOGGLE BUTTON
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (navWrap.getAttribute("data-nav") === "open") {
        closeNav();
        if (lenis) try { lenis.start(); } catch (_) {}
      } else {
        openNav();
        if (lenis) try { lenis.stop(); } catch (_) {}
      }
    });
  });

  // LINK CLICK
  navWrap.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (
      a.hostname !== window.location.host ||
      href.includes("#") ||
      a.target === "_blank" ||
      navWrap.getAttribute("data-nav") !== "open"
    ) return;

    e.preventDefault();

    const norm = (p) => (p || "").replace(/\/+$/, "") || "/";

    if (norm(window.location.pathname) === norm(href)) {
      closeNav();
      if (lenis) try { lenis.start(); } catch (_) {}
    } else {
      if (lenis) try { lenis.start(); } catch (_) {}
      barba.go(href);
    }
  });
}

function initSignature() {
  if (window.__signatureInit) return;
  window.__signatureInit = true;

  if (!window.console || typeof window.console.log !== "function") return;

  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");

  const printSignature = () => {
    const isDark = mq?.matches;

    const theme = isDark
      ? {
          bg: "#111111",
          text: "#F8F6F1",
          muted: "#C8C2B8",
        }
      : {
          bg: "#F8F6F1",
          text: "#111111",
          muted: "#5F5A52",
        };

    const common = [
      `background:${theme.bg}`,
      "font-size:12px",
      "font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      "line-height:1.4",
    ].join(";");

    const creditsStyle = [
      common,
      `color:${theme.muted}`,
      "padding:10px 14px 2px 14px",
    ].join(";");

    const brandStyle = [
      common,
      `color:${theme.text}`,
      "font-weight:600",
      "padding:0 14px 2px 14px",
    ].join(";");

    const urlStyle = [
      common,
      `color:${theme.muted}`,
      "padding:0 14px 10px 14px",
    ].join(";");

    console.log("%cCredits", creditsStyle);
    console.log("%cStudio Olimpo | Above the ordinary", brandStyle);
    console.log("%chttps://www.studioolimpo.it", urlStyle);
  };

  printSignature();

  mq?.addEventListener?.("change", printSignature);
  mq?.addListener?.(printSignature);
}

// -----------------------------------------
// SITE MODULES
// -----------------------------------------


// -----------------------------------------
// FOOTER PEEK
// -----------------------------------------

let peekST         = null;
let isPeeking      = false;
let peekHref       = null;
let peekClickBound = null;

// ─── PEEK OFFSET ─────────────────────────────────────────────────────────────
const peekOffset = () => parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--peek-offset')
) || -7.5;
// ─────────────────────────────────────────────────────────────────────────────

function initPeekReset() {
  const wrap = document.querySelector(SEL_PEEK);
  if (!wrap) return;
  const panel = wrap.querySelector("[data-transition-panel]");
  const label = wrap.querySelector("[data-transition-label]");

  gsap.set(wrap, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: "auto",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: 200,
    clearProps: "height",
  });

  gsap.set(panel, { yPercent: 100 });
  gsap.set(label, { autoAlpha: 0 });
}

function initFooterPeek() {
  if (peekST) { peekST.kill(); peekST = null; }
  const wrap = document.querySelector(SEL_PEEK);

  if (wrap) {
    const p = wrap.querySelector("[data-transition-panel]");
    if (p && peekClickBound) p.removeEventListener("click", peekClickBound);
  }

  isPeeking = false;
  peekHref  = null;

  if (!wrap) { return; }

  const href  = nextPage.dataset?.nextPageHref;
  const name  = nextPage.dataset?.nextPage;
  const index = nextPage.dataset?.nextPageIndex;

  const panel      = wrap.querySelector("[data-transition-panel]");
  const label      = wrap.querySelector("[data-transition-label]");
  const labelText  = wrap.querySelector("[data-transition-label-text]");
  const labelIndex = wrap.querySelector("[data-transition-label-index]");

  // ─── RESET PANEL ────────────────────────────────────────────────
  const logo        = panel?.querySelector(".transition__logo");
  const icon        = panel?.querySelector(".transition__icon");
  const eyebrow     = panel?.querySelector(".transition__eyebrow");
  const eyebrowKids = eyebrow ? Array.from(eyebrow.children) : [];

  gsap.set(panel,       { yPercent: 100, pointerEvents: "none" });
  gsap.set(wrap,        { pointerEvents: "none" });
  gsap.set(label,       { autoAlpha: 0 });
  if (logo)             gsap.set(logo,        { clearProps: "all" });
  if (icon)             gsap.set(icon,        { clearProps: "all" });
  if (eyebrowKids.length) gsap.set(eyebrowKids, { clearProps: "all" });
  // ─────────────────────────────────────────────────────────────────────────

  if (!href) {
    gsap.set(panel, { yPercent: 100, pointerEvents: "none" });
    gsap.set(wrap,  { pointerEvents: "none" });
    return;
  }

  peekHref = href;

  if (labelText  && name)  labelText.textContent  = name;
  if (labelIndex && index) labelIndex.textContent = index;

  peekST = ScrollTrigger.create({
    trigger: document.documentElement,
    start: "bottom bottom+=60",
    onEnter:     () => _showPeek(wrap, panel, label),
    onLeaveBack: () => _hidePeek(wrap, panel, label),
  });

  peekClickBound = () => _onPeekClick(wrap, panel, label);
  panel.addEventListener("click", peekClickBound);

}

function _showPeek(wrap, panel, label) {
  if (isPeeking) return;
  isPeeking = true;

  if (peekHref) barba.prefetch(peekHref);

  const eyebrow = panel.querySelector(".transition__eyebrow");
  const eyebrowKids = eyebrow ? Array.from(eyebrow.children) : [];
  const dark = document.querySelector(`${SEL_PEEK} [data-transition-dark]`);
  const container = document.querySelector("[data-barba='container']");

  gsap.killTweensOf([panel, label, dark, container, ...eyebrowKids]);

  gsap.set(wrap, { pointerEvents: "none", zIndex: 500 });
  gsap.set(panel, { pointerEvents: "auto", cursor: "pointer" });

  if (eyebrowKids.length) {
    gsap.set(eyebrowKids, { autoAlpha: 0, y: 6 });
  }

  gsap.set(label, { autoAlpha: 0 });

  const tl = gsap.timeline();

  tl.to(panel, {
    yPercent: peekOffset(),
    duration: 1.2,
    ease: "parallax",
    overwrite: true,
  }, 0);

  tl.to(label, {
    autoAlpha: 1,
    duration: 0.35,
    ease: "power2.out",
    overwrite: true,
  }, 0.18);

  eyebrowKids.forEach((child, i) => {
    tl.to(child, {
      autoAlpha: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      overwrite: true,
      onComplete: () => gsap.set(child, { clearProps: "opacity,visibility,transform" }),
    }, 0.22 + i * 0.06);
  });

  if (window.matchMedia("(any-hover: hover)").matches) {
    panel.removeEventListener("mouseenter", _onPeekHoverIn);
    panel.removeEventListener("mouseleave", _onPeekHoverOut);
    panel.addEventListener("mouseenter", _onPeekHoverIn);
    panel.addEventListener("mouseleave", _onPeekHoverOut);
  }

}

function _onPeekHoverIn() {
  const panel     = document.querySelector(`${SEL_PEEK} [data-transition-panel]`);
  const dark      = document.querySelector(`${SEL_PEEK} [data-transition-dark]`);
  const container = document.querySelector("[data-barba='container']");

  gsap.to(panel, { yPercent: -12, duration: 0.5, ease: "parallax", overwrite: "auto" });

  if (dark) {
    gsap.to(dark, {
      autoAlpha: 0.3,
      duration: 0.9,
      ease: "power1.out",
      overwrite: "auto"
    });
  }

  if (container) {
    gsap.to(container, {
      opacity: 0.3,
      duration: 0.9,
      ease: "power1.out",
      overwrite: "auto"
    });
  }

  window.__smoothySlowStop?.();
}

function _onPeekHoverOut() {
  const panel     = document.querySelector(`${SEL_PEEK} [data-transition-panel]`);
  const dark      = document.querySelector(`${SEL_PEEK} [data-transition-dark]`);
  const container = document.querySelector("[data-barba='container']");

  gsap.to(panel, { yPercent: peekOffset(), duration: 0.5, ease: "parallax", overwrite: "auto" });

  if (dark) {
    gsap.to(dark, {
      autoAlpha: 0,
      duration: 0.9,
      ease: "power1.out",
      overwrite: "auto"
    });
  }

  if (container) {
    gsap.to(container, {
      opacity: 1,
      duration: 0.9,
      ease: "power1.out",
      overwrite: "auto"
    });
  }

  window.__smoothySlowStart?.();
}

function _hidePeek(wrap, panel, label) {
  if (!isPeeking) return;
  isPeeking = false;

  const eyebrow = panel.querySelector(".transition__eyebrow");
  const eyebrowKids = eyebrow ? Array.from(eyebrow.children) : [];
  const dark = document.querySelector(`${SEL_PEEK} [data-transition-dark]`);
  const container = document.querySelector("[data-barba='container']");

  gsap.killTweensOf([panel, label, dark, container, ...eyebrowKids]);

  gsap.set(panel, { pointerEvents: "none", cursor: "auto" });
  gsap.set(wrap, { zIndex: 200 });

  if (window.matchMedia("(any-hover: hover)").matches) {
    panel.removeEventListener("mouseenter", _onPeekHoverIn);
    panel.removeEventListener("mouseleave", _onPeekHoverOut);
  }

  const tl = gsap.timeline();

  tl.to(label, {
    autoAlpha: 0,
    duration: 0.2,
    ease: "power2.out",
    overwrite: true,
  }, 0);

  if (eyebrowKids.length) {
    tl.to(eyebrowKids, {
      autoAlpha: 0,
      y: 6,
      duration: 0.2,
      stagger: 0.02,
      ease: "power2.out",
      overwrite: true,
    }, 0);
  }

  tl.to(panel, {
    yPercent: 100,
    duration: 0.5,
    ease: "osmo",
    overwrite: true,
  }, 0.05);

  if (dark) {
    tl.to(dark, {
      autoAlpha: 0,
      duration: 0.35,
      ease: "power1.out",
      overwrite: true,
    }, 0);
  }

  if (container) {
    tl.to(container, {
      opacity: 1,
      duration: 0.35,
      ease: "power1.out",
      overwrite: true,
    }, 0);
  }

}

function _onPeekClick(wrap, panel, label) {
  if (!isPeeking || !peekHref) return;

  panel.removeEventListener("click", peekClickBound);
  if (window.matchMedia("(any-hover: hover)").matches) {
    panel.removeEventListener("mouseenter", _onPeekHoverIn);
    panel.removeEventListener("mouseleave", _onPeekHoverOut);
  }
  isPeeking = false;
  isFromPeek = true;

  // ─── FIX MOBILE UI BAR ───────────────────────────────────────────────
  document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  document.body.style.overflow = "hidden";
  // ─────────────────────────────────────────────────────────────────────

  if (lenis) lenis.stop();

  barba.go(peekHref);
}

function cleanupFooterPeek() {
  if (peekST) { peekST.kill(); peekST = null; }

  const wrap = document.querySelector(SEL_PEEK);
  if (wrap) {
    const panel = wrap.querySelector("[data-transition-panel]");
    const label = wrap.querySelector("[data-transition-label]");

    if (panel) {
      panel.removeEventListener("click", peekClickBound);
      panel.removeEventListener("mouseenter", _onPeekHoverIn);
      panel.removeEventListener("mouseleave", _onPeekHoverOut);
      gsap.set(panel, { yPercent: 100, pointerEvents: "none" });
    }

    gsap.set(wrap, { pointerEvents: "none" });
    if (label) gsap.set(label, { autoAlpha: 0 });
  }

  isPeeking = false;
  peekHref  = null;
  peekClickBound = null;
}


// -----------------------------------------
// LOADER LOGO REVEAL [data-load-wrap]
// -----------------------------------------

function initLogoRevealLoader() {
  const wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) return;

  const container = wrap.querySelector("[data-load-container]");
  const bg = wrap.querySelector("[data-load-bg]");
  const logo = wrap.querySelector("[data-load-logo]");
  const brackets = Array.from(wrap.querySelectorAll("[data-load-brackets]"));
  const counterEl = wrap.querySelector("[data-load-text]");
  const iconWrap = wrap.querySelector(".loader__icon-wrap");
  const resetTargets = Array.from(
    wrap.querySelectorAll('[data-load-reset]:not([data-load-text])')
  );
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap?.querySelector("[data-transition-dark]");

  // Logo SVG elements
  const logoSvgs = logo ? Array.from(logo.querySelectorAll(".u-svg")) : [];
  const logoPaths = logo ? Array.from(logo.querySelectorAll(".u-svg path")) : [];

  // Logo parts
  const pathsSando = logo ? Array.from(logo.querySelectorAll("#logo-sando path")) : [];
  const pathsJapan = logo
    ? Array.from(logo.querySelectorAll("#logo-japan > path, #logo-japan path"))
    : [];

  const allPaths = pathsSando.length || pathsJapan.length
    ? [...pathsSando, ...pathsJapan]
    : logoPaths;

  if (window.CustomEase && !gsap.parseEase("logoReveal")) {
    CustomEase.create("logoReveal", "0.22, 1, 0.36, 1");
  }

  if (typeof lockScroll === "function") lockScroll();

  // --- INIT STATES ---
  gsap.set(wrap, { display: "block", y: "0vh" });
  gsap.set(container, { autoAlpha: 1 });
  gsap.set(bg, { yPercent: 0 });

  if (iconWrap) gsap.set(iconWrap, { autoAlpha: 0, x: -10 });

  if (allPaths.length) gsap.set(allPaths, { autoAlpha: 0, y: 24 });
  if (logo) gsap.set(logo, { autoAlpha: 1 });
  if (logoSvgs.length) gsap.set(logoSvgs, { force3D: true });

  if (brackets.length === 2) {
    const bracketWidth = brackets[0].offsetWidth;
    const counterWidth = counterEl ? counterEl.offsetWidth : 0;
    const minGap = -24;
    const startX = (counterWidth / 2) + bracketWidth + minGap;

    gsap.set(brackets[0], { autoAlpha: 0, x:  startX });
    gsap.set(brackets[1], { autoAlpha: 0, x: -startX });
  }

  if (counterEl) {
    gsap.set(counterEl, { autoAlpha: 0 });
    counterEl.textContent = "0";
  }

  if (resetTargets.length) gsap.set(resetTargets, { autoAlpha: 1 });

  if (transitionDark) {
    gsap.set(transitionWrap, { zIndex: 1 });
    gsap.set(transitionDark, { autoAlpha: 0.9 });
  }

  // --- TIMING ---
  const T_BRACKET_OPEN  = 0.2;
  const T_COUNTER_START = 0.25;
  const T_LOGO_START    = 0.38;
  const T_ICON_START    = 0.3;
  const PROG_DUR        = 2.5;

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onInterrupt: () => { if (typeof unlockScroll === "function") unlockScroll(); },
    onComplete:  () => { if (typeof unlockScroll === "function") unlockScroll(); },
  });


  if (brackets.length === 2) {
    tl.to(brackets[0], {
      autoAlpha: 1,
      x: 0,
      duration: 0.9,
      ease: "osmo",
    }, T_BRACKET_OPEN);
    tl.to(brackets[1], {
      autoAlpha: 1,
      x: 0,
      duration: 0.9,
      ease: "osmo",
    }, T_BRACKET_OPEN);
  }

  // --- COUNTER ---
  if (counterEl) {
    tl.to(counterEl, { autoAlpha: 1, duration: 0.3, ease: "none" }, T_COUNTER_START);

    const count = { val: 0 };
    tl.to(
      count,
      {
        val: 100,
        duration: PROG_DUR - T_COUNTER_START,
        ease: "loader",
        onUpdate: () => {
          counterEl.textContent = Math.round(count.val);
        },
      },
      T_COUNTER_START
    );
  }

  // --- ICON ---
  if (iconWrap) {
    tl.to(
      iconWrap,
      {
        autoAlpha: 1,
        x: 0,
        duration: 1.0,
        ease: "power3.out",
        immediateRender: false,
      },
      T_ICON_START
    );
  }

  // --- LOGO PATHS ---
  if (allPaths.length) {
    tl.to(
      allPaths,
      {
        autoAlpha: 1,
        y: 0,
        duration: 2.0,
        stagger: { each: 0.07 },
        ease: "power2.out",
        immediateRender: false,
      },
      T_LOGO_START
    );
  }

  // --- EXIT ---
  tl.addLabel("exit", 2.8);
  tl.addLabel("heroReady", "exit+=0.45");

  tl.call(() => {
    if (typeof unlockScroll === "function") unlockScroll();
  }, null, "exit-=0.01");

  if (transitionDark) {
    tl.to(
      transitionDark,
      { autoAlpha: 0, duration: 0.7, ease: "power2.inOut", immediateRender: false },
      "exit+=0.2"
    );
  }

  tl.fromTo(
    nextPage,
    { y: "40vh" },
    { y: "0vh", duration: 0.9, ease: "parallax", clearProps: "transform", immediateRender: false },
    "exit-=0.25"
  );

  tl.to(
    wrap,
    { y: "-110vh", duration: 1, ease: "parallax", immediateRender: false },
    "exit"
  );

  // --- CLEANUP ---
  tl.addLabel("cleanup", "exit+=1.2");
  tl.set(wrap, { autoAlpha: 0, display: "none", clearProps: "transform" }, "cleanup");

  if (transitionWrap) {
    tl.set(transitionWrap, { clearProps: "zIndex" }, "cleanup");
  }

  tl.add(() => {
    document.documentElement.classList.remove("is-loading");
    if (logoSvgs.length) gsap.set(logoSvgs, { clearProps: "all" });
    if (allPaths.length) gsap.set(allPaths, { clearProps: "all" });
  }, "cleanup");

  return tl;
}


// -----------------------------------------
// TEXT REVEAL ON SCROLL [data-split="heading"]
// -----------------------------------------

function initMaskTextScrollReveal(scope = document) {
  if (!window.gsap || !window.SplitText || !window.ScrollTrigger) return () => {};
  try { gsap.registerPlugin(SplitText, ScrollTrigger); } catch (_) {}
  const root = scope || document;
  const headings = Array.from(root.querySelectorAll('[data-split="heading"]'));
  if (!headings.length) return () => {};

  const splitConfig = {
    lines: { duration: 1.6, stagger: 0.03 },
    words: { duration: 0.6, stagger: 0.06 },
    chars: { duration: 0.4, stagger: 0.01 },
  };

  const pickSplitTargets = (el) => {
    const kids = el.children ? Array.from(el.children) : [];
    return kids.length ? kids : el;
  };

  const run = () => {
    headings.forEach((heading) => {
      if (!heading) return;
      if (heading.dataset.soSplitInit === "true") return;
      if (heading.dataset.splitScope === "hero") return;
      heading.dataset.soSplitInit = "true";

      const typeRaw = (heading.dataset.splitReveal || "lines").toLowerCase();
      const type =
        typeRaw === "words" ? "words" :
        typeRaw === "chars" ? "chars" :
        "lines";
      const typesToSplit =
        type === "lines" ? "lines" :
        type === "words" ? "lines,words" :
        "lines,words,chars";
      const config = splitConfig[type];
      const targets = pickSplitTargets(heading);

      gsap.set(heading, { autoAlpha: 1 });

      SplitText.create(targets, {
        type: typesToSplit,
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",
        onSplit(instance) {
          const animTargets = instance[type];
          gsap.set(animTargets, { autoAlpha: 0 });

          const rect = heading.getBoundingClientRect();
          const alreadyVisible = rect.top < window.innerHeight * 0.8;

          if (alreadyVisible) {
            return gsap.to(animTargets, {
              autoAlpha: 1,
              duration: config.duration,
              stagger: config.stagger,
              ease: "power1.out",
              onComplete: () => gsap.set(animTargets, { clearProps: "opacity,visibility" }),
            });
          }

          return gsap.to(animTargets, {
            autoAlpha: 1,
            duration: config.duration,
            stagger: config.stagger,
            ease: "power1.out",
            onComplete: () => gsap.set(animTargets, { clearProps: "opacity,visibility" }),
            scrollTrigger: {
              trigger: heading,
              start: "clamp(top 90%)",
              once: true,
            },
          });
        },
      });
    });
  };

  if (document.fonts?.ready?.then) {
    document.fonts.ready.then(run);
  } else {
    run();
  }

  return () => {
    headings.forEach((h) => {
      if (h) delete h.dataset.soSplitInit;
    });
  };
}

// -----------------------------------------
// REVEAL ELEMENT ON SCROLL [data-reveal-group]
// -----------------------------------------

function initRevealOnScroll() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isDisplayContents(el) {
    return el.classList.contains("u-display-contents") ||
      getComputedStyle(el).display === "contents";
  }

  function findBoxAncestor(el) {
    let parent = el.parentElement;
    while (parent && isDisplayContents(parent)) {
      parent = parent.parentElement;
    }
    return parent || el;
  }

  function getVisualChildren(parent) {
    const result = [];
    for (const child of parent.children) {
      if (isDisplayContents(child)) {
        result.push(...getVisualChildren(child));
      } else {
        result.push(child);
      }
    }
    return result;
  }

  function parseStagger(el, fallback) {
    const raw = el.getAttribute("data-stagger");
    if (raw === null || raw === "") return fallback;
    const val = parseFloat(raw);
    return isNaN(val) ? fallback : val / 1000;
  }

  function readProp(attr, cssVar, styles, fallback) {
    const attrVal = attr?.trim();
    if (attrVal) return attrVal;
    const cssVal = styles.getPropertyValue(cssVar).trim();
    if (cssVal) return cssVal;
    return fallback;
  }

  function areStacked(slots) {
    if (slots.length <= 1) return false;
    const tops = new Set();
    slots.forEach((slot) => {
      const el = slot.type === "item" ? slot.el : slot.parentEl;
      if (el) tops.add(Math.round(el.getBoundingClientRect().top));
    });
    return tops.size > 1;
  }

  // ─── ANIMATE SLOT ─────────────────────────────────────────────────────────
  function animateSlot(slot, slotTime, tl, groupStaggerSec, animDuration, animEase) {
    if (slot.type === "item") {
      tl.to(slot.el, {
        y: 0,
        autoAlpha: 1,
        duration: animDuration,
        ease: animEase,
        onComplete: () => gsap.set(slot.el, { clearProps: "all" }),
      }, slotTime);

    } else if (slot.type === "nested") {
      if (slot.includeParent) {
        tl.to(slot.parentEl, {
          y: 0,
          autoAlpha: 1,
          duration: animDuration,
          ease: animEase,
          onComplete: () => gsap.set(slot.parentEl, { clearProps: "all" }),
        }, slotTime);
      }
      const nestedStaggerSec = parseStagger(slot.nestedEl, groupStaggerSec);
      Array.from(slot.nestedEl.children).forEach((nestedChild, ni) => {
        tl.to(nestedChild, {
          y: 0,
          autoAlpha: 1,
          duration: animDuration,
          ease: animEase,
          onComplete: () => gsap.set(nestedChild, { clearProps: "all" }),
        }, slotTime + ni * nestedStaggerSec);
      });

    } else if (slot.type === "eyebrow") {
      tl.to(slot.eyebrowEl, { autoAlpha: 1, duration: 0.01 }, slotTime);
      const eyebrowStagger = parseStagger(slot.eyebrowEl, 0.06);
      Array.from(slot.eyebrowEl.children).forEach((child, ei) => {
        tl.to(child, {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power1.out",
          onComplete: () => gsap.set(child, { clearProps: "all" }),
        }, slotTime + ei * eyebrowStagger);
      });
    }
  }

  // ─── EYEBROW SOLO (singleWrapper = eyebrow-group) ─────────────────────────
  function initEyebrowAlone(groupEl, eyebrowEl) {
    const triggerEl   = isDisplayContents(groupEl) ? findBoxAncestor(groupEl) : groupEl;
    const triggerStart = readProp(
      groupEl.getAttribute("data-start"),
      "--reveal-start",
      getComputedStyle(eyebrowEl),
      "top 90%"
    );
    const eyebrowStagger = parseStagger(eyebrowEl, 0.06);

    gsap.set(eyebrowEl, { autoAlpha: 0 });
    Array.from(eyebrowEl.children).forEach((child) => {
      gsap.set(child, { autoAlpha: 0, y: 0 });
    });

    ScrollTrigger.create({
      trigger: triggerEl,
      start: triggerStart,
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(eyebrowEl, { autoAlpha: 1, duration: 0.01 }, 0);
        Array.from(eyebrowEl.children).forEach((child, ei) => {
          tl.to(child, {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power1.out",
            onComplete: () => gsap.set(child, { clearProps: "all" }),
          }, ei * eyebrowStagger);
        });
      },
    });
  }

  // ─── MAIN ─────────────────────────────────────────────────────────────────
  const ctx = gsap.context(() => {
    document.querySelectorAll("[data-reveal-group]").forEach((groupEl) => {

      gsap.set(groupEl, { autoAlpha: 1 });

      const groupStaggerSec = parseStagger(groupEl, 0.1);
      const animDuration    = 1.4;
      const animEase        = "power2.out";

      if (prefersReduced) {
        gsap.set(groupEl, { clearProps: "all", y: 0, autoAlpha: 1 });
        return;
      }

      let directChildren = getVisualChildren(groupEl);

      // ─── SINGLE WRAPPER ─────────────────────────────────────────────────
      let singleWrapper = null;
      if (
        directChildren.length === 1 &&
        !directChildren[0].hasAttribute("data-reveal-group") &&
        !directChildren[0].hasAttribute("data-reveal-group-nested")
      ) {
        const onlyChild = directChildren[0];

        // caso: l'unico figlio è esso stesso un eyebrow-group
        if (onlyChild.hasAttribute("data-eyebrow-group")) {
          initEyebrowAlone(groupEl, onlyChild);
          return;
        }

        singleWrapper  = onlyChild;
        directChildren = getVisualChildren(singleWrapper);
      }

      const refEl  = singleWrapper || groupEl;
      const styles = getComputedStyle(refEl);

      const groupDistance = readProp(
        groupEl.getAttribute("data-distance"),
        "--reveal-distance",
        styles,
        "0em"
      );

      const triggerStart = readProp(
        groupEl.getAttribute("data-start"),
        "--reveal-start",
        styles,
        "top 90%"
      );

      let triggerEl;
      if (singleWrapper) {
        triggerEl = singleWrapper;
      } else if (isDisplayContents(groupEl)) {
        triggerEl = findBoxAncestor(groupEl);
      } else {
        triggerEl = groupEl;
      }

      // ─── CASE ───────────────────────────────────
      if (!directChildren.length) {
        const target = singleWrapper || (isDisplayContents(groupEl) ? null : groupEl);
        if (!target) return;
        gsap.set(target, { y: groupDistance, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: triggerEl,
          start: triggerStart,
          once: true,
          onEnter: () => gsap.to(target, {
            y: 0,
            autoAlpha: 1,
            duration: animDuration,
            ease: animEase,
            onComplete: () => gsap.set(target, { clearProps: "all" }),
          }),
        });
        return;
      }

      // ─── SLOT BUILDER ───────────────────────────────────────────────────
      const slots = [];
      directChildren.forEach((child) => {
        const nestedGroup = child.matches("[data-reveal-group-nested]")
          ? child
          : child.querySelector(":scope [data-reveal-group-nested]");

        const eyebrowEl = child.matches("[data-eyebrow-group]")
          ? child
          : child.querySelector(":scope [data-eyebrow-group]");

        if (nestedGroup) {
          const includeParent = child.getAttribute("data-ignore") === "false";
          slots.push({ type: "nested", parentEl: child, nestedEl: nestedGroup, includeParent });
        } else if (eyebrowEl) {
          slots.push({ type: "eyebrow", parentEl: child, eyebrowEl });
        } else {
          slots.push({ type: "item", el: child });
        }
      });

      // ─── INIT STATES ────────────────────────────────────────────────────
      slots.forEach((slot) => {
        if (slot.type === "item") {
          gsap.set(slot.el, { y: groupDistance, autoAlpha: 0 });

        } else if (slot.type === "nested") {
          if (slot.includeParent) gsap.set(slot.parentEl, { y: groupDistance, autoAlpha: 0 });
          const nestedD = slot.nestedEl.getAttribute("data-distance") || groupDistance;
          Array.from(slot.nestedEl.children).forEach((child) => {
            gsap.set(child, { y: nestedD, autoAlpha: 0 });
          });

        } else if (slot.type === "eyebrow") {
          gsap.set(slot.eyebrowEl, { autoAlpha: 0 });
          Array.from(slot.eyebrowEl.children).forEach((child) => {
            gsap.set(child, { autoAlpha: 0, y: 0 });
          });
        }
      });

      // ─── ANIMATE ────────────────────────────────────────────────────────
      const stacked = areStacked(slots);

      if (stacked) {
        slots.forEach((slot) => {
          const stTrigger = slot.type === "item"
            ? slot.el
            : slot.parentEl || slot.nestedEl;

          ScrollTrigger.create({
            trigger: stTrigger,
            start: triggerStart,
            once: true,
            onEnter: () => {
              const tl = gsap.timeline();
              animateSlot(slot, 0, tl, groupStaggerSec, animDuration, animEase);
            },
          });
        });

      } else {
        ScrollTrigger.create({
          trigger: triggerEl,
          start: triggerStart,
          once: true,
          onEnter: () => {
            const tl = gsap.timeline();
            slots.forEach((slot, si) => {
              animateSlot(slot, si * groupStaggerSec, tl, groupStaggerSec, animDuration, animEase);
            });
          },
        });
      }
    });
  });

  return () => ctx.revert();
}


// -----------------------------------------
// SMOOTHY SLIDER [data-smooothy="1"]
// -----------------------------------------

function initSmoothySlider() {

  const isMobile = !window.matchMedia("(any-hover: hover)").matches;
  const instances = [];

  const containers = document.querySelectorAll('[data-smooothy="1"]');
  if (!containers.length) return () => {};

  containers.forEach((container) => {
    if (container.dataset.smoothyInitialized === "true") return;
    container.dataset.smoothyInitialized = "true";

    const originalSlides = [...container.children];
    if (!originalSlides.length) return;

    // ─── CREATE TRACK ──────────────────────────────────────────────────────
    const track = document.createElement("div");
    track.style.cssText = "display:flex;flex-direction:row;align-items:flex-start;position:absolute;top:0;left:0;will-change:transform;";

    // ─── COPY A — slide original ────────────────────────────────────────
    const copyA = document.createElement("div");
    copyA.style.cssText = "display:flex;flex-direction:row;align-items:flex-start;flex-shrink:0;";
    originalSlides.forEach(slide => copyA.appendChild(slide));

    // ─── COPY B — clone ─────────────────────────────────────────────────
    const copyB = document.createElement("div");
    copyB.style.cssText = "display:flex;flex-direction:row;align-items:flex-start;flex-shrink:0;";
    originalSlides.forEach(slide => copyB.appendChild(slide.cloneNode(true)));
    copyB.setAttribute("aria-hidden", "true");

    track.appendChild(copyA);
    track.appendChild(copyB);

    // ─── SETUP CONTAINER ─────────────────────────────────────────────────
    container.style.cssText = "overflow:visible;width:100%;position:relative;";

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative;width:100%;overflow:visible;";
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    container.appendChild(track);

    // ─── PRELOAD IMAGE ──────────────────────────────────────
    const allImgs = [...track.querySelectorAll("img")];
    allImgs.forEach(img => {
      img.loading  = "eager";
      img.decoding = "sync";
    });

    const imagePromises = allImgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener("load",  resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    });

    // ─── DIMENSION ───────────────────────────────────────────────────────────
    let copyAWidth = 0;
    const measureCopyA = () => {
      copyAWidth = copyA.getBoundingClientRect().width;
      wrapper.style.height = copyA.getBoundingClientRect().height + "px";
    };

    // ─── STATE ───────────────────────────────────────────────────────────
    const scrollSpeed   = isMobile ? 20 : 20;
    const lerpFactor    = isMobile ? 0.06 : 0.09;
    const BRAKE_LERP    = isMobile ? 0.04 : 0.08;
    const RESUME_LERP   = isMobile ? 0.01 : 0.02;
    const DRAG_LERP     = isMobile ? 0.25 : 0.3;
    const INERTIA_DECAY = isMobile ? 0.95 : 0.97;

    let x                   = 0;
    let velocity            = 0;
    let isDragging          = false;
    let isCoasting          = false;
    let isPaused            = false;
    let lastPointerX        = 0;
    let lastPointerY        = 0;
    let dragVelocity        = 0;
    let smoothDragV         = 0;
    let coastVelocity       = 0;
    let speedMul            = 0;
    let speedMulTarget      = 1;
    let inView              = true;
    let measured            = false;
    let dragDirectionLocked = false;
    let dragDirection       = null;

    // ─── TICKER GSAP ─────────────────────────────────────────────────────
    const tickerFn = () => {
      if (!measured) {
        measureCopyA();
        if (copyAWidth > 0) measured = true;
        else return;
      }

      const sLerp = speedMulTarget < speedMul ? BRAKE_LERP : RESUME_LERP;
      speedMul += (speedMulTarget - speedMul) * sLerp;
      if (Math.abs(speedMulTarget - speedMul) < 0.001) speedMul = speedMulTarget;

      if (isDragging) {
        smoothDragV += (dragVelocity - smoothDragV) * DRAG_LERP;
        coastVelocity = smoothDragV;
        velocity = smoothDragV;
        dragVelocity = 0;
      } else if (isCoasting) {
        coastVelocity *= INERTIA_DECAY;
        if (Math.abs(coastVelocity) < 0.05) {
          coastVelocity = 0;
          isCoasting = false;
        }
        velocity = coastVelocity;
      } else {
        if (!isPaused && inView) {
          const autoV = (scrollSpeed / 60) * speedMul;
          velocity += (autoV - velocity) * lerpFactor;
        } else {
          velocity += (0 - velocity) * BRAKE_LERP;
        }
      }

      x -= velocity;

      if (x <= -copyAWidth) x += copyAWidth;
      if (x > 0) x -= copyAWidth;

      track.style.transform = `translateX(${x}px) translateZ(0)`;
    };

    gsap.ticker.add(tickerFn);

    // ─── DRAG HANDLERS ───────────────────────────────────────────────────
    const onPointerDown = (e) => {
      isDragging          = true;
      isCoasting          = false;
      speedMulTarget      = 0;
      lastPointerX        = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      lastPointerY        = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      dragVelocity        = 0;
      smoothDragV         = 0;
      coastVelocity       = 0;
      dragDirectionLocked = false;
      dragDirection       = null;
      document.body.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const px = e.clientX ?? e.touches?.[0]?.clientX ?? lastPointerX;
      const py = e.clientY ?? e.touches?.[0]?.clientY ?? lastPointerY;
      const dx = Math.abs(px - lastPointerX);
      const dy = Math.abs(py - lastPointerY);

      if (!dragDirectionLocked && (dx > 3 || dy > 3)) {
        dragDirection       = dx >= dy ? "horizontal" : "vertical";
        dragDirectionLocked = true;
      }

      if (dragDirection === "vertical") {
        isDragging     = false;
        speedMulTarget = 1;
        document.body.style.cursor = "";
        return;
      }

      if (dragDirection === "horizontal" && e.cancelable) {
        e.preventDefault();
      }

      dragVelocity = -(px - lastPointerX);
      lastPointerX = px;
      lastPointerY = py;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging          = false;
      isCoasting          = Math.abs(coastVelocity) > 0.5;
      speedMulTarget      = 1;
      dragDirection       = null;
      dragDirectionLocked = false;
      document.body.style.cursor = "";
    };

    wrapper.addEventListener("mousedown",  onPointerDown);
    wrapper.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove",   onPointerMove);
    window.addEventListener("touchmove",   onPointerMove, { passive: false });
    window.addEventListener("mouseup",     onPointerUp);
    window.addEventListener("touchend",    onPointerUp);

    // ─── CURSOR HOVER ───────────────────────────────────────────────────
    if (window.matchMedia("(any-hover: hover)").matches) {
      wrapper.addEventListener("mouseenter", () => {
        if (!isDragging) document.body.style.cursor = "grab";
      });
      wrapper.addEventListener("mouseleave", () => {
        if (!isDragging) document.body.style.cursor = "";
      });
    }

    // ─── INTERSECTION OBSERVER ───────────────────────────────────────────
    const io = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      if (!inView) speedMulTarget = 0;
      else if (!isPaused) speedMulTarget = 1;
    }, { threshold: 0.1 });
    io.observe(wrapper);

    // ─── VISIBILITY ──────────────────────────────────────────────────────
    const onVisChange = () => {
      if (document.hidden) { speedMulTarget = 0; }
      else if (inView && !isPaused) { speedMulTarget = 1; }
    };
    document.addEventListener("visibilitychange", onVisChange);

    // ─── RESIZE ──────────────────────────────────────────────────────────
    const onResize = () => { measured = false; };
    window.addEventListener("resize", onResize);

    // ─── FADE IN STAGGER ─────────────────────
    gsap.set(originalSlides, { autoAlpha: 0 });

    const doFadeIn = () => {
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(originalSlides, {
            autoAlpha: 1,
            duration: 1.2,
            stagger: 0.2,
            ease: "power1.out",
          });
        }
      });
      const rect = wrapper.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        gsap.to(originalSlides, {
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
        });
      }
    };

    Promise.all(imagePromises).then(doFadeIn);

    instances.push({
      wrapper, container, track, copyA, copyB,
      originalSlides,
      tickerFn, io, onVisChange, onResize,
      onPointerDown, onPointerMove, onPointerUp,
      getPaused:    ()  => isPaused,
      setPaused:    (v) => { isPaused = v; speedMulTarget = v ? 0 : 1; },
      setSpeedMul:  (v) => { speedMulTarget = v; },
    });
  });

  window.__smoothyStop  = () => instances.forEach(({ setPaused }) => {
    try { setPaused(true); } catch (_) {}
  });
  window.__smoothyStart = () => instances.forEach(({ setPaused }) => {
    try { setPaused(false); } catch (_) {}
  });

  window.__smoothySlowStop  = () => instances.forEach(({ setSpeedMul }) => {
    try { setSpeedMul(0); } catch (_) {}
  });
  window.__smoothySlowStart = () => instances.forEach(({ setSpeedMul, getPaused }) => {
    try { if (!getPaused()) setSpeedMul(1); } catch (_) {}
  });

  return () => {
    window.__smoothyStop       = null;
    window.__smoothyStart      = null;
    window.__smoothySlowStop   = null;
    window.__smoothySlowStart  = null;
    instances.forEach(({
      wrapper, container, track,
      originalSlides,
      tickerFn, io, onVisChange, onResize,
      onPointerDown, onPointerMove, onPointerUp,
    }) => {
      try { gsap.ticker.remove(tickerFn); } catch (_) {}
      try { io.disconnect(); } catch (_) {}
      try { document.removeEventListener("visibilitychange", onVisChange); } catch (_) {}
      try { window.removeEventListener("resize", onResize); } catch (_) {}
      try { wrapper.removeEventListener("mousedown",  onPointerDown); } catch (_) {}
      try { wrapper.removeEventListener("touchstart", onPointerDown); } catch (_) {}
      try { window.removeEventListener("mousemove", onPointerMove); } catch (_) {}
      try { window.removeEventListener("touchmove", onPointerMove); } catch (_) {}
      try { window.removeEventListener("mouseup",  onPointerUp); } catch (_) {}
      try { window.removeEventListener("touchend", onPointerUp); } catch (_) {}
      try { document.body.style.cursor = ""; } catch (_) {}
      try {
        originalSlides.forEach(slide => container.appendChild(slide));
        track.remove();
        wrapper.parentNode.insertBefore(container, wrapper);
        wrapper.remove();
      } catch (_) {}
      try { delete container.dataset.smoothyInitialized; } catch (_) {}
    });
    instances.length = 0;
  };
}


// -----------------------------------------
// STICKY STEP [data-sticky-steps-init]
// -----------------------------------------

function initStickyStepsBasic() {
  const containers = document.querySelectorAll("[data-sticky-steps-init]");
  if (!containers.length) return;

  containers.forEach((container) => {
    const items = [...container.querySelectorAll("[data-sticky-steps-item]")];
    if (!items.length) return;

    const visuals = items.map(item => item.querySelector(".sticky-steps__visual")).filter(Boolean);

    // ─── INIT STATES ─────────────────────────────────────────────────────
    visuals.forEach((v) => gsap.set(v, { autoAlpha: 0 }));

    // ─── REVEAL LAYOUT ────────────────────────────────────────────────────
    let isStacked = false;
    const checkLayout = () => {
      const containerWidth = container.getBoundingClientRect().width;
      const rootFontSize   = parseFloat(getComputedStyle(document.documentElement).fontSize);
      isStacked = containerWidth < 38 * rootFontSize;
    };

    checkLayout();
    requestAnimationFrame(checkLayout);

    const ro = new ResizeObserver(() => {
      const wasStacked = isStacked;
      checkLayout();
      if (wasStacked === isStacked) return;

      if (isStacked) {
       
        visuals.forEach(v => gsap.set(v, { autoAlpha: 1 }));
      } else {
        
        visuals.forEach((v, i) => {
          gsap.set(v, { autoAlpha: i === currentActive ? 1 : 0 });
        });
      }
    });
    ro.observe(container);

    // ─── CROSSFADE STEP (desktop) ─────────────────────────────────────────
    let currentActive = 0;

    function setActiveStep(activeIndex) {
      items.forEach((item, index) => {
        let status = "active";
        if (index < activeIndex) status = "before";
        if (index > activeIndex) status = "after";
        item.setAttribute("data-sticky-steps-item-status", status);
      });

      if (activeIndex === currentActive) return;
      currentActive = activeIndex;

      if (isStacked) return;

      visuals.forEach((v, i) => {
        gsap.to(v, {
          autoAlpha: i === activeIndex ? 1 : 0,
          duration: 0.6,
          ease: "power2.inOut",
          overwrite: true,
        });
      });
    }

    // ─── FADE IN ──────────────────────────────────────────────────────────
    
    requestAnimationFrame(() => {
      if (isStacked) {
        
        visuals.forEach((v) => {
          ScrollTrigger.create({
            trigger: v,
            start: "top 90%",
            once: true,
            onEnter: () => {
              gsap.to(v, { autoAlpha: 1, duration: 0.8, ease: "power2.out" });
            }
          });
        });
      } else {
        
        ScrollTrigger.create({
          trigger: container,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.to(visuals[0], { autoAlpha: 1, duration: 0.8, ease: "power2.out" });
          }
        });
      }
    });

    // ─── SCROLL UPDATE (desktop only) ─────────────────────────────────────
    const anchors = items
      .map(item => item.querySelector("[data-sticky-steps-anchor]"))
      .filter(Boolean);

    if (!anchors.length) return;

    ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      end: "bottom top",
      onUpdate: () => {
        if (isStacked) return;
        const viewportMid = window.innerHeight * 1.1;
        let activeIndex = 0;
        anchors.forEach((anchor, i) => {
          const rect = anchor.getBoundingClientRect();
          const anchorCenter = rect.top + rect.height / 2;
          if (anchorCenter <= viewportMid) activeIndex = i;
        });
        setActiveStep(activeIndex);
      },
    });
  });
}


// -----------------------------------------
// LOGO LOOP CYCLE [data-logo-wall-cycle-init]
// -----------------------------------------

function initLogoWallCycle() {
  const loopDelay = 3;
  const duration = 1.4;

  document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const items = Array.from(root.querySelectorAll('[data-logo-wall-item]'));
    if (!items.length) return;

    
    items.forEach(item => {
      item.querySelectorAll('[data-logo-wall-target]').forEach(el => {
        el.removeAttribute('data-logo-wall-target');
      });
      const firstImg = item.querySelector('img');
      if (firstImg) firstImg.setAttribute('data-logo-wall-target', '');
    });

    const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== null;
    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    if (!originalTargets.length) return;

    let visibleItems = [];
    let visibleCount = 0;
    let pool = [];
    let pattern = [];
    let patternIndex = 0;
    let tl;

    
    const slotCurrentSrc = new Map();

    function getSrc(el) {
      return el?.getAttribute('srcset') || el?.getAttribute('src') || '';
    }

    function isVisible(el) {
      return window.getComputedStyle(el).display !== 'none';
    }

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function getNextIdx() {
      if (patternIndex >= pattern.length) {
        const lastIdx = pattern[pattern.length - 1];
        let newPattern;
        do {
          newPattern = shuffleArray(
            Array.from({ length: visibleCount }, (_, i) => i)
          );
        } while (newPattern[0] === lastIdx);
        pattern = newPattern;
        patternIndex = 0;
      }
      return pattern[patternIndex++];
    }

    
    function pickIncoming() {
      const visibleSrcs = new Set(slotCurrentSrc.values());

      
      const safeIdx = pool.findIndex(clone => !visibleSrcs.has(getSrc(clone)));

      if (safeIdx === -1) {
        
        return pool.shift();
      }

      
      const [chosen] = pool.splice(safeIdx, 1);
      return chosen;
    }

    function setup() {
      if (tl) tl.kill();

      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;
      if (!visibleCount) return;

      pattern = shuffleArray(
        Array.from({ length: visibleCount }, (_, i) => i)
      );
      patternIndex = 0;
      slotCurrentSrc.clear();

      
      items.forEach(item => {
        item.querySelectorAll('[data-logo-wall-target]').forEach(el => {
          if (!originalTargets.includes(el)) el.remove();
        });
      });

      
      originalTargets.forEach(el => gsap.set(el, { autoAlpha: 0 }));

      
      const allClones = originalTargets.map(n => n.cloneNode(true));
      const shuffled = shuffleArray(allClones);

      
      const front = shuffled.slice(0, visibleCount);
      pool = shuffleArray(shuffled.slice(visibleCount));

      
      for (let i = 0; i < visibleCount; i++) {
        const clone = front[i];
        gsap.set(clone, { autoAlpha: 1 });
        visibleItems[i].appendChild(clone);
        slotCurrentSrc.set(i, getSrc(clone));
      }

      tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
      tl.call(swapNext);
      tl.play();
    }

    function swapNext() {
      const nowCount = items.filter(isVisible).length;
      if (nowCount !== visibleCount) {
        setup();
        return;
      }
      if (!pool.length) return;

      const idx = getNextIdx();
      const container = visibleItems[idx];

      const clones = Array.from(container.querySelectorAll('[data-logo-wall-target]'))
        .filter(el => !originalTargets.includes(el));

      if (clones.length > 1) return;
      const current = clones[0] || null;

      const incoming = pickIncoming();
      if (!incoming) return;

      
      slotCurrentSrc.set(idx, getSrc(incoming));

      gsap.set(incoming, { autoAlpha: 0 });
      container.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          autoAlpha: 0,
          duration,
          ease: 'power2.inOut',
          onComplete: () => {
            current.remove();
            pool.push(current);
          }
        });
      }

      gsap.to(incoming, {
        autoAlpha: 1,
        duration,
        delay: duration * 0.5,
        ease: 'power2.inOut'
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => tl?.play(),
      onLeave: () => tl?.pause(),
      onEnterBack: () => tl?.play(),
      onLeaveBack: () => tl?.pause()
    });

    document.addEventListener('visibilitychange', () => {
      document.hidden ? tl?.pause() : tl?.play();
    });
  });
}


// -----------------------------------------
// GLOBAL PARALLAX [data-parallax="trigger"]
// -----------------------------------------

let parallaxMM = null;
function initGlobalParallax() {
  if (parallaxMM) {
    parallaxMM.revert();
    parallaxMM = null;
  }

  parallaxMM = gsap.matchMedia();

  parallaxMM.add(
    {
      isMobile:          "(max-width: 479px)",
      isMobileLandscape: "(max-width: 767px)",
      isTablet:          "(max-width: 991px)",
      isDesktop:         "(min-width: 992px)",
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;

      const allTriggers = Array.from(
        document.querySelectorAll('[data-parallax="trigger"]')
      );

      const ctx = gsap.context(() => {
        allTriggers.forEach((trigger, index) => {

          const disable = trigger.getAttribute("data-parallax-disable");
          if (
            (disable === "mobile"          && isMobile) ||
            (disable === "mobileLandscape" && isMobileLandscape) ||
            (disable === "tablet"          && isTablet)
          ) return;

          
          const hasExplicitTarget = !!trigger.querySelector('[data-parallax="target"]');
          const target =
            trigger.querySelector('[data-parallax="target"]') ||
            trigger.querySelector('.u-background-slot .u-image') ||
            null;

          if (!target) return;

          const isHero = index === 0;

          // HERO
          if (isHero) {
            const startVal = parseFloat(trigger.getAttribute("data-parallax-start") ?? "15");
            const endVal   = parseFloat(trigger.getAttribute("data-parallax-end")   ?? "-15");

            const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top top";
            const scrollEndRaw   = trigger.getAttribute("data-parallax-scroll-end")   || "bottom top";

            gsap.fromTo(target,
              { y: startVal },
              {
                y: endVal,
                ease: "none",
                scrollTrigger: {
                  trigger,
                  start:  `clamp(${scrollStartRaw})`,
                  end:    `clamp(${scrollEndRaw})`,
                  scrub:  true,
                },
              }
            );

          // SECTION MID-PAGE
          } else {
            const intensity = parseFloat(
              trigger.getAttribute("data-parallax-intensity") ?? "15"
            );

            
            const scaleVal = 1 + (intensity * 2) / 100;
            gsap.set(target, { scale: scaleVal, transformOrigin: "center center" });

            const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
            const scrollEndRaw   = trigger.getAttribute("data-parallax-scroll-end")   || "bottom top";

            gsap.fromTo(target,
              { yPercent: -intensity },
              {
                yPercent: intensity,
                ease: "none",
                scrollTrigger: {
                  trigger,
                  start:  `clamp(${scrollStartRaw})`,
                  end:    `clamp(${scrollEndRaw})`,
                  scrub:  true,
                },
              }
            );
          }
        });
      });

      return () => ctx.revert();
    }
  );
}


// -----------------------------------------
// BUTTON REVEAL
// -----------------------------------------

function initButtonReveal() {
  if (!window.gsap || !window.ScrollTrigger) return;

  const wrappers = Array.from(
    document.querySelectorAll(".u-button-wrapper")
  ).filter(w => !w.closest("footer"));

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.soButtonInit === "true") return;
    wrapper.dataset.soButtonInit = "true";

    const buttons = Array.from(wrapper.querySelectorAll(".button_main_wrap"));
    if (!buttons.length) return;

    const isBracket = (btn) => {
      const icons = Array.from(btn.querySelectorAll(".button_main_icon"));
      return icons.some(ic => {
        const text = ic.textContent.trim();
        return text === "[" || text === "]";
      });
    };

    if (buttons.length === 1 && isBracket(buttons[0])) {
      const btn     = buttons[0];
      const element = btn.querySelector(".button_main_element:not(.is--second):not(.is--third)");
      if (!element) return;

      const icons    = Array.from(element.querySelectorAll(".button_main_icon"));
      const text     = element.querySelector(".button_main_text");
      const bracketL = icons[0] || null;
      const bracketR = icons[1] || null;

      if (bracketL) gsap.set(bracketL, { autoAlpha: 0, x: 8 });
      if (bracketR) gsap.set(bracketR, { autoAlpha: 0, x: -8 });
      if (text)     gsap.set(text,     { autoAlpha: 0 });

      ScrollTrigger.create({
        trigger: wrapper,
        start: "top 90%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          if (bracketL) tl.to(bracketL, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" }, 0);
          if (bracketR) tl.to(bracketR, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" }, 0);
          if (text)     tl.to(text,     { autoAlpha: 1, duration: 0.5, ease: "power1.out" }, 0.15);
        }
      });

    } else {
      buttons.forEach(btn => gsap.set(btn, { autoAlpha: 0, y: 8 }));

      ScrollTrigger.create({
        trigger: wrapper,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(buttons, {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            onComplete: () => gsap.set(buttons, { clearProps: "all" }),
          });
        }
      });
    }
  });
}


// -----------------------------------------
// FOOTER REVEAL
// -----------------------------------------

function initFooterReveal() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  if (footer.dataset.soFooterInit === "true") return;
  footer.dataset.soFooterInit = "true";

  const icon       = footer.querySelector(".footer_icon");
  const logo       = footer.querySelector(".footer_logo_wrap");
  const bottomWrap = footer.querySelector(".footer_bottom_wrap");

  // ─── INIT STATES ──────────────────────────────────────────────────────
  if (icon) gsap.set(icon, { autoAlpha: 0, x: -10 });

  const logoPaths = logo ? Array.from(logo.querySelectorAll("path")) : [];
  const logoText  = logo ? logo.querySelector("p") : null; // ← testo plain

  if (logo)             gsap.set(logo, { autoAlpha: 1 });
  if (logoPaths.length) gsap.set(logoPaths, { autoAlpha: 0, y: 12 });
  if (logoText)         gsap.set(logoText,  { autoAlpha: 0 }); // ← solo fade, no y

  const bottomGroups = bottomWrap
    ? Array.from(bottomWrap.querySelectorAll(".footer_bottom_group, .footer_bottom_list"))
    : [];
  if (bottomGroups.length) gsap.set(bottomGroups, { autoAlpha: 0, y: 10 });

  // ─── TRIGGER ICON ────────────────────────────────────────────────────
  if (icon) {
    ScrollTrigger.create({
      trigger: icon,
      start: "top 95%",
      once: true,
      onEnter: () => {
        gsap.to(icon, {
          autoAlpha: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    });
  }

  // ─── TRIGGER LOGO ─────────────────────────────────────────────────────
  if (logoPaths.length) {
    ScrollTrigger.create({
      trigger: logo || footer,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(logoPaths, {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          stagger: { each: 0.09 },
          ease: "power2.out",
        });

        // ─── TEXT ───────────────
        if (logoText) {
          gsap.to(logoText, {
            autoAlpha: 1,
            duration: 1.2,
            ease: "power1.out",
            delay: 0.3,
          });
        }
      }
    });
  }

  // ─── TRIGGER BOTTOM GROUPS ───────
  if (bottomGroups.length) {
    ScrollTrigger.create({
      trigger: bottomWrap,
      start: "top 99%",
      once: true,
      onEnter: () => {
        gsap.to(bottomGroups, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.2,
          ease: "power2.out",
          onComplete: () => gsap.set(bottomGroups, { clearProps: "all" }),
        });
      }
    });
  }
}


// -----------------------------------------
// HERO SYSTEM
// -----------------------------------------


// -----------------------------------------
// HERO REGISTRY
// -----------------------------------------

const HERO = {
  timelines: {
    home:      buildHeroHome,
    approach:  buildHeroApproach,
    focus:     buildHeroFocus,
    expertise: buildHeroExpertise,
    contact:   buildHeroContact,
    "404":     buildHero404,
    soon:      () => gsap.timeline(),
  },
};

function getPageNamespace(scope) {
  const container = scope?.matches?.('[data-barba="container"]')
    ? scope
    : scope?.querySelector?.('[data-barba="container"]');
  return container?.dataset?.barbaNamespace || "";
}

function runHero(scope) {
  const ns = getPageNamespace(scope);
  const builder = HERO.timelines[ns];
  if (typeof builder !== "function") {
    console.warn("[HERO] no builder for namespace:", ns);
    return gsap.timeline();
  }
  return builder(scope);
}


// -----------------------------------------
// SPLIT HERO
// -----------------------------------------

function splitHeroHeadings(scope) {
  const root = scope || document;
  const hero = root.querySelector('[data-hero]');
  if (!hero) return [];

  const splitConfig = {
    lines: { duration: 1.4, stagger: 0.03 },
    words: { duration: 0.6, stagger: 0.06 },
    chars: { duration: 0.4, stagger: 0.01 },
  };

  const pickSplitTargets = (el) => {
    const kids = el.children ? Array.from(el.children) : [];
    return kids.length ? kids : el;
  };

  const results = [];
  const headings = Array.from(
    hero.querySelectorAll('[data-split="heading"][data-split-scope="hero"]')
  );

  gsap.set(headings, { autoAlpha: 0 });

  headings.forEach((heading) => {
    heading.dataset.soSplitInit = "true";
    const typeRaw = (heading.dataset.splitReveal || "lines").toLowerCase();
    const type = typeRaw === "words" ? "words" : typeRaw === "chars" ? "chars" : "lines";
    const typesToSplit = type === "lines" ? "lines" : type === "words" ? "lines,words" : "lines,words,chars";
    const config = splitConfig[type];

    SplitText.create(pickSplitTargets(heading), {
      type: typesToSplit,
      linesClass: "line",
      autoSplit: true,
      onSplit(instance) {
        const animTargets = instance[type];

        if (heading.dataset.soHeroAnimated === "true") {
          gsap.set(heading, { autoAlpha: 1 });
          gsap.set(animTargets, { autoAlpha: 1, clearProps: "opacity,visibility" });
          const heroEl = heading.closest('[data-hero]');
          if (heroEl) heroEl.querySelectorAll('strong').forEach(s => s.classList.add('u-underline-visible'));
          return;
        }

        gsap.set(animTargets, { autoAlpha: 0 });
        results.push({ heading, animTargets, config });
      },
    });
  });

  return results;
}

function buildHeroHome(scope) {
  if (reducedMotion) {
    showHeroHeadingsWithoutMotion(scope);
    return gsap.timeline();
  }

  const tl = gsap.timeline();
  const entries = splitHeroHeadings(scope);

  entries.forEach(({ heading, animTargets, config }, i) => {
    tl.set(heading, { autoAlpha: 1 }, 0);
    tl.fromTo(
      animTargets,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: config.duration,
        stagger: config.stagger,
        ease: "power1.out",
        onComplete: () => {
          heading.dataset.soHeroAnimated = "true";
          gsap.set(animTargets, { clearProps: "opacity,visibility" });

          const heroEl = heading.closest("[data-hero]");
          if (heroEl) {
            heroEl.querySelectorAll("strong").forEach((s) => {
              s.classList.add("u-underline-visible");
            });
          }
        },
      },
      i * 0.9
    );
  });

  const strongs = scope
    ? Array.from(scope.querySelectorAll("[data-hero] strong"))
    : Array.from(document.querySelectorAll("[data-hero] strong"));

  if (strongs.length) {
    tl.call(() => {
      strongs.forEach((s) => s.classList.add("u-underline-visible"));
    }, null, 0.6);
  }

  return tl;
}

function buildHeroApproach(scope)  { return buildHeroHome(scope); }
function buildHeroFocus(scope)     { return buildHeroHome(scope); }
function buildHeroExpertise(scope) { return buildHeroHome(scope); }
function buildHeroContact(scope)   { return buildHeroHome(scope); }
function buildHero404(scope)   { return buildHeroHome(scope); }


// -----------------------------------------
// PAGE SPECIFIC MODULES
// -----------------------------------------


// -----------------------------------------
// COMING SOON
// -----------------------------------------

function initComingSoonLoader() {
  const wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) return;

  const bg       = wrap.querySelector("[data-load-bg]");
  const logo     = wrap.querySelector("[data-load-logo]");
  const brackets = Array.from(wrap.querySelectorAll("[data-load-brackets]"));
  const textEl   = wrap.querySelector("[data-load-text]");
  const iconWrap = wrap.querySelector(".loader__icon-wrap");

  const pathsSando = logo ? Array.from(logo.querySelectorAll("#logo-sando path")) : [];
  const pathsJapan = logo ? Array.from(logo.querySelectorAll("#logo-japan > path, #logo-japan path")) : [];
  const logoPaths  = logo ? Array.from(logo.querySelectorAll(".u-svg path")) : [];
  const allPaths   = pathsSando.length || pathsJapan.length
    ? [...pathsSando, ...pathsJapan]
    : logoPaths;

  const STRINGS  = ["coming soon", "presto online"];
  const LOOP_PAUSE = 3.5;
  let stringIndex  = 0;

  
  if (textEl) {
    textEl.textContent = STRINGS[0];
    textEl.style.width = "auto";
    gsap.set(textEl, { autoAlpha: 0 });
  }

  // --- INIT STATES ---
  gsap.set(wrap, { display: "block", y: "0vh", autoAlpha: 1 });
  if (bg)       gsap.set(bg,       { yPercent: 0 });
  if (iconWrap) gsap.set(iconWrap, { autoAlpha: 0, x: -10 });
  if (allPaths.length) gsap.set(allPaths, { autoAlpha: 0, y: 24 });
  if (logo)     gsap.set(logo,     { autoAlpha: 1 });

  
  const getBracketStartX = () => {
    if (brackets.length !== 2 || !textEl) return 0;
    const bracketWidth = brackets[0].offsetWidth;
    const textWidth    = textEl.offsetWidth;
    const minGap       = -24;
    return (textWidth / 2) + bracketWidth + minGap;
  };

  const setupBrackets = () => {
    const startX = getBracketStartX();
    gsap.set(brackets[0], { autoAlpha: 1, x:  startX });
    gsap.set(brackets[1], { autoAlpha: 1, x: -startX });
  };

  const swapText = () => {
    if (!textEl || brackets.length !== 2) return;

    const startX = getBracketStartX();

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(LOOP_PAUSE, swapText);
      }
    });

    tl.to(textEl, {
      autoAlpha: 0,
      duration: 0.35,
      ease: "power2.in",
    }, 0);

    tl.to(brackets[0], {
      x:  startX,
      duration: 0.55,
      ease: "osmo",
    }, 0.1);

    tl.to(brackets[1], {
      x: -startX,
      duration: 0.55,
      ease: "osmo",
    }, 0.1);

    tl.call(() => {
      stringIndex = (stringIndex + 1) % STRINGS.length;
      textEl.textContent = STRINGS[stringIndex];

      const newStartX = getBracketStartX();
      gsap.set(brackets[0], { x:  newStartX });
      gsap.set(brackets[1], { x: -newStartX });
    });

    tl.to(brackets[0], {
      x: 0,
      duration: 0.7,
      ease: "osmo",
    }, ">");

    tl.to(brackets[1], {
      x: 0,
      duration: 0.7,
      ease: "osmo",
    }, "<");

    tl.to(textEl, {
      autoAlpha: 1,
      duration: 0.45,
      ease: "power1.out",
    }, "<0.15");
  };

  const run = () => {
    setupBrackets();

    const T_BRACKET_OPEN = 0.2;
    const T_TEXT_START   = 0.32;
    const T_LOGO_START   = 0.38;
    const T_ICON_START   = 0.3;

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        if (typeof unlockScroll === "function") unlockScroll();
        document.documentElement.classList.remove("is-loading");

        gsap.delayedCall(LOOP_PAUSE, swapText);
      },
    });

    if (brackets.length === 2) {
      tl.to(brackets[0], { x: 0, duration: 0.9, ease: "osmo" }, T_BRACKET_OPEN);
      tl.to(brackets[1], { x: 0, duration: 0.9, ease: "osmo" }, T_BRACKET_OPEN);
    }

    if (textEl) {
      tl.to(textEl, {
        autoAlpha: 1,
        duration: 0.6,
        ease: "power1.out",
      }, T_TEXT_START);
    }

    if (iconWrap) {
      tl.to(iconWrap, {
        autoAlpha: 1,
        x: 0,
        duration: 1.0,
        ease: "power3.out",
        immediateRender: false,
      }, T_ICON_START);
    }

    if (allPaths.length) {
      tl.to(allPaths, {
        autoAlpha: 1,
        y: 0,
        duration: 2.0,
        stagger: { each: 0.07 },
        ease: "power2.out",
        immediateRender: false,
      }, T_LOGO_START);
    }

    return tl;
  };

  if (document.fonts?.ready?.then) {
    document.fonts.ready.then(run);
  } else {
    run();
  }
}