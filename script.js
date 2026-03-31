/*
  script.js — Jordy Uribe Rivas Portfolio
  ========================================
  This file handles all the interactivity on the site:
    1. Animated dot grid background (canvas)
    2. Scroll reveal animations
    3. Project filter buttons
    4. Nav link active state on scroll
    5. Nav background darkening on scroll

  JavaScript runs in the browser after the HTML is loaded.
  It finds HTML elements using querySelector/querySelectorAll,
  then modifies them or listens for events (clicks, scrolls).
*/


/* =============================================
   1. CANVAS — Animated dot grid background
   =============================================
   The <canvas> element is like a blank whiteboard.
   We draw on it using the Canvas 2D API (ctx).
   Every frame, we clear it and redraw all dots slightly
   brighter or dimmer, creating a slow breathing effect.
   ============================================= */

// Get references to the canvas element and its drawing context
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d'); // '2d' gives us 2D drawing tools

// Store all dot objects and canvas dimensions
let dots = [];
let W, H;

/**
 * resize() — Called on page load and whenever the window is resized.
 * Sets the canvas size to match the full browser window,
 * then rebuilds the dot grid to fill the new size.
 */
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildDots();
}

/**
 * buildDots() — Creates a grid of dot objects spaced 48px apart.
 * Each dot gets a random speed and phase so they don't all
 * pulse in sync — this creates the organic breathing effect.
 */
function buildDots() {
  dots = []; // clear existing dots

  const spacing = 48; // pixels between dots
  const cols = Math.ceil(W / spacing) + 1; // how many columns fit
  const rows = Math.ceil(H / spacing) + 1; // how many rows fit

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        x: c * spacing,        // horizontal position
        y: r * spacing,        // vertical position
        base: Math.random(),   // unused, reserved for future effects
        speed: 0.003 + Math.random() * 0.004, // how fast it pulses
        phase: Math.random() * Math.PI * 2,   // offset in the pulse cycle
      });
    }
  }
}

/**
 * drawDots(t) — Clears the canvas and redraws every dot.
 * @param t - current time in seconds (used to animate opacity)
 *
 * Math.sin() returns a value between -1 and 1 that oscillates over time.
 * By multiplying by each dot's speed and adding its phase offset,
 * every dot has its own slightly different pulse rhythm.
 */
function drawDots(t) {
  ctx.clearRect(0, 0, W, H); // wipe the canvas clean each frame

  for (const d of dots) {
    // Alpha oscillates between ~0.04 and ~0.10 — very subtle
    const alpha = 0.04 + 0.06 * Math.sin(t * d.speed + d.phase);

    ctx.beginPath();
    ctx.arc(d.x, d.y, 1, 0, Math.PI * 2); // draw a 1px radius circle
    ctx.fillStyle = `rgba(192, 57, 43, ${alpha})`; // red dots
    ctx.fill();
  }
}

// requestAnimationFrame(loop) tells the browser to call loop()
// before the next screen repaint (~60 times per second).
// The browser passes the current timestamp (t) automatically.
function loop(t) {
  drawDots(t * 0.001); // convert ms to seconds for easier math
  requestAnimationFrame(loop); // schedule the next frame
}

// Start: set canvas size, build dots, then kick off the animation loop
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);


/* =============================================
   2. SCROLL REVEAL
   =============================================
   IntersectionObserver watches elements and fires a callback
   when they enter or leave the visible viewport.
   We use it to add a "visible" CSS class when elements scroll into view,
   which triggers the fade-up transition defined in style.css.
   ============================================= */

// Select all the elements we want to animate in on scroll
const revealTargets = document.querySelectorAll(
  '.about-grid, .about-card, .project-card, .skills-columns, .contact-inner, .hero-scroll-hint'
);

// Create an observer — the callback fires whenever a watched element
// enters or exits the viewport
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Element is now visible — trigger the CSS transition
        entry.target.classList.add('visible');
        // Stop watching it — we only want the animation to fire once
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 } // fire when 10% of the element is visible
);

// Add the "reveal" class (starts hidden) and start observing each element
revealTargets.forEach((el) => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});


/* =============================================
   3. PROJECT FILTER
   =============================================
   When a filter button is clicked, we read its data-filter value
   and show/hide cards based on their data-category attribute.

   HTML example:
     <button data-filter="gis">GIS & Mapping</button>
     <div class="project-card" data-category="gis swe">...</div>

   If filter is "gis" and the card's category includes "gis", show it.
   Otherwise, add the "hidden" class (defined in style.css).
   ============================================= */

const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.project-card');
const grid = document.getElementById('projects-grid');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Remove "active" from all buttons, then add it to the clicked one
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Read the data-filter attribute from the clicked button
    const filter = btn.dataset.filter;

    // Reset grid positioning (needed after hiding removes cards from flow)
    grid.style.position = 'relative';

    cards.forEach((card) => {
      const cats = card.dataset.category || ''; // e.g. "gis swe"

      // Show card if filter is "all" OR if the card's categories include the filter
      const match = filter === 'all' || cats.includes(filter);

      if (match) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});


/* =============================================
   4. NAV ACTIVE STATE ON SCROLL
   =============================================
   Another IntersectionObserver — this one watches each <section>
   and highlights the corresponding nav link when that section
   is the most visible one in the viewport.
   ============================================= */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Reset all nav links to default color
        navLinks.forEach((l) => (l.style.color = ''));

        // Find the nav link that points to this section's id
        // e.g. if section id="projects", find <a href="#projects">
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);

        if (active) {
          active.style.color = 'var(--text)'; // highlight it
        }
      }
    });
  },
  { threshold: 0.45 } // fire when 45% of section is visible
);

sections.forEach((s) => navObserver.observe(s));


/* =============================================
   5. NAV BACKGROUND ON SCROLL
   =============================================
   When the user scrolls down more than 40px, make the nav
   background slightly more opaque so content behind it is
   less visible. Scrolling back to top lightens it again.
   ============================================= */

const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    // More opaque when scrolled down — content is behind it
    nav.style.background = 'rgba(7, 9, 15, 0.96)';
  } else {
    // More transparent near the top — just the hero is behind it
    nav.style.background = 'rgba(7, 9, 15, 0.8)';
  }
});
