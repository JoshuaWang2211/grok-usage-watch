function toggleCollapse() {
  isCollapsed = !isCollapsed;
  settings.isCollapsed = isCollapsed;
  saveSettings();
  updateDisplay(lastData);
}

function createCollapseButton(mini = false) {
  const button = document.createElement('div');
  const colors = getTextColors();
  const cfg = mini
    ? { offset: '2px', size: '14px', font: '11px' }
    : { offset: '6px', size: '16px', font: '12px' };

  button.className = 'no-drag';
  button.style.cssText = `
    position: absolute;
    top: ${cfg.offset};
    left: ${cfg.offset};
    width: ${cfg.size};
    height: ${cfg.size};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${cfg.font};
    color: ${colors.label};
    opacity: 0.7;
    transition: opacity 0.2s ease;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  `;

  button.innerHTML = isCollapsed ? '+' : '−';
  button.title = isCollapsed ? 'Expand' : 'Collapse';

  button.onmouseenter = () => button.style.opacity = '1';
  button.onmouseleave = () => button.style.opacity = '0.7';

  button.onclick = (e) => {
    e.stopPropagation();
    toggleCollapse();
  };

  return button;
}

let displayDiv = null;
let currentView = 'main';
let isCollapsed = false;
let settings = {
  colorMode: 'light',
  isCollapsed: false,
  uiScale: 1.0,
  use24Hour: false,
  hideBreakdown: false
};

const MODELS = [
  { key: 'grok-3', label: 'Fast' }
];

const CREDITS_SERVICE = 'grok_api_v2.GrokBuildBilling';
const CREDITS_METHOD = 'GetGrokCreditsConfig';

const F_USAGE_PERCENT = 1;
const F_PERIOD_END = 5;
const F_PRODUCT_USAGE = 7;

const PRODUCT_LABELS = {
  2: 'Grok Build',
  4: 'Chat',
  5: 'Imagine',
  6: 'Voice'
};

let lastData = { buckets: [], unauthorized: false, paid: null };

const PANEL_WIDTH_PX = 200;
const MINI_PANEL_WIDTH_PX = 80;
const PANEL_PADDING_PX = 12;
const PANEL_BORDER_PX = 1;
const PANEL_DEFAULT_TOP_PX = 130;
const PANEL_DEFAULT_RIGHT_PX = 44;
const UI_SCALE_MIN = 0.7;
const UI_SCALE_MAX = 1.5;

let isResizing = false;

function loadPosition() {
  try {
    const saved = localStorage.getItem('grokUsageWatchPosition');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {

  }
  return null;
}

function savePosition(top, left) {
  try {
    localStorage.setItem('grokUsageWatchPosition', JSON.stringify({ top, left }));
  } catch (e) {

  }
}

function getDefaultPosition() {
  const renderedWidth = PANEL_WIDTH_PX + (PANEL_PADDING_PX + PANEL_BORDER_PX) * 2;
  return {
    top: PANEL_DEFAULT_TOP_PX,
    left: Math.max(0, window.innerWidth - renderedWidth - PANEL_DEFAULT_RIGHT_PX)
  };
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('grokUsageWatchSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      settings = { ...settings, ...parsed };
      isCollapsed = settings.isCollapsed;

      delete settings.hideGrok4Heavy;
      delete settings.hiddenModels;
      delete settings.miniMode;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      settings.colorMode = 'dark';
    }
  } catch (e) {

  }

}

function saveSettings() {
  try {
    localStorage.setItem('grokUsageWatchSettings', JSON.stringify(settings));
  } catch (e) {

  }
}

function getOriginalStyles() {
  const base = {
    background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
    color: "#333",
    border: "1px solid #999"
  };

  if (settings.colorMode === 'dark') {
    return {
      ...base,
      background: "linear-gradient(135deg, #1a252f, #2c3e50)",
      color: "#ecf0f1",
      border: "1px solid #444"
    };
  }

  return base;
}

function getTextColors() {
  if (settings.colorMode === 'dark') {
    return {
      title: "#ecf0f1",
      section: "#bdc3c7",
      label: "#95a5a6",
      value: "#ecf0f1",
      link: "#3498db",
      loading: "#95a5a6"
    };
  } else {
    return {
      title: "#2c3e50",
      section: "#34495e",
      label: "#5f6a6a",
      value: "#333",
      link: "#2980b9",
      loading: "#7f8c8d"
    };
  }
}

function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;

  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (e.target.closest('.no-drag')) {
      return;
    }

    e.preventDefault();
    isDragging = true;

    if (element.style.right && element.style.right !== 'auto') {
      const rect = element.getBoundingClientRect();
      element.style.left = rect.left + "px";
      element.style.right = "auto";
    }

    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (!isDragging) return;
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    let newTop = element.offsetTop - pos2;
    let newLeft = element.offsetLeft - pos1;

    const currentScale = settings.uiScale || 1.0;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaledWidth = elementWidth * currentScale;
    const scaledHeight = elementHeight * currentScale;
    const overflowX = (scaledWidth - elementWidth) / 2;
    const overflowY = (scaledHeight - elementHeight) / 2;

    const scaledLeft = newLeft - overflowX;
    const scaledRight = newLeft + elementWidth + overflowX;
    const scaledTop = newTop - overflowY;
    const scaledBottom = newTop + elementHeight + overflowY;

    if (scaledLeft < 0) {
      newLeft = overflowX;
    }
    if (scaledRight > windowWidth) {
      newLeft = windowWidth - elementWidth - overflowX;
    }
    if (scaledTop < 0) {
      newTop = overflowY;
    }
    if (scaledBottom > windowHeight) {
      newTop = windowHeight - elementHeight - overflowY;
    }

    newLeft = Math.round(newLeft);
    newTop = Math.round(newTop);

    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
  }

  function closeDragElement() {
    if (isDragging) {
      const currentTop = parseInt(element.style.top) || 0;
      const currentLeft = parseInt(element.style.left) || 0;
      savePosition(currentTop, currentLeft);
    }

    isDragging = false;
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

const WARNING_THRESHOLD = 70;
const CRITICAL_THRESHOLD = 90;

function getQuotaColor(usedPercent) {
  if (usedPercent >= CRITICAL_THRESHOLD) {
    return { color: '#e74c3c' };
  } else if (usedPercent >= WARNING_THRESHOLD) {
    return { color: '#f39c12' };
  } else {
    return { color: '#27ae60' };
  }
}

function formatPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatClockTime(date) {
  return settings.use24Hour
    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatResetAt(resetAt) {
  if (!resetAt) return null;
  const date = new Date(resetAt);
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} at ${formatClockTime(date)}`;
}

function formatResetIn(resetAt) {
  if (!resetAt) return null;
  const minutes = Math.floor((resetAt - Date.now()) / 60000);
  if (!(minutes > 0)) return null;

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function createProgressBar(percentage, colorInfo, width = '100%') {
  const bgColor = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return `
    <div style="width: ${width}; height: 6px; background: ${bgColor}; border-radius: 3px; overflow: hidden; margin-top: 4px;">
      <div style="width: ${Math.max(0, Math.min(100, percentage))}%; height: 100%; background: ${colorInfo.color}; border-radius: 3px; transition: width 0.3s ease;"></div>
    </div>
  `;
}

function createSettingsButton(mini = false) {
  const button = document.createElement('div');
  const colors = getTextColors();
  const cfg = mini
    ? { offset: '2px', size: '14px', font: '9px', baseOpacity: '0.5', rotate: false }
    : { offset: '6px', size: '18px', font: '11px', baseOpacity: '0.7', rotate: true };

  button.className = 'no-drag';
  button.style.cssText = `
    position: absolute;
    top: ${cfg.offset};
    right: ${cfg.offset};
    width: ${cfg.size};
    height: ${cfg.size};
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${cfg.font};
    color: ${colors.label};
    opacity: ${cfg.baseOpacity};
    transition: all 0.2s ease;
    background: rgba(255,255,255,0.1);
  `;

  button.innerHTML = '⚙';
  button.title = 'Settings';

  button.onmouseenter = () => {
    button.style.opacity = '1';
    if (cfg.rotate) button.style.transform = 'rotate(45deg)';
  };
  button.onmouseleave = () => {
    button.style.opacity = cfg.baseOpacity;
    if (cfg.rotate) button.style.transform = 'rotate(0deg)';
  };

  button.onclick = (e) => {
    e.stopPropagation();
    showSettings();
  };

  return button;
}

function addButtonHover(btn) {
  btn.onmouseenter = () => {
    btn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    btn.style.borderColor = '#888';
  };
  btn.onmouseleave = () => {
    btn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
    btn.style.borderColor = getTextColors().label;
  };
}

function createToggle(checked, onChange) {
  const toggle = document.createElement('div');

  toggle.className = 'no-drag';
  toggle.style.cssText = `
    width: 36px;
    height: 18px;
    background: ${checked ? '#27ae60' : (settings.colorMode === 'dark' ? '#555' : '#ccc')};
    border-radius: 9px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s ease;
  `;

  const handle = document.createElement('div');
  handle.style.cssText = `
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: ${checked ? '20px' : '2px'};
    transition: left 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  `;

  toggle.appendChild(handle);

  let isUpdating = false;
  toggle.onclick = () => {
    if (isUpdating) return;

    isUpdating = true;
    const newChecked = !checked;

    toggle.style.background = newChecked ? '#27ae60' : (settings.colorMode === 'dark' ? '#555' : '#ccc');
    handle.style.left = newChecked ? '20px' : '2px';

    checked = newChecked;
    onChange(newChecked);

    setTimeout(() => {
      isUpdating = false;
    }, 100);
  };

  return toggle;
}

function createColorModeToggle() {
  const container = document.createElement('div');

  container.className = 'no-drag';
  container.style.cssText = `
    width: 60px;
    height: 18px;
    border-radius: 9px;
    position: relative;
    cursor: pointer;
    display: flex;
    overflow: hidden;
    transition: all 0.2s ease;
    border: 1px solid ${settings.colorMode === 'dark' ? '#555' : '#ccc'};
  `;

  const lightHalf = document.createElement('div');
  lightHalf.style.cssText = `
    width: 50%;
    height: 100%;
    background: ${settings.colorMode === 'light' ? '#f0f0f0' : '#444'};
    color: ${settings.colorMode === 'light' ? '#333' : '#888'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    font-weight: bold;
    transition: all 0.2s ease;
  `;
  lightHalf.textContent = 'Light';

  const darkHalf = document.createElement('div');
  darkHalf.style.cssText = `
    width: 50%;
    height: 100%;
    background: ${settings.colorMode === 'dark' ? '#2c3e50' : '#666'};
    color: ${settings.colorMode === 'dark' ? '#fff' : '#ccc'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    font-weight: bold;
    transition: all 0.2s ease;
  `;
  darkHalf.textContent = 'Dark';

  container.appendChild(lightHalf);
  container.appendChild(darkHalf);

  container.onmouseenter = () => {
    if (settings.colorMode === 'light') {
      darkHalf.style.background = '#5a5a5a';
    } else {
      lightHalf.style.background = '#555';
    }
  };
  container.onmouseleave = () => {
    lightHalf.style.background = settings.colorMode === 'light' ? '#f0f0f0' : '#444';
    darkHalf.style.background = settings.colorMode === 'dark' ? '#2c3e50' : '#666';
  };

  container.onclick = () => {
    settings.colorMode = settings.colorMode === 'light' ? 'dark' : 'light';
    saveSettings();
    updateDisplay(lastData);
  };

  return container;
}

function createResizeHandle() {
  const handle = document.createElement('div');
  const colors = getTextColors();

  handle.className = 'no-drag';
  handle.style.cssText = `
    position: absolute; right: 0; bottom: 0;
    width: 22px; height: 22px; cursor: nwse-resize;
  `;

  const grip = document.createElement('div');
  grip.style.cssText = `
    position: absolute; right: 2px; bottom: 2px;
    width: 18px; height: 18px; opacity: 0.5;
    transition: opacity 0.2s ease; pointer-events: none;
    background: linear-gradient(-45deg,
      transparent 4px, ${colors.label} 4px, ${colors.label} 6px,
      transparent 6px, transparent 8px,
      ${colors.label} 8px, ${colors.label} 10px,
      transparent 10px);
  `;

  handle.appendChild(grip);
  handle.title = 'Drag to resize';
  handle.onmouseenter = () => grip.style.opacity = '1';
  handle.onmouseleave = () => grip.style.opacity = '0.55';
  handle.onmousedown = startResize;
  return handle;
}

function startResize(e) {
  if (!displayDiv) return;
  e.preventDefault();
  e.stopPropagation();
  isResizing = true;

  const startX = e.clientX;
  const startY = e.clientY;
  const startScale = settings.uiScale || 1.0;
  const baseW = displayDiv.offsetWidth;
  const baseH = displayDiv.offsetHeight;

  displayDiv.style.transition = 'none';
  displayDiv.style.left = (displayDiv.offsetLeft - baseW * (startScale - 1) / 2) + 'px';
  displayDiv.style.top = (displayDiv.offsetTop - baseH * (startScale - 1) / 2) + 'px';
  displayDiv.style.transformOrigin = '0 0';
  displayDiv.style.transform = `scale(${startScale})`;

  function onMove(ev) {
    let s = startScale + ((ev.clientX - startX) / baseW + (ev.clientY - startY) / baseH) / 2;
    s = Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, s));
    settings.uiScale = s;
    displayDiv.style.transform = `scale(${s})`;
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const s = settings.uiScale;
    displayDiv.style.left = Math.round(parseFloat(displayDiv.style.left) + baseW * (s - 1) / 2) + 'px';
    displayDiv.style.top = Math.round(parseFloat(displayDiv.style.top) + baseH * (s - 1) / 2) + 'px';
    displayDiv.style.transformOrigin = 'center center';
    displayDiv.style.transition = 'transform 0.2s ease, opacity 0.3s ease';
    isResizing = false;
    saveSettings();
    savePosition(parseInt(displayDiv.style.top) || 0, parseInt(displayDiv.style.left) || 0);
    keepOnScreen();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function applyCurrentUIScale() {
  if (displayDiv && !isResizing) {
    displayDiv.style.transformOrigin = 'center center';
    displayDiv.style.transform = `scale(${settings.uiScale})`;
  }
}

function showSettings() {
  currentView = 'settings';
  updateDisplay(lastData);
}

function showAbout() {
  currentView = 'about';
  updateDisplay(lastData);
}

function showMain() {
  currentView = 'main';
  updateDisplay(lastData);
}

function currentPanelWidth() {
  return (currentView === 'main' && isCollapsed) ? MINI_PANEL_WIDTH_PX : PANEL_WIDTH_PX;
}

function createDisplay() {
  if (!displayDiv) {
    displayDiv = document.createElement("div");
    displayDiv.id = "grok-rate-checker";

    const styles = getOriginalStyles();
    displayDiv.style.position = "fixed";
    displayDiv.style.background = styles.background;
    displayDiv.style.padding = PANEL_PADDING_PX + "px";
    displayDiv.style.border = styles.border;
    displayDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    displayDiv.style.color = styles.color;
    displayDiv.style.zIndex = "10000";
    displayDiv.style.borderRadius = "8px";
    displayDiv.style.fontFamily = "Arial, sans-serif";
    displayDiv.style.cursor = "move";
    displayDiv.style.transition = "transform 0.2s ease, opacity 0.3s ease";
    displayDiv.style.minWidth = currentPanelWidth() + "px";

    const savedPosition = loadPosition();
    if (savedPosition) {
      displayDiv.style.top = savedPosition.top + "px";
      displayDiv.style.left = savedPosition.left + "px";
      displayDiv.style.right = "auto";
    } else {
      const { top, left } = getDefaultPosition();
      displayDiv.style.top = top + "px";
      displayDiv.style.left = left + "px";
      displayDiv.style.right = "auto";
    }

    displayDiv.onmouseover = () => {
      if (isResizing) return;
      const hoverScale = (settings.uiScale || 1.0) * 1.05;
      displayDiv.style.transform = `scale(${hoverScale})`;
      displayDiv.style.transformOrigin = 'center';
    };
    displayDiv.onmouseout = () => {
      applyCurrentUIScale();
    };

    if (document.body) {
      document.body.appendChild(displayDiv);
      makeDraggable(displayDiv);
      applyCurrentUIScale();
    }
  }
}

function keepOnScreen() {
  if (!displayDiv || isResizing) return;
  const scale = settings.uiScale || 1.0;
  const w = displayDiv.offsetWidth;
  const h = displayDiv.offsetHeight;
  const overflowX = (w * scale - w) / 2;
  const overflowY = (h * scale - h) / 2;
  const maxLeft = Math.max(overflowX, window.innerWidth - w - overflowX);
  const maxTop = Math.max(overflowY, window.innerHeight - h - overflowY);
  const left = Math.round(Math.min(Math.max(overflowX, displayDiv.offsetLeft), maxLeft));
  const top = Math.round(Math.min(Math.max(overflowY, displayDiv.offsetTop), maxTop));
  if (left !== displayDiv.offsetLeft) { displayDiv.style.left = left + 'px'; displayDiv.style.right = 'auto'; }
  if (top !== displayDiv.offsetTop) { displayDiv.style.top = top + 'px'; }
}

function updateDisplay(data) {
  createDisplay();

  const styles = getOriginalStyles();
  displayDiv.style.background = styles.background;
  displayDiv.style.border = styles.border;
  displayDiv.style.color = styles.color;

  const boxBefore = displayDiv.getBoundingClientRect();
  const rightDocked = (boxBefore.left + boxBefore.right) / 2 > window.innerWidth / 2;
  displayDiv.style.minWidth = currentPanelWidth() + "px";

  if (currentView === 'settings') {
    showSettingsView();
  } else if (currentView === 'about') {
    showAboutView();
  } else {
    showMainView(data);
  }

  if (rightDocked) {
    const shift = boxBefore.right - displayDiv.getBoundingClientRect().right;
    if (Math.abs(shift) >= 1) {
      displayDiv.style.left = Math.round(displayDiv.offsetLeft + shift) + 'px';
      displayDiv.style.right = 'auto';
      savePosition(displayDiv.offsetTop, displayDiv.offsetLeft);
    }
  }

  applyCurrentUIScale();
  keepOnScreen();
  lastData = { ...data };
  addAnimationStyles();
}

function showMainView(data) {
  const colors = getTextColors();
  const buckets = data.buckets || [];

  if (isCollapsed) {
    let titleText = '...';
    let titleColor = colors.loading;
    if (data.unauthorized) {
      titleText = '🔒';
    } else if (data.paid) {
      titleText = `${formatPercent(data.paid.used)}%`;
      titleColor = getQuotaColor(data.paid.used).color;
    } else if (buckets.length > 0) {
      titleText = `${buckets[0].percent}%`;
      titleColor = getQuotaColor(buckets[0].used).color;
    }
    displayDiv.innerHTML = `
      <div style="padding: 2px 0;">
        <strong style="color: ${titleColor}; font-size: 14px; display: block; text-align: center; margin: 0;">${titleText}</strong>
      </div>
    `;
    displayDiv.appendChild(createCollapseButton(true));
    displayDiv.appendChild(createSettingsButton(true));
    return;
  }

  let body;
  if (data.unauthorized) {
    body = `<div style="color: ${colors.loading}; text-align: center; padding: 6px 0;">Sign in to grok.com</div>`;
  } else if (data.paid) {
    const quotaColor = getQuotaColor(data.paid.used);
    const resetAt = formatResetAt(data.paid.resetAt);
    const resetIn = formatResetIn(data.paid.resetAt);

    const breakdown = (!settings.hideBreakdown && data.paid.products.length) ? `
      <div style="font-size: 12px; color: ${colors.section}; font-weight: bold; margin-bottom: 4px;">Breakdown</div>
      ${data.paid.products.map(product => `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px;">
          <span style="font-size: 11px; color: ${colors.label};">${product.label}</span>
          <span style="font-size: 11px; color: ${colors.value};">${formatPercent(product.percent)}%</span>
        </div>
      `).join('')}
    ` : '';

    body = `
      <div style="margin-bottom: ${breakdown ? '14px' : '4px'};">
        <div style="font-size: 12px; color: ${colors.section}; font-weight: bold; margin-bottom: 4px;">Weekly limit</div>
        <div style="font-size: 13px; font-weight: bold; color: ${quotaColor.color};">${formatPercent(data.paid.used)}% used</div>
        ${createProgressBar(data.paid.used, quotaColor)}
        ${resetAt ? `<div style="font-size: 11px; color: ${colors.label}; margin-top: 4px;">Resets ${resetAt}</div>` : ''}
        ${resetIn ? `<div style="font-size: 11px; color: ${colors.label};">in ${resetIn}</div>` : ''}
      </div>
      ${breakdown}
    `;
  } else if (buckets.length === 0) {
    body = `<div style="color: ${colors.loading}; text-align: center; padding: 6px 0;">Loading...</div>`;
  } else {
    body = buckets.map(b => {
      const quotaColor = getQuotaColor(b.used);
      return `
        <div style="margin-bottom: 4px;">
          <div style="font-size: 12px; color: ${colors.section}; font-weight: bold; margin-bottom: 4px;">${b.label}</div>
          <div style="font-size: 13px; font-weight: bold; color: ${quotaColor.color};">${b.remaining} / ${b.total} left</div>
          ${createProgressBar(b.percent, quotaColor)}
        </div>
      `;
    }).join('');
  }

  displayDiv.innerHTML = `
    <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center;">Grok Usage Watch</strong>
    <div style="margin-top: 10px;">
      ${body}
    </div>
  `;

  displayDiv.appendChild(createCollapseButton());
  displayDiv.appendChild(createSettingsButton());
  displayDiv.appendChild(createResizeHandle());
}

function showSettingsView() {
  const colors = getTextColors();

  const paidPanel = !!lastData.paid;

  displayDiv.innerHTML = `
    <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center;">Settings</strong>
    <div style="margin-top: 8px;">
      ${paidPanel ? `
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Hide Breakdown</div>
          </div>
          <div id="hide-breakdown-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>

      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">24-Hour Time</div>
          </div>
          <div id="time-format-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>
      ` : ''}

      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Color Mode</div>
          </div>
          <div id="color-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>
      
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Reset UI</div>
          </div>
          <button id="reset-position-btn" class="no-drag" style="background: ${settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border: 1px solid ${colors.label}; color: ${colors.title}; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s ease; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;" title="Restore default position and size">↺</button>
        </div>
      </div>

      <div class="no-drag" style="text-align: center; margin-top: 8px; display: flex; justify-content: space-between;">
        <button id="close-settings" style="background: ${settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border: 1px solid ${colors.label}; color: ${colors.title}; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 10px; flex: 1; margin-right: 4px; transition: all 0.2s ease;">Back</button>
        <button id="show-about" style="background: ${settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border: 1px solid ${colors.label}; color: ${colors.title}; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 10px; flex: 1; margin-left: 4px; transition: all 0.2s ease;">About</button>
      </div>
    </div>
  `;

  const closeBtn = displayDiv.querySelector('#close-settings');
  closeBtn.onclick = showMain;
  addButtonHover(closeBtn);

  const aboutBtn = displayDiv.querySelector('#show-about');
  aboutBtn.onclick = showAbout;
  addButtonHover(aboutBtn);

  if (paidPanel) {
    displayDiv.querySelector('#hide-breakdown-toggle').appendChild(
      createToggle(settings.hideBreakdown, (checked) => {
        settings.hideBreakdown = checked;
        saveSettings();
      })
    );

    displayDiv.querySelector('#time-format-toggle').appendChild(
      createToggle(settings.use24Hour, (checked) => {
        settings.use24Hour = checked;
        saveSettings();
      })
    );
  }

  displayDiv.querySelector('#color-toggle').appendChild(createColorModeToggle());

  const resetPositionBtn = displayDiv.querySelector('#reset-position-btn');
  resetPositionBtn.onclick = () => {
    const { top, left } = getDefaultPosition();
    displayDiv.style.top = top + 'px';
    displayDiv.style.left = left + 'px';
    displayDiv.style.right = 'auto';
    savePosition(top, left);
    settings.uiScale = 1.0;
    saveSettings();
    showMain();
  };
  addButtonHover(resetPositionBtn);

  displayDiv.appendChild(createResizeHandle());
}

function showAboutView() {
  const colors = getTextColors();

  displayDiv.innerHTML = `
    <div style="position: relative; height: 280px;">
      <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center; margin-bottom: 16px;">About</strong>
      
      <div style="height: 235px; overflow-y: auto; padding-right: 8px; margin-bottom: 8px; scrollbar-width: thin;">
        <div style="color: ${colors.title}; font-size: 14px; font-weight: bold; margin-bottom: 8px;">Grok Usage Watch</div>
        <div style="color: ${colors.label}; font-size: 12px; margin-bottom: 4px;"><strong>Version:</strong> ${chrome.runtime.getManifest().version}</div>
        <div style="color: ${colors.label}; font-size: 12px; margin-bottom: 12px;"><strong>Author:</strong> Joshua Wang</div>
        
        <div style="color: ${colors.value}; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          Made with love for the Grok community.<br>
          Free, simple, and shared with joy.
        </div>
        
        <div style="color: ${colors.value}; font-size: 12px; line-height: 1.5;">
          If you enjoy it,<br>
          please <a href="https://chrome.google.com/webstore/detail/bmpboaihdkpkjehbceegdmndkonlpdge" target="_blank" class="no-drag" style="color: ${colors.link}; text-decoration: underline;">leave a review</a><br>
          and share it with others <span style="color: #e74c3c;">❤️</span>
        </div>
      </div>
      
      <div class="no-drag" style="text-align: center; position: absolute; bottom: 0; left: 0; right: 0;">
        <button id="close-about" style="background: ${settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border: 1px solid ${colors.label}; color: ${colors.title}; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 10px; width: 100%; transition: all 0.2s ease;">Back</button>
      </div>
    </div>
  `;

  const closeBtn = displayDiv.querySelector('#close-about');
  closeBtn.onclick = showMain;
  addButtonHover(closeBtn);

  displayDiv.appendChild(createResizeHandle());
}

function addAnimationStyles() {
  if (!document.head.querySelector("#grok-checker-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "grok-checker-styles";
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      #grok-rate-checker {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      #grok-rate-checker .no-drag {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

function fetchRateLimits(kind, model) {
  return fetch("https://grok.com/rest/rate-limits", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestKind: kind,
      modelName: model
    })
  })
    .then(response => {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Request failed for ${kind} (${model}) with status: ${response.status}`);
      }
    });
}

async function checkRateLimits() {
  const buckets = [];
  let answered = false;

  for (const model of MODELS) {
    let data;
    try {
      data = await fetchRateLimits("DEFAULT", model.key);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        updateDisplay({ buckets: [], unauthorized: true, paid: null });
        return;
      }
      continue;
    }
    answered = true;

    const total = Number(data.totalQueries);
    const remaining = Number(data.remainingQueries);

    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(remaining)) {
      continue;
    }

    const percent = Math.round((remaining / total) * 100);
    buckets.push({
      key: model.key,
      label: model.label,
      hue: model.hue,
      remaining,
      total,
      percent,
      used: 100 - percent
    });
  }

  // A transient failure must not wipe a good panel: keep the last free view,
  // the last paid view (its buckets are always empty, so checking
  // lastData.buckets alone would wipe it to "Loading..."), and the sign-in
  // prompt (actionable, unlike the "Loading..." that would replace it).
  // Only when the endpoint did not answer at all — an answered-but-empty
  // result (an account with no entitlement) falls through so the panel
  // reflects reality instead of freezing stale numbers forever.
  if (
    buckets.length === 0 &&
    !answered &&
    (lastData.buckets.length > 0 || lastData.paid || lastData.unauthorized)
  ) {
    return;
  }

  updateDisplay({ buckets, unauthorized: false, paid: null });
}

function decodeProto(bytes) {
  const out = {};
  let at = 0;

  const varint = () => {
    let value = 0;
    let scale = 1;
    while (at < bytes.length) {
      const byte = bytes[at++];
      value += (byte & 0x7f) * scale;
      if (!(byte & 0x80)) break;
      scale *= 128;
    }
    return value;
  };

  while (at < bytes.length) {
    const key = varint();
    const field = Math.floor(key / 8);
    const wire = key & 7;
    if (!field) break;

    if (wire === 0) {
      (out[field] || (out[field] = [])).push(varint());
    } else if (wire === 2) {
      const len = varint();
      if (at + len > bytes.length) break;
      (out[field] || (out[field] = [])).push(bytes.subarray(at, at + len));
      at += len;
    } else if (wire === 5) {
      (out[field] || (out[field] = [])).push(
        new DataView(bytes.buffer, bytes.byteOffset + at, 4).getFloat32(0, true)
      );
      at += 4;
    } else if (wire === 1) {
      at += 8;
    } else {
      break;
    }
  }

  return out;
}

function first(fields, number) {
  const values = fields[number];
  return values && values.length ? values[0] : undefined;
}

function fetchCreditsConfig() {
  return fetch(`https://grok.com/${CREDITS_SERVICE}/${CREDITS_METHOD}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/grpc-web+proto",
      "X-Grpc-Web": "1"
    },
    body: new Uint8Array(5)
  }).then(response => {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    if (!response.ok) {
      throw new Error(`Credits config failed with status: ${response.status}`);
    }
    return response.arrayBuffer();
  }).then(buffer => {
    const bytes = new Uint8Array(buffer);
    let at = 0;

    while (at + 5 <= bytes.length) {
      const flag = bytes[at];
      const view = new DataView(bytes.buffer, bytes.byteOffset + at + 1, 4);
      const len = view.getUint32(0, false);
      const body = bytes.subarray(at + 5, at + 5 + len);
      at += 5 + len;
      if ((flag & 0x80) === 0) {
        return decodeProto(body);
      }
    }

    throw new Error('Credits config returned no data frame');
  });
}

function readPaidUsage(response) {
  const configBytes = first(response, 1);
  if (!configBytes) {
    return null;
  }

  const config = decodeProto(configBytes);

  let resetAt = null;
  const periodEnd = first(config, F_PERIOD_END);
  if (periodEnd) {
    const seconds = first(decodeProto(periodEnd), 1);
    if (Number.isFinite(seconds) && seconds > 0) {
      resetAt = seconds * 1000;
    }
  }

  // Field presence, before the percent > 0 filter below: a product entry that
  // decodes is proof the schema still holds even when every percent is 0.
  const hasProductField = (config[F_PRODUCT_USAGE] || []).length > 0;
  const products = (config[F_PRODUCT_USAGE] || [])
    .map(entry => {
      const parsed = decodeProto(entry);
      const id = first(parsed, 1);
      const percent = first(parsed, 2);
      return {
        id,
        label: PRODUCT_LABELS[id] || 'Other',
        percent: Number.isFinite(percent) ? percent : 0
      };
    })
    .filter(product => product.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  // proto3 omits zero-valued scalars, so a missing usage field can be a real
  // 0% — but only while the rest of the config still decodes. When nothing
  // recognizable is left the schema has drifted: report failure so the panel
  // keeps the last good numbers instead of showing a fabricated healthy 0%.
  const usedRaw = first(config, F_USAGE_PERCENT);
  if (!Number.isFinite(usedRaw) && resetAt === null && !hasProductField) {
    return null;
  }
  const used = Number.isFinite(usedRaw) ? Math.max(0, Math.min(100, usedRaw)) : 0;

  return { used, resetAt, products };
}

async function checkPaidUsage() {
  let paid;
  try {
    paid = readPaidUsage(await fetchCreditsConfig());
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') {
      updateDisplay({ buckets: [], unauthorized: true, paid: null });
      return;
    }
    if (!lastData.paid) {
      updateDisplay({ buckets: [], unauthorized: false, paid: null });
    }
    return;
  }

  if (!paid && lastData.paid) {
    return;
  }

  updateDisplay({ buckets: [], unauthorized: false, paid });
}

// Resolves to: an entry (paid), false (signed in, free), 'unauthorized'
// (signed out), or null (the lookup itself failed — tier unknown).
async function fetchActiveSubscription() {
  try {
    const response = await fetch("https://grok.com/rest/subscriptions", {
      credentials: "include"
    });
    if (response.status === 401) {
      return 'unauthorized';
    }
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const list = data && Array.isArray(data.subscriptions) ? data.subscriptions : [];
    return list.find(entry => entry && entry.status === 'SUBSCRIPTION_STATUS_ACTIVE') || false;
  } catch (e) {
    return null;
  }
}

async function refresh() {
  const active = await fetchActiveSubscription();

  if (active === 'unauthorized') {
    updateDisplay({ buckets: [], unauthorized: true, paid: null });
    return;
  }

  // Tier unknown (network, 5xx). A paid panel must not be repainted with the
  // frozen free-tier floor numbers, so keep it. Anything else falls back to
  // the free path exactly as 1.5.0 did — it shows live free data when only
  // the subscriptions endpoint is down, turns a 401 into the sign-in prompt,
  // and keeps or shows Loading via its own guards when nothing is reachable.
  if (active === null) {
    if (lastData.paid) {
      return;
    }
    await checkRateLimits();
    return;
  }

  if (active) {
    await checkPaidUsage();
  } else {
    await checkRateLimits();
  }
}

loadSettings();
refresh();

setInterval(() => {
  if (!document.hidden) refresh();
}, 60000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});

document.addEventListener("submit", function () {
  setTimeout(refresh, 1000);
});

let resizeDebounce;
window.addEventListener('resize', () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(keepOnScreen, 150);
});
