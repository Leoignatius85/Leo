const CONTACT_API_URL = "/api/contact";
const body = document.body;
const header = document.querySelector(".site-header");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const storedTheme = localStorage.getItem("leo-theme");

if (storedTheme === "light") {
  body.classList.add("light");
  themeIcon.textContent = "☾";
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");
  const isLight = body.classList.contains("light");
  themeIcon.textContent = isLight ? "☾" : "☼";
  localStorage.setItem("leo-theme", isLight ? "light" : "dark");
});

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible", "in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal, .skill-card").forEach((element) => revealObserver.observe(element));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    const start = performance.now();
    const duration = 1100;
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.floor(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.7 });

document.querySelectorAll("[data-count]").forEach((counter) => counterObserver.observe(counter));

const caseStudies = {
  reels: {
    kicker: "CONTENT CREATION / 01",
    title: "Social Media Content & Reels",
    summary: "A repeatable short-form content workflow for student communities, balancing quick turnaround with a polished visual identity.",
    approach: "Start with the event goal, map a concise hook and sequence, select footage, sync edits to music, add readable on-brand graphics, and optimize the final export for mobile.",
    outcome: "Stronger social consistency, clearer promotion, and content that gives audiences an immediate reason to stop, watch, and respond."
  },
  farewell: {
    kicker: "VIDEO PRODUCTION / 02",
    title: "Farewell Cinematic Film",
    summary: "An emotionally structured event film designed to feel more like a story than a simple collection of clips.",
    approach: "Organize footage into a narrative arc, build pace around music, use transitions with restraint, balance color, and land on a memorable closing sequence.",
    outcome: "A polished shared memory with stronger emotional impact and a cinematic finish suitable for screening and social publishing."
  },
  branding: {
    kicker: "VISUAL BRANDING / 03",
    title: "College Event Visual Identity",
    summary: "A flexible visual system applied across posters, invitations, stories, and promotional posts.",
    approach: "Define a bold type and color direction, create reusable layouts, adapt each asset to its platform, and maintain hierarchy across every communication touchpoint.",
    outcome: "A recognizable event identity that made information easier to understand and promotion feel more coordinated."
  },
  events: {
    kicker: "CAMPUS EXPERIENCE / 04",
    title: "Event Coordination & Campus Work",
    summary: "On-ground coordination across teams, activities, organisers, students, and faculty in time-sensitive settings.",
    approach: "Clarify responsibilities, maintain active communication, anticipate logistical gaps, help teams stay aligned, and adapt calmly when plans shift.",
    outcome: "Smoother execution, faster issue resolution, and a more dependable experience for both organisers and participants."
  },
  campaigns: {
    kicker: "DIGITAL MARKETING / 05",
    title: "Social Media Marketing Campaigns",
    summary: "Joined-up promotional campaigns combining graphic design, reels, publishing rhythm, and audience-focused messaging.",
    approach: "Identify the event audience, plan a simple campaign sequence, vary content formats, build momentum toward the event, and review response signals.",
    outcome: "Improved awareness, stronger participation, and a clearer connection between creative content and real event goals."
  }
};

const modal = document.querySelector("#case-modal");
document.querySelectorAll(".case-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    const item = caseStudies[button.dataset.case];
    modal.querySelector(".modal-kicker").textContent = item.kicker;
    modal.querySelector(".modal-title").textContent = item.title;
    modal.querySelector(".modal-summary").textContent = item.summary;
    modal.querySelector(".modal-approach").textContent = item.approach;
    modal.querySelector(".modal-outcome").textContent = item.outcome;
    modal.showModal();
  });
});

modal.querySelector(".modal-close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

const contactForm = document.querySelector("#contact-form");
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formStatus = contactForm.querySelector(".form-status");
  const submitButton = contactForm.querySelector("button[type='submit']");
  const formData = new FormData(contactForm);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    interest: formData.get("interest"),
    message: formData.get("message")
  };

  formStatus.textContent = "Sending your message...";
  submitButton.disabled = true;

  try {
    const response = await fetch(CONTACT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Could not send your message.");
    }

    formStatus.textContent = result.message;
    contactForm.reset();
  } catch (error) {
    formStatus.textContent = "The backend is not connected on this page yet. Please email ignatiusleo43@gmail.com or deploy the backend from this project.";
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
