/* ============================================================
   BYTE — Mobile Habit Grid
   Replaces the desktop grid with beautiful cards on phones.
   
   INSTALL: In monthly.html, just before </body>, add:
   <script src="mobile-grid.js"></script>
   ============================================================ */
(function () {
  if (window.innerWidth > 768) return;

  /* ── CSS ── */
  document.head.insertAdjacentHTML('beforeend', `<style>
    @media (max-width: 768px) {
      #gridWrapper { display: none !important; }

      #mobileGrid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px 12px 100px;
      }

      .mg-card {
        background: var(--bg-card, #121522);
        border: 1px solid var(--border, #2a2f55);
        border-radius: 18px;
        padding: 14px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 3px 16px rgba(0,0,0,0.3);
      }

      .mg-top {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .mg-name {
        flex: 1;
        min-width: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-main, #eaeaff);
        line-height: 1.3;
        word-break: break-word;
      }

      .mg-strength {
        font-size: 0.58rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .mg-badge {
        font-size: 1rem;
        flex-shrink: 0;
        cursor: help;
        line-height: 1;
      }

      .mg-btn {
        flex-shrink: 0;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border, #2a2f55);
        border-radius: 9px;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.12s;
      }
      .mg-btn:active { background: rgba(255,255,255,0.14); transform: scale(0.92); }

      .mg-days {
        display: flex;
        gap: 10px;
      }

      .mg-day {
        flex: 1;
        min-height: 76px;
        border-radius: 14px;
        border: 2px solid var(--border, #2a2f55);
        background: var(--bg-grid, #0e111b);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        transition: transform 0.1s;
        position: relative;
        overflow: hidden;
      }
      .mg-day:active:not(.mgd-locked) { transform: scale(0.93); }

      .mg-day-lbl {
        font-size: 0.58rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted, #9aa4ff);
        line-height: 1;
      }
      .mg-day-icon { font-size: 1.9rem; line-height: 1; }
      .mg-day-word {
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--text-muted, #9aa4ff);
      }

      .mgd-today   { border-color: var(--primary, #4CAF50) !important; background: rgba(76,175,80,0.1) !important; }
      .mgd-today .mg-day-lbl { color: var(--primary, #4CAF50) !important; font-size: 0.65rem !important; }

      .mgd-done    { background: rgba(74,222,128,0.15) !important; border-color: rgba(74,222,128,0.7) !important; }
      .mgd-done   .mg-day-lbl, .mgd-done   .mg-day-word { color: #4ade80 !important; }

      .mgd-failed  { background: rgba(248,113,113,0.13) !important; border-color: rgba(248,113,113,0.6) !important; }
      .mgd-failed .mg-day-lbl, .mgd-failed .mg-day-word { color: #f87171 !important; }

      .mgd-locked  { opacity: 0.25 !important; cursor: not-allowed !important; }

      .mg-note-dot {
        position: absolute; top: 6px; right: 6px;
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--primary, #4CAF50); opacity: 0.9;
      }
    }
  </style>`);

  /* ── Build grid ── */
  const build = () => {
    const month = window._currentMonthData?.();
    if (!month?.tasks) return;

    const year  = window._currentYear?.()  ?? new Date().getFullYear();
    const mon   = window._currentMonth?.() ?? new Date().getMonth();
    const notes = window._getNotes?.() ?? {};

    const td       = new Date();
    const tDay     = td.getDate();
    const tMon     = td.getMonth();
    const tYear    = td.getFullYear();
    const isCurMon = (year === tYear && mon === tMon);

    // day indices: yesterday + today (or just today on 1st)
    let days = [];
    if (isCurMon) {
      if (tDay > 1) days = [tDay - 2, tDay - 1];
      else          days = [0];
    } else {
      const dim = new Date(year, mon + 1, 0).getDate();
      days = dim > 1 ? [dim - 2, dim - 1] : [0];
    }

    // container
    let box = document.getElementById('mobileGrid');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mobileGrid';
      const gw = document.getElementById('gridWrapper');
      if (!gw) return;
      gw.parentNode.insertBefore(box, gw.nextSibling);
    }
    box.innerHTML = '';

    const DOWS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const FREEZE_COST = window._FREEZE_COST ?? 30;

    month.tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'mg-card';

      /* ── Name row ── */
      const top = document.createElement('div');
      top.className = 'mg-top';

      const nameEl = document.createElement('div');
      nameEl.className = 'mg-name';
      nameEl.textContent = task.name || 'Habit';
      top.appendChild(nameEl);

      // Strength badge
      const str = window._getHabitStrength?.(task);
      if (str) {
        const sb = document.createElement('span');
        sb.className = 'mg-strength ' + (str.cls || '');
        sb.textContent = str.label;
        sb.title = str.tip || '';
        top.appendChild(sb);
      }

      // Grace / skull
      const gLeft = (task.graceLimit ?? 1) - (task.graceUsed ?? 0);
      const gb = document.createElement('span');
      gb.className = 'mg-badge';
      gb.textContent = gLeft > 0 ? '🛡️' : '💀';
      gb.style.opacity = gLeft > 0 ? '0.85' : '0.5';
      gb.title = gLeft > 0 ? "Grace available — 1 miss won't break streak" : "Grace used — next miss breaks streak";
      top.appendChild(gb);

      // Freeze badge
      const frozen = window._isHabitFrozenToday?.(task);
      if (frozen) {
        const fb = document.createElement('span');
        fb.className = 'mg-badge';
        fb.textContent = '❄️';
        fb.title = 'Streak frozen today';
        top.appendChild(fb);
      }

      // Freeze button
      if (isCurMon) {
        const fBtn = document.createElement('button');
        fBtn.className = 'mg-btn';
        fBtn.textContent = '❄️';
        fBtn.title = frozen ? 'Already frozen today' : `Freeze streak (${FREEZE_COST}💎)`;
        if (frozen) fBtn.style.opacity = '0.35';
        fBtn.onclick = e => { e.stopPropagation(); window._buyHabitFreeze?.(task.id); };
        top.appendChild(fBtn);
      }

      // Delete
      const del = document.createElement('button');
      del.className = 'mg-btn';
      del.textContent = '🗑️';
      del.title = 'Delete habit';
      del.onclick = e => { e.stopPropagation(); window._deleteTask?.(task.id); };
      top.appendChild(del);

      card.appendChild(top);

      /* ── Day buttons ── */
      const dRow = document.createElement('div');
      dRow.className = 'mg-days';

      days.forEach(di => {
        const dayNum = di + 1;
        const isToday = isCurMon && dayNum === tDay;
        const isYest  = isCurMon && dayNum === tDay - 1;
        const status  = task.days[di] ?? 'unmarked';
        const locked  = status === 'locked';
        const dow     = DOWS[new Date(year, mon, dayNum).getDay()];

        const btn = document.createElement('div');
        btn.className = 'mg-day';

        const lbl = document.createElement('div');
        lbl.className = 'mg-day-lbl';
        lbl.textContent = isToday ? 'TODAY' : isYest ? 'YESTERDAY' : dow;

        const ico = document.createElement('div');
        ico.className = 'mg-day-icon';
        ico.textContent = locked ? '—'
          : status === 'done'   ? '✅'
          : status === 'failed' ? '❌'
          : isToday             ? '⭕' : '○';

        const word = document.createElement('div');
        word.className = 'mg-day-word';
        word.textContent = locked ? 'Off day'
          : status === 'done'   ? 'Done ✓'
          : status === 'failed' ? 'Missed'
          : 'Tap to check';

        btn.appendChild(lbl);
        btn.appendChild(ico);
        btn.appendChild(word);

        // Note dot
        const nk = `${task.id}_${di}`;
        if (notes[nk]) {
          const dot = document.createElement('div');
          dot.className = 'mg-note-dot';
          btn.appendChild(dot);
        }

        // State classes
        if (isToday && !locked) btn.classList.add('mgd-today');
        if (status === 'done')   btn.classList.add('mgd-done');
        if (status === 'failed') btn.classList.add('mgd-failed');
        if (locked)              btn.classList.add('mgd-locked');

        if (!locked) {
          btn.onclick = () => {
            window._cycleStatus?.(task, di);
            setTimeout(build, 60);
          };
        }

        dRow.appendChild(btn);
      });

      card.appendChild(dRow);
      box.appendChild(card);
    });
  };

  /* ── Watch for grid re-renders ── */
  const startObserver = () => {
    const gw = document.getElementById('gridWrapper');
    if (!gw) { setTimeout(startObserver, 300); return; }

    new MutationObserver(() => setTimeout(build, 60))
      .observe(gw, { childList: true });

    build();
  };

  /* ── Wait for monthly.js to populate the grid first ── */
  const waitReady = () => {
    if (document.getElementById('gridWrapper')?.children.length > 0) {
      startObserver();
    } else {
      setTimeout(waitReady, 300);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitReady, 700));
  } else {
    setTimeout(waitReady, 700);
  }
})();
