// popup.js

const CURRENCY_LOCALES = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  NPR: 'ne-NP', INR: 'en-IN', AUD: 'en-AU'
};

const ROI_EMOJI = { bad: '\uD83D\uDC4E', ok: '\uD83D\uDE10', good: '\uD83D\uDC4D' };

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

function updateCalcDisplay() {
  const salary = parseFloat(document.getElementById('annual-salary').value) || 0;
  const teamSize = parseInt(document.getElementById('team-size').value) || 1;
  const currency = document.getElementById('currency').value;
  const hourly = salary / 52 / 40;
  const perSec = (salary / 52 / 40 / 3600) * teamSize;
  document.getElementById('hourly-per-person').textContent = formatCurrency(hourly, currency);
  document.getElementById('per-second').textContent = formatCurrency(perSec, currency);
}

function setModeActive(mode) {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function loadSettings() {
  chrome.storage.sync.get(['team_size', 'annual_salary', 'currency', 'mode'], (s) => {
    document.getElementById('team-size').value = s.team_size ?? 5;
    document.getElementById('annual-salary').value = s.annual_salary ?? 60000;
    const currencySelect = document.getElementById('currency');
    if (s.currency) currencySelect.value = s.currency;
    setModeActive(s.mode ?? 'company');
    updateCalcDisplay();
  });
}

function saveSettings() {
  const activeMode = document.querySelector('.mode-btn.active');
  const settings = {
    team_size: parseInt(document.getElementById('team-size').value) || 5,
    annual_salary: parseFloat(document.getElementById('annual-salary').value) || 60000,
    currency: document.getElementById('currency').value,
    mode: activeMode ? activeMode.dataset.mode : 'company'
  };
  chrome.storage.sync.set(settings, () => {
    const confirm = document.getElementById('save-confirm');
    confirm.classList.add('visible');
    setTimeout(() => confirm.classList.remove('visible'), 2000);
  });
}

function getStartOfWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function loadStats() {
  chrome.storage.local.get(['meeting_history'], ({ meeting_history = [] }) => {
    const weekStart = getStartOfWeek();
    const weekMeetings = meeting_history.filter(m => new Date(m.date).getTime() >= weekStart);
    document.getElementById('stat-meetings').textContent = weekMeetings.length;
    const totalSecs = weekMeetings.reduce((a, m) => a + (m.duration_seconds || 0), 0);
    document.getElementById('stat-hours').textContent = (totalSecs / 3600).toFixed(1) + 'h';
    const totalCost = weekMeetings.reduce((a, m) => a + (m.cost || 0), 0);
    const currency = weekMeetings.length > 0
      ? weekMeetings[weekMeetings.length - 1].currency
      : 'USD';
    document.getElementById('stat-cost').textContent = formatCurrency(totalCost, currency);

    // Week % progress bar (40-hour work week)
    const weekPct = Math.min((totalSecs / (40 * 3600)) * 100, 100);
    const pctLabel = document.getElementById('week-pct');
    const bar = document.getElementById('week-bar-fill');
    pctLabel.textContent = weekPct.toFixed(1) + '%';
    bar.style.width = weekPct + '%';
    bar.classList.remove('bar-warn', 'bar-danger');
    if (weekPct >= 50) bar.classList.add('bar-danger');
    else if (weekPct >= 25) bar.classList.add('bar-warn');

    renderHistory(meeting_history);
  });
}

function renderHistory(history) {
  const list = document.getElementById('history-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  const recent = [...history].reverse().slice(0, 5);
  if (recent.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No meetings recorded yet.';
    list.appendChild(empty);
    return;
  }

  recent.forEach(m => {
    const row = document.createElement('div');
    row.className = 'history-item';

    const dateEl = document.createElement('span');
    dateEl.className = 'history-date';
    dateEl.textContent = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const durEl = document.createElement('span');
    durEl.className = 'history-duration';
    durEl.textContent = Math.round((m.duration_seconds || 0) / 60) + 'm';

    const costEl = document.createElement('span');
    costEl.className = 'history-cost';
    costEl.textContent = formatCurrency(m.cost || 0, m.currency || 'USD');

    const roiEl = document.createElement('span');
    roiEl.className = 'history-roi';
    if (m.roi && ROI_EMOJI[m.roi]) {
      roiEl.textContent = ROI_EMOJI[m.roi];
    }

    row.appendChild(dateEl);
    row.appendChild(durEl);
    row.appendChild(costEl);
    row.appendChild(roiEl);
    list.appendChild(row);
  });
}

function clearHistory() {
  if (!confirm('Clear all meeting history?')) return;
  chrome.storage.local.set({ meeting_history: [] }, loadStats);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStats();
  document.getElementById('team-size').addEventListener('input', updateCalcDisplay);
  document.getElementById('annual-salary').addEventListener('input', updateCalcDisplay);
  document.getElementById('currency').addEventListener('change', updateCalcDisplay);
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('clear-history').addEventListener('click', clearHistory);

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setModeActive(btn.dataset.mode));
  });
});
