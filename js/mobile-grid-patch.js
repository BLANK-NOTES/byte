/* =====================================================
   MOBILE GRID PATCH — js/mobile-grid-patch.js

   What this does on screens < 768px:
   1. Shows ONLY yesterday + today columns (not all 31)
   2. Fixes habit name display (full name visible)
   3. Makes freeze ❄️ and shield 🛡️ visible
   4. Adds column labels: "Yesterday" / "Today"

   HOW TO ADD:
   In monthly.html, just before </body>, add:
   <script src="js/mobile-grid-patch.js"></script>
===================================================== */

(function () {

  /* Only run on mobile */
  const isMobile = () => window.innerWidth <= 768;

  /* ── Apply the two-column mobile view ── */
  const applyMobileGrid = () => {
    if (!isMobile()) return;

    const wrapper = document.getElementById('gridWrapper');
    if (!wrapper || wrapper.children.length === 0) return;

    const header = wrapper.querySelector('.grid-header');
    if (!header) return;

    /* Find today's column index in the header */
    const headerCells = Array.from(header.querySelectorAll('.grid-cell'));
    const todayColIdx = headerCells.findIndex(c => c.classList.contains('today'));

    if (todayColIdx < 0) return; // viewing a past/future month — skip

    const yesterdayColIdx = todayColIdx - 1;
    const showFirst = yesterdayColIdx > 0; // false if today is the 1st of the month

    /* Which column indices to keep visible */
    const showCols = new Set([0]); // 0 = task name column, always visible
    if (showFirst) showCols.add(yesterdayColIdx);
    showCols.add(todayColIdx);

    /* Update labels so user knows which column is which */
    if (showFirst && headerCells[yesterdayColIdx]) {
      headerCells[yesterdayColIdx].innerHTML =
        '<span style="font-size:0.55rem;display:block;opacity:0.6;line-height:1">YEST</span>' +
        headerCells[yesterdayColIdx].textContent.replace('YEST', '').trim();
    }
    if (headerCells[todayColIdx]) {
      const existing = headerCells[todayColIdx].textContent.replace('TODAY', '').trim();
      headerCells[todayColIdx].innerHTML =
        '<span style="font-size:0.55rem;display:block;color:var(--primary,#4CAF50);line-height:1">TODAY</span>' +
        existing;
    }

    /* Process every row */
    const rows = wrapper.querySelectorAll('.grid-row');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('.grid-cell'));

      cells.forEach((cell, i) => {
        if (showCols.has(i)) {
          cell.style.display = '';
        } else {
          cell.style.display = 'none';
        }
      });

      /* Fix grid-template-columns for this row */
      const dayCols = showCols.size - 1; // e.g. 2 (yesterday + today) or 1 (1st of month)
      row.style.gridTemplateColumns = `1fr repeat(${dayCols}, 76px)`;
    });

    /* Mark wrapper so CSS can target it */
    wrapper.classList.add('mobile-two-col');
  };

  /* ── Fix task name cells on mobile ── */
  const fixTaskNames = () => {
    if (!isMobile()) return;

    document.querySelectorAll('.grid-cell.task-name').forEach(cell => {
      /* Give the name span room to breathe */
      cell.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px;
        overflow: hidden;
        min-width: 0;
      `;

      /* The first child is the name span — make it truncate cleanly */
      const nameSpan = cell.querySelector('span:first-child');
      if (nameSpan) {
        nameSpan.style.cssText = `
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.82rem;
          font-weight: 600;
        `;
      }

      /* Keep freeze ❄️ and delete 🗑️ visible but compact */
      cell.querySelectorAll('button').forEach(btn => {
        btn.style.cssText = `
          flex-shrink: 0;
          font-size: 0.85rem;
          padding: 2px;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
        `;
      });

      /* Hide grace badge and strength badge on mobile to save space */
      cell.querySelectorAll('.grace-badge, .strength-badge').forEach(badge => {
        badge.style.display = 'none';
      });

      /* Keep freeze badge ❄️ visible */
      cell.querySelectorAll('.freeze-badge').forEach(fb => {
        fb.style.cssText = 'flex-shrink:0;font-size:0.8rem';
      });
    });
  };

  /* ── Fix shield badge visibility ── */
  const fixShieldBadge = () => {
    if (!isMobile()) return;

    const shield = document.getElementById('shieldBadge');
    if (!shield) return;

    /* Make sure it's actually in the header-actions and visible */
    shield.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 8px;
      background: rgba(96,165,250,0.15);
      border: 1px solid rgba(96,165,250,0.4);
      border-radius: 10px;
      color: #60a5fa;
      white-space: nowrap;
      flex-shrink: 0;
    `;
  };

  /* ── Run everything ── */
  const runAll = () => {
    applyMobileGrid();
    fixTaskNames();
    fixShieldBadge();
  };

  /* ── Watch for grid re-renders ──
     monthly.js calls renderGrid() many times (on load, on click, etc.)
     MutationObserver fires every time the gridWrapper content changes */
  const observeGrid = () => {
    const wrapper = document.getElementById('gridWrapper');
    if (!wrapper) {
      /* gridWrapper not in DOM yet — try again shortly */
      setTimeout(observeGrid, 300);
      return;
    }

    const observer = new MutationObserver(() => {
      /* Small delay so monthly.js finishes its own DOM work first */
      setTimeout(runAll, 50);
    });

    observer.observe(wrapper, { childList: true, subtree: false });

    /* Also run once immediately in case grid already rendered */
    runAll();
  };

  /* ── Re-apply on resize ── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runAll, 200);
  });

  /* ── Start after page loads ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(observeGrid, 500));
  } else {
    setTimeout(observeGrid, 500);
  }

})();