/* ============================================================
   LE SPA DE BLONZAC — Scripts
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- 1. En-tête au scroll ---------- */
  const header = $(".site-header");
  const toTop  = $(".to-top");
  const bar    = $(".read-progress");

  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-solid", y > 60);
    if (toTop)  toTop.classList.toggle("is-on", y > 640);
    if (bar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------- 2. Menu mobile ---------- */
  const burger = $(".burger");
  const mnav   = $(".mobile-nav");

  const setMenu = (open) => {
    if (!burger || !mnav) return;
    burger.classList.toggle("is-open", open);
    mnav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      $$(".mobile-nav a").forEach((a, i) => {
        a.style.transitionDelay = 0.08 + i * 0.055 + "s";
      });
    } else {
      $$(".mobile-nav a").forEach((a) => (a.style.transitionDelay = "0s"));
    }
  };

  if (burger) {
    burger.addEventListener("click", () =>
      setMenu(!mnav.classList.contains("is-open"))
    );
  }
  if (mnav) {
    $$(".mobile-nav a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- 3. Slider hero ---------- */
  const slides = $$(".hero__slide");
  const dots   = $$(".hero__dot");
  if (slides.length > 1) {
    let cur = 0;
    let timer;

    const go = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === cur));
      dots.forEach((d, k) => d.classList.toggle("is-active", k === cur));
    };

    const play = () => { timer = setInterval(() => go(cur + 1), 6200); };
    const stop = () => clearInterval(timer);

    dots.forEach((d, k) => d.addEventListener("click", () => { stop(); go(k); play(); }));

    const hero = $(".hero");
    if (hero) {
      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", play);
    }

    go(0);
    play();
  }

  /* ---------- 3 bis. Effet de survol des images (relief 3D) ---------- */
  const fine  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fxEls = $$(".imgfx");

  if (fine && !calm && fxEls.length) {
    fxEls.forEach((el) => {
      const img = $("img", el);
      if (!img) return;
      let raf = null;

      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--rx", (px * 5).toFixed(2) + "deg");
          el.style.setProperty("--ry", (-py * 5).toFixed(2) + "deg");
        });
      });

      el.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- 4. Révélation au scroll ---------- */
  const revealEls = $$(".reveal");
  let revealedAny = false;

  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            revealedAny = true;
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    /* Filet de sécurité : si l'observateur ne s'est jamais déclenché
       (JS partiel, navigateur exotique), on révèle tout le contenu. */
    setTimeout(() => {
      if (!revealedAny) revealEls.forEach((el) => el.classList.add("is-in"));
    }, 2500);
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- 5. Compteurs ---------- */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = (el.dataset.dec | 0) || 0;
      const dur = 1600;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec).replace(".", ",");
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(dec).replace(".", ",");
      };
      requestAnimationFrame(tick);
    };
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { animate(en.target); co.unobserve(en.target); }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- 6. Galerie + lightbox ---------- */
  const items = $$(".gallery__item");
  if (items.length) {
    const lb        = $(".lightbox");
    const lbImg     = $(".lightbox__img");
    const lbCap     = $(".lightbox__cap");
    const lbCounter = $(".lightbox__count");
    let idx = 0;

    const data = items.map((el) => ({
      src: el.dataset.full || $("img", el).src,
      cap: el.dataset.caption || "",
      sub: el.dataset.sub || ""
    }));

    const render = () => {
      const d = data[idx];
      lbImg.src = d.src;
      lbImg.alt = d.cap;
      lbCap.innerHTML = "";
      if (d.sub) {
        const b = document.createElement("b");
        b.textContent = d.sub;
        lbCap.appendChild(b);
      }
      if (d.cap) {
        const s = document.createElement("span");
        s.textContent = d.cap;
        lbCap.appendChild(s);
      }
      if (lbCounter) lbCounter.textContent = idx + 1 + " / " + data.length;
    };

    const open = (i) => {
      idx = i;
      render();
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    };
    const close = () => {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
    const move = (step) => { idx = (idx + step + data.length) % data.length; render(); };

    items.forEach((el, i) => el.addEventListener("click", () => open(i)));

    const btnPrev = $(".lightbox__btn--prev");
    const btnNext = $(".lightbox__btn--next");
    const btnClose = $(".lightbox__close");
    if (btnPrev)  btnPrev.addEventListener("click", (e) => { e.stopPropagation(); move(-1); });
    if (btnNext)  btnNext.addEventListener("click", (e) => { e.stopPropagation(); move(1); });
    if (btnClose) btnClose.addEventListener("click", close);
    if (lb) lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

    document.addEventListener("keydown", (e) => {
      if (!lb || !lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
  }

  /* ---------- 7. Filtre galerie ---------- */
  const filters = $$(".filter");
  if (filters.length) {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const f = btn.dataset.filter;
        $$(".gallery__item").forEach((it) => {
          const show = f === "all" || (it.dataset.tags || "").includes(f);
          it.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- 8. Formulaire de contact ---------- */
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = $("#formStatus");
      const f = form.elements;
      const required = ["nom", "email", "message"];
      let ok = true;
      required.forEach((n) => {
        const el = f[n];
        if (!el || !el.value.trim()) { ok = false; el.style.borderColor = "#c0392b"; }
        else el.style.borderColor = "";
      });
      if (!ok) {
        if (status) {
          status.style.color = "#c0392b";
          status.textContent = "Merci de compléter votre nom, votre e-mail et votre message.";
        }
        return;
      }
      const sujet = encodeURIComponent(
        "Demande de reservation — " + (f.nom.value || "") + " — " + (f.dates ? f.dates.value : "")
      );
      const corps = encodeURIComponent(
        "Nom : " + (f.nom.value || "") + "\n" +
        "E-mail : " + (f.email.value || "") + "\n" +
        "Telephone : " + (f.tel ? f.tel.value : "") + "\n" +
        "Dates souhaitees : " + (f.dates ? f.dates.value : "") + "\n" +
        "Voyageurs : " + (f.personnes ? f.personnes.value : "") + "\n\n" +
        (f.message.value || "")
      );
      window.location.href =
        "mailto:nouka971@gmail.com?subject=" + sujet + "&body=" + corps;
      if (status) {
        status.style.color = "";
        status.textContent = "Votre logiciel de messagerie va s'ouvrir avec votre demande pre-remplie.";
      }
    });
  }

  /* ---------- 9. Annee dynamique ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

})();
