// summary.js
// Injected alongside content.js. Called by endMeeting() in content.js.

function showMeetingSummary({ cost, my_cost, duration_seconds, team_size, annual_salary, currency, mode, recordIndex }) {
  const existing = document.getElementById('mct-summary-overlay');
  if (existing) existing.remove();

  injectSummaryStyles();

  const mins = Math.round(duration_seconds / 60);

  // Headline cost depends on mode
  const headlineCost = mode === 'freelancer' ? my_cost : cost;
  const costStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(headlineCost);

  const teamCostStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(cost);

  const myCostStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(my_cost);

  const salaryStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(annual_salary);

  const shareText = mode === 'freelancer'
    ? 'Just spent ' + mins + ' min in a meeting. That cost me ' + myCostStr + ' of my time \uD83D\uDCB8 \u2014 Meeting Cost Ticker for Chrome'
    : 'Just finished a ' + mins + '-min meeting that cost our team ' + teamCostStr + ' \uD83D\uDCB8 \u2014 Meeting Cost Ticker for Chrome';

  const overlay = document.createElement('div');
  overlay.id = 'mct-summary-overlay';

  const card = document.createElement('div');
  card.id = 'mct-summary-card';

  // ---- Main card content ----
  const icon = document.createElement('div');
  icon.className = 'mct-sum-icon';
  icon.textContent = '\uD83D\uDCB8';

  const title = document.createElement('h2');
  title.className = 'mct-sum-title';
  title.textContent = 'Meeting complete';

  const costHeadline = document.createElement('div');
  costHeadline.className = 'mct-sum-cost';
  costHeadline.textContent = costStr;

  const costSubtitle = document.createElement('div');
  costSubtitle.className = 'mct-sum-cost-sub';
  if (mode === 'freelancer') {
    costSubtitle.textContent = 'your time cost';
  } else {
    costSubtitle.textContent = 'team total';
  }

  const details = document.createElement('div');
  details.className = 'mct-sum-details';

  function makeRow(label, value) {
    const row = document.createElement('div');
    row.className = 'mct-sum-row';
    const lbl = document.createElement('span');
    lbl.className = 'mct-sum-lbl';
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'mct-sum-val';
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  details.appendChild(makeRow('Duration', mins + ' minutes'));
  details.appendChild(makeRow('Team size', mode === 'freelancer' ? 'just you' : team_size + ' people'));
  details.appendChild(makeRow('Avg salary', salaryStr + '/yr'));

  // Secondary cost row — always show the "other view"
  if (mode === 'freelancer') {
    details.appendChild(makeRow('Team total', teamCostStr));
  } else {
    details.appendChild(makeRow('Your share', myCostStr));
  }

  // ---- ROI Rating ----
  const roiSection = document.createElement('div');
  roiSection.className = 'mct-roi-section';

  const roiLabel = document.createElement('div');
  roiLabel.className = 'mct-roi-label';
  roiLabel.textContent = 'Was this meeting worth it?';

  const roiBtns = document.createElement('div');
  roiBtns.className = 'mct-roi-btns';

  const ratings = [
    { emoji: '\uD83D\uDC4E', label: 'No', value: 'bad' },
    { emoji: '\uD83D\uDE10', label: 'Maybe', value: 'ok' },
    { emoji: '\uD83D\uDC4D', label: 'Yes!', value: 'good' }
  ];

  let selectedRating = null;

  ratings.forEach(({ emoji, label, value }) => {
    const btn = document.createElement('button');
    btn.className = 'mct-roi-btn';
    btn.dataset.value = value;

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'mct-roi-emoji';
    emojiSpan.textContent = emoji;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'mct-roi-lbl';
    labelSpan.textContent = label;

    btn.appendChild(emojiSpan);
    btn.appendChild(labelSpan);

    btn.addEventListener('click', () => {
      selectedRating = value;
      roiBtns.querySelectorAll('.mct-roi-btn').forEach(b => b.classList.remove('mct-roi-selected'));
      btn.classList.add('mct-roi-selected');
      if (typeof recordIndex === 'number') {
        updateMeetingRoi(recordIndex, value);
      }
    });

    roiBtns.appendChild(btn);
  });

  roiSection.appendChild(roiLabel);
  roiSection.appendChild(roiBtns);

  // ---- Actions row (default view) ----
  const actions = document.createElement('div');
  actions.className = 'mct-sum-actions';

  const shareBtn = document.createElement('button');
  shareBtn.className = 'mct-sum-btn mct-sum-share';
  shareBtn.textContent = 'Share this';

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'mct-sum-btn mct-sum-dismiss';
  dismissBtn.textContent = 'Dismiss';

  actions.appendChild(shareBtn);
  actions.appendChild(dismissBtn);

  // ---- Share panel (shown on Share click) ----
  const sharePanel = document.createElement('div');
  sharePanel.className = 'mct-share-panel';
  sharePanel.style.display = 'none';

  const imgPreview = document.createElement('img');
  imgPreview.className = 'mct-share-preview';
  imgPreview.alt = 'Meeting receipt card';

  const shareApps = document.createElement('div');
  shareApps.className = 'mct-share-apps';

  function makeAppBtn(label, emoji, onClick) {
    const btn = document.createElement('button');
    btn.className = 'mct-app-btn';
    const e = document.createElement('span');
    e.className = 'mct-app-emoji';
    e.textContent = emoji;
    const l = document.createElement('span');
    l.className = 'mct-app-label';
    l.textContent = label;
    btn.appendChild(e);
    btn.appendChild(l);
    btn.addEventListener('click', onClick);
    return btn;
  }

  const twitterBtn = makeAppBtn('Twitter', '\uD83D\uDC26', () => {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText), '_blank', 'noopener');
  });

  const whatsappBtn = makeAppBtn('WhatsApp', '\uD83D\uDCAC', () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank', 'noopener');
  });

  const copyBtn = makeAppBtn('Copy text', '\uD83D\uDCCB', () => {
    navigator.clipboard.writeText(shareText).then(() => {
      copyBtn.querySelector('.mct-app-label').textContent = 'Copied!';
      setTimeout(() => { copyBtn.querySelector('.mct-app-label').textContent = 'Copy text'; }, 2000);
    });
  });

  const downloadBtn = makeAppBtn('Save image', '\uD83D\uDCF7', () => {
    const a = document.createElement('a');
    a.href = imgPreview.src;
    a.download = 'meeting-receipt.png';
    a.click();
  });

  shareApps.appendChild(twitterBtn);
  shareApps.appendChild(whatsappBtn);
  shareApps.appendChild(copyBtn);
  shareApps.appendChild(downloadBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'mct-sum-btn mct-sum-dismiss mct-back-btn';
  backBtn.textContent = '\u2190 Back';
  backBtn.addEventListener('click', () => {
    sharePanel.style.display = 'none';
    actions.style.display = 'flex';
  });

  sharePanel.appendChild(imgPreview);
  sharePanel.appendChild(shareApps);
  sharePanel.appendChild(backBtn);

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(costHeadline);
  card.appendChild(costSubtitle);
  card.appendChild(details);
  card.appendChild(roiSection);
  card.appendChild(actions);
  card.appendChild(sharePanel);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  dismissBtn.addEventListener('click', () => overlay.remove());

  shareBtn.addEventListener('click', async () => {
    // Render the card image
    const blob = await renderShareCard({ costStr, mins, team_size, salaryStr, mode, myCostStr, teamCostStr });
    const url = URL.createObjectURL(blob);
    imgPreview.src = url;

    // Try native share API with image (works on mobile Chrome / some desktop)
    if (navigator.canShare) {
      try {
        const file = new File([blob], 'meeting-receipt.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file], text: shareText })) {
          await navigator.share({ files: [file], text: shareText, title: 'Meeting Cost Ticker' });
          return; // native share sheet handled it
        }
      } catch (err) {
        // User cancelled or not supported — fall through to share panel
        if (err.name === 'AbortError') return;
      }
    }

    // Show custom share panel
    actions.style.display = 'none';
    sharePanel.style.display = 'block';
  });
}

// ---- ROI update ----------------------------------------------------------

function updateMeetingRoi(recordIndex, rating) {
  chrome.storage.local.get(['meeting_history'], (data) => {
    const history = data.meeting_history || [];
    if (history[recordIndex]) {
      history[recordIndex].roi = rating;
      chrome.storage.local.set({ meeting_history: history });
    }
  });
}

// ---- Canvas receipt card renderer ----------------------------------------

function renderShareCard({ costStr, mins, team_size, salaryStr, mode, myCostStr, teamCostStr }) {
  return new Promise((resolve) => {
    const W = 600, H = 390;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#16161f';
    mctRoundRect(ctx, 0, 0, W, H, 20);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(114,164,242,0.35)';
    ctx.lineWidth = 2;
    mctRoundRect(ctx, 1, 1, W - 2, H - 2, 20);
    ctx.stroke();

    // Money emoji
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('\uD83D\uDCB8', W / 2, 68);

    // "Meeting complete"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Meeting complete', W / 2, 110);

    // Cost (large blue)
    ctx.fillStyle = '#72a4f2';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillText(costStr, W / 2, 178);

    // Cost subtitle
    ctx.fillStyle = 'rgba(114,164,242,0.6)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(mode === 'freelancer' ? 'your time cost' : 'team total', W / 2, 200);

    // Details box background
    ctx.fillStyle = '#1c1c2a';
    mctRoundRect(ctx, 40, 218, W - 80, 128, 10);
    ctx.fill();

    // Details rows
    const rows = [
      ['Duration', mins + ' minutes'],
      ['Team size', team_size + ' people'],
      ['Avg salary', salaryStr + '/yr'],
      [mode === 'freelancer' ? 'Team total' : 'Your share', mode === 'freelancer' ? teamCostStr : myCostStr]
    ];
    rows.forEach(([label, value], i) => {
      const y = 250 + i * 26;
      ctx.fillStyle = '#6a6a88';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, 64, y);
      ctx.fillStyle = '#c0c0d8';
      ctx.textAlign = 'right';
      ctx.fillText(value, W - 64, y);
    });

    // Branding footer
    ctx.fillStyle = 'rgba(114,164,242,0.45)';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Meeting Cost Ticker for Chrome  \u2022  ko-fi.com/Y8Y0BW7ME', W / 2, 368);

    canvas.toBlob(resolve, 'image/png');
  });
}

function mctRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---- Styles ---------------------------------------------------------------

function injectSummaryStyles() {
  if (document.getElementById('mct-summary-styles')) return;
  const style = document.createElement('style');
  style.id = 'mct-summary-styles';
  style.textContent = [
    '#mct-summary-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#mct-summary-card{background:#16161f;border:1px solid rgba(114,164,242,0.25);border-radius:16px;padding:32px 36px;text-align:center;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.6);color:#e0e0f0}',
    '.mct-sum-icon{font-size:36px;margin-bottom:12px}',
    '.mct-sum-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:8px}',
    '.mct-sum-cost{font-size:42px;font-weight:800;color:#72a4f2;line-height:1.1}',
    '.mct-sum-cost-sub{font-size:11px;color:rgba(114,164,242,0.6);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px}',
    '.mct-sum-details{background:#1c1c2a;border-radius:10px;padding:12px 16px;margin-bottom:14px}',
    '.mct-sum-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}',
    '.mct-sum-lbl{color:#6a6a88}',
    '.mct-sum-val{color:#c0c0d8;font-weight:500}',
    /* ROI section */
    '.mct-roi-section{margin-bottom:14px}',
    '.mct-roi-label{font-size:11px;color:#6a6a88;margin-bottom:8px}',
    '.mct-roi-btns{display:flex;gap:8px;justify-content:center}',
    '.mct-roi-btn{background:#1c1c2a;border:1px solid #2a2a3c;border-radius:10px;padding:8px 18px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .15s;flex:1}',
    '.mct-roi-btn:hover{background:#252535;border-color:#3a3a50}',
    '.mct-roi-btn.mct-roi-selected{background:rgba(114,164,242,0.15);border-color:rgba(114,164,242,0.5)}',
    '.mct-roi-emoji{font-size:20px;line-height:1}',
    '.mct-roi-lbl{font-size:10px;color:#9a9ab8}',
    /* Actions */
    '.mct-sum-actions{display:flex;gap:10px;justify-content:center}',
    '.mct-sum-btn{border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}',
    '.mct-sum-btn:hover{opacity:.85}',
    '.mct-sum-share{background:#72a4f2;color:#0a0a14}',
    '.mct-sum-dismiss{background:#2a2a3a;color:#a0a0c0}',
    /* Share panel */
    '.mct-share-panel{text-align:center}',
    '.mct-share-preview{width:100%;border-radius:10px;margin-bottom:16px;display:block;box-shadow:0 4px 20px rgba(0,0,0,0.4)}',
    '.mct-share-apps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}',
    '.mct-app-btn{background:#1c1c2a;border:1px solid #2a2a3c;border-radius:10px;padding:10px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:background .15s}',
    '.mct-app-btn:hover{background:#252535}',
    '.mct-app-emoji{font-size:20px;line-height:1}',
    '.mct-app-label{font-size:10px;color:#9a9ab8;font-weight:500}',
    '.mct-back-btn{width:100%;margin-top:0}'
  ].join('');
  document.head.appendChild(style);
}
