(function () {
  "use strict";

  /* ---------------------------------------------------------
     Ano no rodapé
  --------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Menu mobile (hamburger)
  --------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menu");
      });
    });
  }

  /* ---------------------------------------------------------
     Abas do cardápio (filtro por categoria)
  --------------------------------------------------------- */
  const tabs = document.querySelectorAll(".menu-tab");
  const lists = document.querySelectorAll(".menu-list");
  const categoryOrder = Array.prototype.map.call(tabs, function (t) {
    return t.getAttribute("data-category");
  });
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let isSwitchingMenu = false; // trava pra não sobrepor duas trocas ao mesmo tempo
  const TRANSITION_MS = 260; // precisa bater com a duração no CSS (.menu-list)

  function listFor(category) {
    return document.querySelector('.menu-list[data-category="' + category + '"]');
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const newCategory = tab.getAttribute("data-category");
      const activeTab = document.querySelector(".menu-tab.is-active");
      const oldCategory = activeTab ? activeTab.getAttribute("data-category") : null;

      if (isSwitchingMenu || newCategory === oldCategory) return;

      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      const oldList = oldCategory ? listFor(oldCategory) : null;
      const newList = listFor(newCategory);
      if (!newList) return;

      // sem lista anterior (primeira carga) ou movimento reduzido: troca direto, sem animação
      if (prefersReducedMotion || !oldList) {
        lists.forEach(function (list) {
          list.classList.toggle("is-hidden", list !== newList);
        });
        return;
      }

      const goingForward =
        categoryOrder.indexOf(newCategory) > categoryOrder.indexOf(oldCategory);
      const exitClass = goingForward ? "is-exit-next" : "is-exit-prev";
      const enterClass = goingForward ? "is-enter-next" : "is-enter-prev";

      isSwitchingMenu = true;

      // 1) a lista atual desliza e desaparece
      oldList.classList.add(exitClass);

      window.setTimeout(function () {
        oldList.classList.add("is-hidden");
        oldList.classList.remove(exitClass);

        // 2) a nova lista entra do lado oposto, já visível mas deslocada...
        newList.classList.remove("is-hidden");
        newList.classList.add(enterClass);

        // ...força o navegador a "fotografar" esse estado inicial antes de animar
        void newList.offsetWidth;

        // 3) ...e então anima até a posição normal
        newList.classList.remove(enterClass);

        window.setTimeout(function () {
          isSwitchingMenu = false;
        }, TRANSITION_MS);
      }, TRANSITION_MS);
    });
  });

  /* ---------------------------------------------------------
     Destaque do link ativo na navegação, conforme a seção
     visível na tela
  --------------------------------------------------------- */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".main-nav a, .mobile-nav a[href^='#']");

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      const match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-current", match);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------------------------------------------------------
     Revelação suave ao rolar a página
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".about-text, .about-facts, .menu-head, .menu-tabs, .contact-info, .contact-form"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------
     Validação do formulário de reserva
     (demonstração — sem envio real a um servidor)
  --------------------------------------------------------- */
  const form = document.getElementById("contactForm");
  const feedback = document.getElementById("formFeedback");

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById("err-" + fieldId);
    if (field) field.closest(".field").classList.add("has-error");
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById("err-" + fieldId);
    if (field) field.closest(".field").classList.remove("has-error");
    if (errorEl) errorEl.textContent = "";
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      ["nome", "telefone", "pessoas"].forEach(clearError);
      feedback.textContent = "";
      feedback.classList.remove("is-success");

      const nome = document.getElementById("nome").value.trim();
      const telefone = document.getElementById("telefone").value.trim();
      const pessoas = document.getElementById("pessoas").value;

      let hasError = false;

      if (nome.length < 2) {
        showError("nome", "Digite seu nome completo.");
        hasError = true;
      }
      if (!isValidPhone(telefone)) {
        showError("telefone", "Digite um telefone válido com DDD.");
        hasError = true;
      }
      if (!pessoas || Number(pessoas) < 1) {
        showError("pessoas", "Informe ao menos 1 pessoa.");
        hasError = true;
      }

      if (hasError) return;

      feedback.textContent =
        "Pedido recebido! Vamos confirmar sua reserva pelo telefone informado em breve.";
      feedback.classList.add("is-success");
      form.reset();
    });
  }

  /* ---------------------------------------------------------
     Modal de foto do cardápio
  --------------------------------------------------------- */
  const menuModal = document.getElementById("menuModal");
  const menuModalImg = document.getElementById("menuModalImg");

  if (menuModal && menuModalImg) {
    document.querySelectorAll(".menu-img").forEach(function (button) {
      button.addEventListener("click", function () {
        const photo = button.querySelector("img");
        menuModalImg.src = photo.src;
        menuModalImg.alt = photo.alt;
        menuModal.showModal();
      });
    });

    // fecha ao clicar em qualquer lugar que não seja a própria foto
    // (inclui o botão de fechar e a área vazia ao redor dela)
    menuModal.addEventListener("click", function (event) {
      if (event.target !== menuModalImg) menuModal.close();
    });
  }
})();