// content.js

let tickerEl = null;
let intervalId = null;
let accumulatedCost = 0;
let startTime = null;
let meetingActive = false;
let settings = { team_size: 5, annual_salary: 60000, currency: 'USD', mode: 'company' };

// ---- TICKER STYLES -------------------------------------------------------

function injectTickerStyles() {
  if (document.getElementById('mct-styles')) return;
  const style = document.createElement('style');
  style.id = 'mct-styles';
  style.textContent = [
    '#mct-ticker .mct-controls{display:flex;justify-content:flex-end;gap:4px;margin-bottom:2px}',
    '#mct-ticker .mct-btn{background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;cursor:pointer;padding:0 2px;line-height:1}',
    '#mct-ticker .mct-btn:hover{color:rgba(255,255,255,0.9)}',
    '#mct-ticker .mct-label{font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}',
    '#mct-ticker .mct-cost{font-size:22px;font-weight:700;color:#72a4f2;line-height:1.1;margin-bottom:4px}',
    '#mct-ticker .mct-meta{font-size:11px;color:rgba(255,255,255,0.45)}'
  ].join('');
  document.head.appendChild(style);
}

// ---- TICKER WIDGET -------------------------------------------------------

function createTicker() {
  if (document.getElementById('mct-ticker')) return;
  if (sessionStorage.getItem('mct_dismissed') === '1') return;

  injectTickerStyles();

  tickerEl = document.createElement('div');
  tickerEl.id = 'mct-ticker';

  const controls = document.createElement('div');
  controls.className = 'mct-controls';

  const minBtn = document.createElement('button');
  minBtn.className = 'mct-btn mct-minimize';
  minBtn.title = 'Minimize';
  minBtn.textContent = '\u2212';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'mct-btn mct-close';
  closeBtn.title = 'Dismiss';
  closeBtn.textContent = '\u00d7';

  controls.appendChild(minBtn);
  controls.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'mct-body';

  const labelEl = document.createElement('div');
  labelEl.className = 'mct-label';
  labelEl.textContent = settings.mode === 'freelancer' ? 'Your cost' : 'Meeting cost';

  const costEl = document.createElement('div');
  costEl.className = 'mct-cost';
  costEl.textContent = formatCost(0, settings.currency);

  const metaEl = document.createElement('div');
  metaEl.className = 'mct-meta';
  metaEl.textContent = '0:00 \u00b7 ' + settings.team_size + ' people';

  body.appendChild(labelEl);
  body.appendChild(costEl);
  body.appendChild(metaEl);

  tickerEl.appendChild(controls);
  tickerEl.appendChild(body);

  Object.assign(tickerEl.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    background: 'rgba(26,26,26,0.92)',
    backdropFilter: 'blur(8px)',
    color: '#ffffff',
    border: '1px solid rgba(114,164,242,0.3)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '13px',
    cursor: 'grab',
    userSelect: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    minWidth: '140px'
  });

  document.body.appendChild(tickerEl);
  makeDraggable(tickerEl);

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sessionStorage.setItem('mct_dismissed', '1');
    tickerEl.remove();
    tickerEl = null;
  });

  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const minimized = tickerEl.classList.toggle('mct-minimized');
    body.style.display = minimized ? 'none' : '';
    minBtn.textContent = minimized ? '+' : '\u2212';
    tickerEl.style.padding = minimized ? '6px 10px' : '10px 14px';
    controls.style.marginBottom = minimized ? '0' : '2px';
  });
}

// ---- DRAG ---------------------------------------------------------------

function makeDraggable(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('mct-btn')) return;
    isDragging = true;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    el.style.cursor = 'grabbing';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - el.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - el.offsetHeight));
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.style.cursor = 'grab';
    }
  });
}

// ---- COST HELPERS -------------------------------------------------------

function calcCostPerSecond(salary, teamSize) {
  return (salary / 52 / 40 / 3600) * teamSize;
}

function formatCost(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

// ---- TICKER UPDATE ------------------------------------------------------

function updateTicker(cost, elapsedSecs) {
  if (!tickerEl) return;
  const costEl = tickerEl.querySelector('.mct-cost');
  const metaEl = tickerEl.querySelector('.mct-meta');
  const displayCost = settings.mode === 'freelancer'
    ? cost / settings.team_size
    : cost;
  if (costEl) costEl.textContent = formatCost(displayCost, settings.currency);
  if (metaEl) metaEl.textContent = formatDuration(elapsedSecs) + ' \u00b7 ' + (settings.mode === 'freelancer' ? 'just you' : settings.team_size + ' people');
}

// ---- MEETING LIFECYCLE --------------------------------------------------

function startMeeting() {
  if (meetingActive) return;
  meetingActive = true;
  accumulatedCost = 0;
  startTime = Date.now();

  chrome.storage.sync.get(['team_size', 'annual_salary', 'currency', 'mode'], (s) => {
    settings = {
      team_size: s.team_size ?? 5,
      annual_salary: s.annual_salary ?? 60000,
      currency: s.currency ?? 'USD',
      mode: s.mode ?? 'company'
    };
    createTicker();
    const costPerSec = calcCostPerSecond(settings.annual_salary, settings.team_size);
    intervalId = setInterval(() => {
      accumulatedCost += costPerSec;
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      updateTicker(accumulatedCost, elapsedSecs);
    }, 1000);
  });
}

function endMeeting() {
  if (!meetingActive) return;
  meetingActive = false;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }

  const durationSecs = Math.floor((Date.now() - startTime) / 1000);
  const teamCost = accumulatedCost;
  const myCost = accumulatedCost / settings.team_size;
  if (tickerEl) { tickerEl.remove(); tickerEl = null; }

  const record = {
    date: new Date().toISOString(),
    duration_seconds: durationSecs,
    cost: teamCost,
    my_cost: myCost,
    team_size: settings.team_size,
    salary: settings.annual_salary,
    currency: settings.currency,
    mode: settings.mode,
    roi: null
  };

  saveMeetingRecord(record, (recordIndex) => {
    if (typeof showMeetingSummary === 'function') {
      showMeetingSummary({
        cost: teamCost,
        my_cost: myCost,
        duration_seconds: durationSecs,
        team_size: settings.team_size,
        annual_salary: settings.annual_salary,
        currency: settings.currency,
        mode: settings.mode,
        recordIndex
      });
    }
  });
}

function saveMeetingRecord(record, callback) {
  chrome.storage.local.get(['meeting_history'], (data) => {
    let history = data.meeting_history || [];
    history.push(record);
    if (history.length > 100) history = history.slice(-100);
    const recordIndex = history.length - 1;
    chrome.storage.local.set({ meeting_history: history }, () => {
      if (typeof callback === 'function') callback(recordIndex);
    });
  });
}

// ---- MEETING DETECTION --------------------------------------------------

function isMeetActive() {
  return !![...document.querySelectorAll('button')].find(
    b => b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('leave call')
  );
}

function isZoomActive() {
  return !!(
    document.querySelector('.footer__btns-container') ||
    [...document.querySelectorAll('button')].find(
      b => b.textContent && (b.textContent.trim() === 'Leave' || b.textContent.trim() === 'End')
    )
  );
}

function checkMeetingState() {
  const active = isMeetActive() || isZoomActive();
  if (active && !meetingActive) startMeeting();
  else if (!active && meetingActive) endMeeting();
}

const observer = new MutationObserver(() => checkMeetingState());
observer.observe(document.body, { childList: true, subtree: true });
checkMeetingState();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TAB_ACTIVATED') checkMeetingState();
});
