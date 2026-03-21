// ── SLOT CONFIGURATION ──
const MAX = 3;
const STORAGE_KEY = 'dunkin-slots-website-v1';

const SLOTS_CONFIG = [
  { id:'morning', label:'Morning Shift', time:'7:00 AM – 12:00 PM', hrs:'5 hrs', icon:'🌅', color:'#FF6E1F', light:'#FFF0E8' },
  { id:'midday',  label:'Midday Shift',  time:'12:00 PM – 4:00 PM', hrs:'4 hrs', icon:'☀️',  color:'#DA1884', light:'#FFF0F8' },
  { id:'evening', label:'Evening Shift', time:'4:00 PM – 8:00 PM',  hrs:'4 hrs', icon:'🌆', color:'#6366F1', light:'#F0F0FF' },
];

let state = {};

// ── LOAD FROM LOCALSTORAGE ──
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved);
  } catch(e) { state = {}; }
  SLOTS_CONFIG.forEach(s => {
    if (!state[s.id]) state[s.id] = { submissions: [], myName: null };
  });
}

// ── SAVE TO LOCALSTORAGE ──
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

// ── RESET ALL SLOTS ──
function resetAll() {
  SLOTS_CONFIG.forEach(s => { state[s.id] = { submissions: [], myName: null }; });
  saveState();
  renderSlots();
  updateDashStatus();
  updateStatCount();
  showToast('All slots reset! 🔄');
}

// ── UPDATE DASHBOARD QUICK ACTION STATUS ──
function updateDashStatus() {
  const el = document.getElementById('dashSlotStatus');
  if (!el) return;
  const open = SLOTS_CONFIG.filter(s => state[s.id].submissions.length < MAX).length;
  if (open === 0) { el.textContent = '🔴 All slots filled'; el.style.color = 'var(--red)'; }
  else { el.textContent = `🟢 ${open} slot${open > 1 ? 's' : ''} still open`; el.style.color = 'var(--green)'; }
}

// ── UPDATE STATS BAR COUNT ──
function updateStatCount() {
  const el = document.getElementById('statOpenSlots');
  if (!el) return;
  const totalOpen = SLOTS_CONFIG.reduce((acc, s) => acc + (MAX - state[s.id].submissions.length), 0);
  el.textContent = totalOpen;
}

// ── SUBMIT A SLOT ──
function submitSlot(slotId) {
  const nameEl = document.getElementById('name_' + slotId);
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('Please enter your name ⚠️'); nameEl.focus(); return; }
  const s = state[slotId];
  if (s.submissions.length >= MAX) { showToast('This slot is already full! 🚫'); return; }
  const now = new Date();
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  s.submissions.push({ name, time: t });
  s.myName = name;
  saveState();
  renderSlots();
  updateDashStatus();
  updateStatCount();
  const cfg = SLOTS_CONFIG.find(c => c.id === slotId);
  if (s.submissions.length >= MAX) showToast(`${cfg.label} is now full! All 3 spots taken 🎉`);
  else showToast(`✅ Slot ${s.submissions.length}/3 confirmed for ${cfg.label}`);
}

// ── RENDER ALL 3 SLOT CARDS ──
function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  SLOTS_CONFIG.forEach(cfg => {
    const s = state[cfg.id];
    const count = s.submissions.length;
    const full = count >= MAX;
    const mine = s.myName;
    const pct = (count / MAX) * 100;
    const fillColor = full ? 'var(--red)' : cfg.color;
    const badgeColor = full ? 'var(--red)' : cfg.color;
    const badgeBg = full ? '#FFF0F0' : cfg.light;
    const badgeText = full ? '🔴 FULL' : `${count}/${MAX}`;

    // Build submitted rows
    let rowsHTML = '';
    for (let i = 0; i < MAX; i++) {
      if (s.submissions[i]) {
        rowsHTML += `
          <div class="sub-row">
            <div class="sub-num" style="background:var(--green);">${i + 1}</div>
            <div class="sub-name">${s.submissions[i].name}</div>
            <div class="sub-time">${s.submissions[i].time}</div>
          </div>`;
      } else {
        rowsHTML += `
          <div class="sub-row empty">
            <div class="sub-num" style="background:#D1D5DB;">${i + 1}</div>
            <div class="sub-name empty-name">Open slot</div>
          </div>`;
      }
    }

    // Build action area
    let actionHTML = '';
    if (mine) {
      actionHTML = `
        <div class="confirmed-box">
          <span style="font-size:28px;">✅</span>
          <div>
            <strong>You're confirmed!</strong>
            <span>Slot secured as <b>${mine}</b> for ${cfg.time}</span>
          </div>
        </div>`;
    } else if (full) {
      actionHTML = `
        <div class="full-box">
          <span style="font-size:28px;">🚫</span>
          <div>
            <strong>Slot Full — No Vacancies</strong>
            <span>All 3 spots taken. Contact your manager to join the waitlist.</span>
          </div>
        </div>`;
    } else {
      actionHTML = `
        <div class="name-row">
          <input id="name_${cfg.id}" type="text" placeholder="Enter your name (e.g. Jamie T.)" />
        </div>
        <button class="claim-btn" style="background:${cfg.color};" onclick="submitSlot('${cfg.id}')">
          Claim ${cfg.label} — ${MAX - count} spot${MAX - count !== 1 ? 's' : ''} left
        </button>
        <p style="font-size:12px;color:var(--gray);text-align:center;">⚡ First come, first served</p>`;
    }

    // Build the full card
    const card = document.createElement('div');
    card.className = 'slot-card';
    card.innerHTML = `
      <div class="slot-card-header">
        <div class="slot-icon" style="background:${cfg.light};">${cfg.icon}</div>
        <div class="slot-info">
          <div class="slot-name">${cfg.label}</div>
          <div class="slot-time">${cfg.time} · ${cfg.hrs}</div>
        </div>
        <div class="slot-count-badge" style="background:${badgeBg};color:${badgeColor};">${badgeText}</div>
      </div>
      <div class="slot-card-body">
        <div class="prog-row">
          <div class="prog-label">Spots Filled</div>
          <div class="prog-count" style="color:${fillColor};">${count} / ${MAX}</div>
        </div>
        <div class="prog-bar">
          <div class="prog-fill" style="width:${pct}%;background:${fillColor};"></div>
        </div>
        <div class="submitted-rows">${rowsHTML}</div>
        <div class="slot-action">${actionHTML}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderSlots();
  updateDashStatus();
  updateStatCount();
});
