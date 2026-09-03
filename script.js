(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("#menu-principal");
  const contactModal = document.querySelector("#contact-modal");
  const contactMain = document.querySelector("[data-contact-main]");
  const phoneView = document.querySelector("[data-phone-view]");
  const contactOptions = document.querySelectorAll(".contact-option");
  const billingRestrictedActions = new Set(["phone", "whatsapp", "visit"]);
  const whatsappOption = document.querySelector('[data-contact-action="whatsapp"]');
  const emailOption = document.querySelector('[data-contact-action="email"]');

  const setMenuState = (isOpen) => {
    document.body.classList.toggle("menu-open", isOpen);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.querySelector(".sr-only").textContent = isOpen ? "Fechar menu" : "Abrir menu";
    }
  };

  menuToggle?.addEventListener("click", () => {
    setMenuState(!document.body.classList.contains("menu-open"));
  });

  mainNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.querySelectorAll('a[href^="#"]:not([data-contact-trigger])').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;

      let target;
      try {
        target = document.querySelector(selector);
      } catch {
        return;
      }
      if (!target) return;

      event.preventDefault();
      setMenuState(false);
      const headerOffset = header?.getBoundingClientRect().height || 0;
      const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset - 12);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: targetTop, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  const isMobileDevice = () => Boolean(
    navigator.userAgentData?.mobile
      || /Android|iPhone|iPod|Windows Phone/i.test(navigator.userAgent)
  );

  const closeContactModal = () => {
    if (!contactModal) return;
    if (typeof contactModal.close === "function" && contactModal.open) contactModal.close();
    else contactModal.removeAttribute("open");
  };

  contactOptions.forEach((option) => {
    option.dataset.defaultHref = option.getAttribute("href") || "";
  });

  const restoreContactOptions = () => {
    contactOptions.forEach((option) => {
      const unavailableMessage = option.querySelector(".contact-option__unavailable");
      option.classList.remove("contact-option--disabled");
      option.removeAttribute("aria-disabled");
      option.removeAttribute("tabindex");
      if (option.dataset.defaultHref) option.setAttribute("href", option.dataset.defaultHref);
      unavailableMessage?.setAttribute("hidden", "");
    });
  };

  const setContactContext = (context) => {
    restoreContactOptions();
    if (context !== "billing") return;

    contactOptions.forEach((option) => {
      const isRestricted = billingRestrictedActions.has(option.dataset.contactAction);
      if (!isRestricted) return;
      const unavailableMessage = option.querySelector(".contact-option__unavailable");
      option.classList.add("contact-option--disabled");
      option.setAttribute("aria-disabled", "true");
      option.setAttribute("tabindex", "-1");
      option.removeAttribute("href");
      unavailableMessage?.removeAttribute("hidden");
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "bom dia";
    if (hour < 18) return "boa tarde";
    return "boa noite";
  };

  const getContactMessage = (trigger) => {
    const greeting = getGreeting();
    const roomName = trigger.closest(".room-card")?.querySelector("h3")?.textContent.trim();

    if (roomName) return `Olá, ${greeting}, gostaria de saber mais sobre o ${roomName}.`;
    if (trigger.dataset.contactContext === "billing") return `Olá, ${greeting}, gostaria de entender mais como funciona a estadia sob faturamento para empresas.`;
    return `Olá, ${greeting}, gostaria de ser atendido, por favor.`;
  };

  const setContactMessage = (message) => {
    if (!message) {
      if (whatsappOption?.dataset.defaultHref) whatsappOption.setAttribute("href", whatsappOption.dataset.defaultHref);
      if (emailOption?.dataset.defaultHref) emailOption.setAttribute("href", emailOption.dataset.defaultHref);
      return;
    }

    if (whatsappOption?.getAttribute("aria-disabled") !== "true") {
      whatsappOption?.setAttribute("href", `https://wa.me/555123917366?text=${encodeURIComponent(message)}`);
    }
    if (emailOption?.getAttribute("aria-disabled") !== "true") {
      emailOption?.setAttribute("href", `mailto:contato@pousadadotrabalhador.com?subject=${encodeURIComponent("Contato com a Pousada do Trabalhador")}&body=${encodeURIComponent(message)}`);
    }
  };

  const resetContactModal = () => {
    contactMain?.removeAttribute("hidden");
    phoneView?.setAttribute("hidden", "");
    setContactContext("");
    setContactMessage("");
  };

  document.querySelectorAll("[data-contact-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (!contactModal) return;
      event.preventDefault();
      setMenuState(false);
      resetContactModal();
      setContactContext(trigger.dataset.contactContext || "");
      setContactMessage(getContactMessage(trigger));
      if (typeof contactModal.showModal === "function") contactModal.showModal();
      else contactModal.setAttribute("open", "");
    });
  });

  contactModal?.querySelector("[data-contact-close]")?.addEventListener("click", closeContactModal);
  contactModal?.addEventListener("click", (event) => {
    if (event.target === contactModal) closeContactModal();
  });
  contactModal?.addEventListener("close", resetContactModal);

  contactModal?.querySelector('[data-contact-action="phone"]')?.addEventListener("click", (event) => {
    if (event.currentTarget.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    if (isMobileDevice()) return;
    event.preventDefault();
    contactMain?.setAttribute("hidden", "");
    if (phoneView) {
      phoneView.removeAttribute("hidden");
      phoneView.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  document.querySelectorAll(".faq-item__question").forEach((question) => {
    question.addEventListener("click", () => {
      const item = question.closest(".faq-item");
      const answer = document.getElementById(question.getAttribute("aria-controls"));
      const isOpen = question.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".faq-item").forEach((otherItem) => {
        const otherQuestion = otherItem.querySelector(".faq-item__question");
        const otherAnswer = otherItem.querySelector(".faq-item__answer");
        otherItem.classList.remove("is-open");
        otherQuestion?.setAttribute("aria-expanded", "false");
        if (otherAnswer) otherAnswer.hidden = true;
      });

      if (!isOpen) {
        item?.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        if (answer) answer.hidden = false;
      }
    });
  });

  document.querySelectorAll("[data-photo]").forEach((photoSlot) => {
    const imagePath = photoSlot.dataset.photo;
    if (!imagePath) return;
    const image = photoSlot.querySelector(".real-photo") || new Image();
    const showPhoto = () => photoSlot.classList.add("has-photo");
    const keepPlaceholder = () => { image.hidden = true; };
    image.addEventListener("load", showPhoto, { once: true });
    image.addEventListener("error", keepPlaceholder, { once: true });
    if (image.complete && image.naturalWidth > 0) showPhoto();
    if (!photoSlot.querySelector(".real-photo")) image.src = imagePath;
  });

  const createIcons = () => {
    if (window.lucide?.createIcons) window.lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
  };
  if (window.lucide) createIcons();
  else window.addEventListener("load", createIcons, { once: true });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820 && document.body.classList.contains("menu-open")) setMenuState(false);
  });
})();
