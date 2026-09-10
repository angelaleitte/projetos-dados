// Para adicionar um novo projeto, basta acrescentar um novo objeto neste array.
// Cada projeto vive em sua própria pasta/domínio (campo "link").
const projects = [
  {
    tag: "Dados & IA",
    title: 'Vigilância de dados que <span class="accent">ganham vida</span>.',
    description:
      "Pipeline completo de engenharia e ciência de dados sobre o SIVEP-Gripe (SRAG), com dashboard interativo atualizado semanalmente.",
    cta: "Ver projeto",
    link: "/gripe/",
    visual: `
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="92" stroke="#FFB700" stroke-opacity="0.25" stroke-width="1.5"/>
        <path d="M20 130 L55 130 L70 90 L90 150 L110 60 L130 130 L180 130" stroke="#FFB700" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="110" cy="60" r="6" fill="#FFD000"/>
        <rect x="30" y="150" width="140" height="2" fill="#444342"/>
      </svg>`,
  },
  {
    tag: "Em breve",
    title: 'O próximo projeto está <span class="accent">a caminho</span>.',
    description:
      "Novos projetos serão publicados aqui em breve — cada um com seu próprio espaço dentro deste portfólio.",
    cta: "Em construção",
    link: null,
    visual: `
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="92" stroke="#444342" stroke-width="1.5" stroke-dasharray="6 8"/>
        <rect x="70" y="70" width="60" height="60" rx="10" stroke="#6B6966" stroke-width="4"/>
        <path d="M85 100 h30 M100 85 v30" stroke="#FFB700" stroke-width="4" stroke-linecap="round"/>
      </svg>`,
  },
];

const AUTO_ADVANCE_MS = 5500;

const els = {
  title: document.getElementById("slideTitle"),
  description: document.getElementById("slideDescription"),
  link: document.getElementById("slideLink"),
  cta: document.getElementById("slideCta"),
  tag: document.getElementById("slideTag"),
  dots: document.getElementById("dots"),
  visualInner: document.getElementById("visualInner"),
  visualBadge: document.getElementById("visualBadge"),
};

let current = 0;
let timer = null;

function renderDots() {
  els.dots.innerHTML = "";
  projects.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.role = "tab";
    dot.setAttribute("aria-selected", i === current ? "true" : "false");
    dot.setAttribute("aria-label", `Ir para projeto ${i + 1}`);
    dot.addEventListener("click", () => goTo(i, true));
    els.dots.appendChild(dot);
  });
}

function render() {
  const p = projects[current];

  els.title.style.opacity = 0;
  els.description.style.opacity = 0;
  els.visualInner.style.opacity = 0;

  window.setTimeout(() => {
    els.title.innerHTML = p.title;
    els.description.textContent = p.description;
    els.tag.textContent = p.tag;
    els.cta.textContent = p.cta;
    els.visualInner.innerHTML = p.visual;

    if (p.link) {
      els.link.href = p.link;
      els.link.removeAttribute("aria-disabled");
      els.visualBadge.href = p.link;
      els.visualBadge.style.visibility = "visible";
    } else {
      els.link.href = "#";
      els.link.setAttribute("aria-disabled", "true");
      els.visualBadge.style.visibility = "hidden";
    }

    els.title.style.opacity = 1;
    els.description.style.opacity = 1;
    els.visualInner.style.opacity = 1;
  }, 180);

  Array.from(els.dots.children).forEach((dot, i) => {
    dot.setAttribute("aria-selected", i === current ? "true" : "false");
  });
}

function goTo(index, userTriggered) {
  current = (index + projects.length) % projects.length;
  render();
  if (userTriggered) restartAutoAdvance();
}

function next() {
  goTo(current + 1, false);
}

function restartAutoAdvance() {
  if (timer) window.clearInterval(timer);
  if (projects.length > 1) {
    timer = window.setInterval(next, AUTO_ADVANCE_MS);
  }
}

renderDots();
render();
restartAutoAdvance();

// ---------- tema claro/escuro ----------
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
const savedTheme = (() => {
  try { return localStorage.getItem("al-theme"); } catch (e) { return null; }
})();
if (savedTheme === "light") {
  root.setAttribute("data-theme", "light");
  themeToggle.setAttribute("aria-pressed", "true");
}

themeToggle.addEventListener("click", () => {
  const isLight = root.getAttribute("data-theme") === "light";
  if (isLight) {
    root.removeAttribute("data-theme");
    themeToggle.setAttribute("aria-pressed", "false");
  } else {
    root.setAttribute("data-theme", "light");
    themeToggle.setAttribute("aria-pressed", "true");
  }
  try { localStorage.setItem("al-theme", isLight ? "dark" : "light"); } catch (e) {}
});
