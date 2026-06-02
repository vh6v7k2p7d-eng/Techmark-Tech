const body = document.body;
const nav = document.querySelector("[data-site-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const leadEmail = "contact@techmarktech.com";
const whatsAppNumber = "917506001640";
const whatsAppMessage = "Hi TechMarkTech, I want to discuss a website, portal or automation project.";
const leadEndpoints = ["/api/lead", "/.netlify/functions/lead"];

function buildWhatsAppUrl(message = whatsAppMessage) {
  return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
}

function buildMailtoUrl(formName, fields) {
  const summary = Object.entries(fields)
    .filter(([, value]) => String(value).trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  const subject = encodeURIComponent(`TechMarkTech ${formName}`);
  const bodyText = encodeURIComponent(summary);

  return `mailto:${leadEmail}?subject=${subject}&body=${bodyText}`;
}

async function submitLead(payload) {
  let lastError = null;

  for (const endpoint of leadEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if ([404, 405, 501].includes(response.status)) {
        continue;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Email service could not send the inquiry.");
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Email service is unavailable.");
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!isOpen));
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    body.classList.toggle("nav-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLAnchorElement) {
      nav.setAttribute("data-open", "false");
      menuToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("nav-open");
    }
  });
}

const currentPath = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("[data-site-nav] a").forEach((link) => {
  const linkPath = link.getAttribute("href") || "";
  if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
  link.setAttribute("href", buildWhatsAppUrl(link.getAttribute("data-whatsapp-message") || whatsAppMessage));
});

const whatsAppFab = document.createElement("a");
whatsAppFab.className = "whatsapp-fab";
whatsAppFab.href = buildWhatsAppUrl();
whatsAppFab.target = "_blank";
whatsAppFab.rel = "noopener";
whatsAppFab.setAttribute("aria-label", "Message TechMarkTech on WhatsApp");
whatsAppFab.innerHTML = '<span aria-hidden="true">WA</span><strong>WhatsApp</strong>';
body.appendChild(whatsAppFab);

const revealNodes = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealNodes.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

const tabButtons = document.querySelectorAll("[data-contact-tab]");
const tabPanels = document.querySelectorAll("[data-contact-panel]");

function activateContactTab(target, shouldUpdateHash = false) {
  const nextButton = document.querySelector(`[data-contact-tab="${target}"]`);
  if (!nextButton) return;

  tabButtons.forEach((item) => {
    item.setAttribute("aria-selected", String(item === nextButton));
  });
  tabPanels.forEach((panel) => {
    panel.hidden = panel.getAttribute("data-contact-panel") !== target;
  });

  if (shouldUpdateHash) {
    history.replaceState(null, "", `#${target}`);
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-contact-tab");
    activateContactTab(target, true);
  });
});

if (tabButtons.length) {
  const initialTab = window.location.hash.replace("#", "");
  activateContactTab(initialTab || "consultation");
  window.addEventListener("hashchange", () => {
    activateContactTab(window.location.hash.replace("#", "") || "consultation");
  });
}

document.querySelectorAll("form[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitButton = event.submitter || form.querySelector('button[type="submit"]');
    const status = form.querySelector("[data-form-status]");
    const formName = form.getAttribute("data-lead-form") || "website inquiry";
    const formData = new FormData(form);
    const fields = Object.fromEntries(formData.entries());

    if (status) {
      status.textContent = "Sending your inquiry...";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
    }

    submitLead({
      formName,
      fields,
      page: window.location.href
    })
      .then(() => {
        if (status) {
          status.textContent = "Thanks. Your inquiry has been sent. A confirmation email is on its way.";
        }
        form.reset();
      })
      .catch((error) => {
        if (status) {
          status.textContent = `${error.message} Opening your email client as a fallback.`;
        }
        window.location.href = buildMailtoUrl(formName, fields);
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute("aria-busy");
        }
      });
  });
});
