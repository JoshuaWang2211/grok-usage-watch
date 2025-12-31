function toggleCollapse() {
  isCollapsed = !isCollapsed;
  settings.isCollapsed = isCollapsed;
  saveSettings();
  updateDisplay(lastData);
}

function createCollapseButton() {
  const button = document.createElement('div');
  const colors = getTextColors();

  button.className = 'no-drag';
  button.style.cssText = `
    position: absolute;
    top: 6px;
    left: 6px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
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
  hideGrok4Heavy: false,
  colorMode: 'light',
  isCollapsed: false,
  uiScale: 1.0,
  miniMode: false,
  showProgressBars: true
};

let lastData = {
  DEFAULT: { remaining: null, total: null, remainingTokens: null, totalTokens: null },
  GROK4HEAVY: { remaining: null, total: null }
};

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

function loadSettings() {
  try {
    const saved = localStorage.getItem('grokUsageWatchSettings');
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
      isCollapsed = settings.isCollapsed;
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
      lowEffort: "#3498db",
      highEffort: "#f39c12",
      grok4Heavy: "#ecf0f1",
      refill: "#bdc3c7",
      loading: "#95a5a6"
    };
  } else {
    return {
      title: "#2c3e50",
      section: "#34495e",
      label: "#5f6a6a",
      value: "#333",
      lowEffort: "#2980b9",
      highEffort: "#e67e22",
      grok4Heavy: "#2c3e50",
      refill: "#34495e",
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

function formatWaitTime(seconds) {
  if (!seconds || seconds <= 0) return "";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

const WARNING_THRESHOLD = 30;
const CRITICAL_THRESHOLD = 10;

function getQuotaColor(percentage) {
  if (percentage <= CRITICAL_THRESHOLD) {
    return { color: '#e74c3c' };
  } else if (percentage <= WARNING_THRESHOLD) {
    return { color: '#f39c12' };
  } else {
    return { color: '#27ae60' };
  }
}

function createProgressBar(percentage, colorInfo, width = '100%') {
  const bgColor = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return `
    <div style="width: ${width}; height: 6px; background: ${bgColor}; border-radius: 3px; overflow: hidden; margin-top: 4px;">
      <div style="width: ${Math.max(0, Math.min(100, percentage))}%; height: 100%; background: ${colorInfo.color}; border-radius: 3px; transition: width 0.3s ease;"></div>
    </div>
  `;
}



function getWaitTimeDisplay(data) {
  const lowEffortWaitTime = data.DEFAULT?.lowEffortRateLimits?.waitTimeSeconds;
  const highEffortWaitTime = data.DEFAULT?.highEffortRateLimits?.waitTimeSeconds;
  const colors = getTextColors();

  const hasLowEffortWait = lowEffortWaitTime && lowEffortWaitTime > 0;
  const hasHighEffortWait = highEffortWaitTime && highEffortWaitTime > 0;

  if (!hasLowEffortWait && !hasHighEffortWait) {
    return "";
  }

  let waitTimeHtml = `
    <div style="font-size: 14px; color: ${colors.refill}; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">Refill in</div>
    <div style="display: table; font-size: 16px; width: 100%;">
  `;

  if (hasLowEffortWait) {
    waitTimeHtml += `
      <div style="display: table-row;">
        <span style="display: table-cell; padding-right: 12px; color: ${colors.label};">Low Effort:</span>
        <span style="display: table-cell; text-align: right; color: ${colors.lowEffort};">${formatWaitTime(lowEffortWaitTime)}</span>
      </div>
    `;
  }

  if (hasHighEffortWait) {
    waitTimeHtml += `
      <div style="display: table-row;">
        <span style="display: table-cell; padding-right: 12px; color: ${colors.label};">High Effort:</span>
        <span style="display: table-cell; text-align: right; color: ${colors.highEffort};">${formatWaitTime(highEffortWaitTime)}</span>
      </div>
    `;
  }

  waitTimeHtml += `</div>`;
  return waitTimeHtml;
}

function createSettingsButton() {
  const button = document.createElement('div');
  const colors = getTextColors();

  button.className = 'no-drag';
  button.style.cssText = `
    position: absolute;
    top: 6px;
    right: 6px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: ${colors.label};
    opacity: 0.7;
    transition: all 0.2s ease;
    background: rgba(255,255,255,0.1);
  `;

  button.innerHTML = '⚙';
  button.title = 'Settings';

  button.onmouseenter = () => {
    button.style.opacity = '1';
    button.style.transform = 'rotate(45deg)';
  };
  button.onmouseleave = () => {
    button.style.opacity = '0.7';
    button.style.transform = 'rotate(0deg)';
  };

  button.onclick = (e) => {
    e.stopPropagation();
    showSettings();
  };

  return button;
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

function createUIScaleSlider() {
  const container = document.createElement('div');
  const colors = getTextColors();

  container.className = 'no-drag';
  container.style.cssText = `
    width: 150px;
    height: 32px;
    position: relative;
    border-radius: 6px;
    padding: 4px 12px;
  `;

  const track = document.createElement('div');
  track.style.cssText = `
    position: absolute;
    top: 40%;
    left: 12px;
    right: 12px;
    height: 2px;
    background: ${settings.colorMode === 'dark' ? '#555' : '#ccc'};
    border-radius: 1px;
    z-index: 1;
  `;

  const scaleValues = [0.8, 0.9, 1.0, 1.1, 1.2];

  scaleValues.forEach((scale, index) => {
    const trackStart = 12;
    const trackEnd = 150 - 12;
    const trackLength = trackEnd - trackStart;
    const tickPosition = trackStart + (index * trackLength) / (scaleValues.length - 1);

    const tickContainer = document.createElement('div');
    tickContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: ${tickPosition}px;
      width: 40px;
      height: 32px;
      transform: translateX(-50%);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 2;
    `;

    const isActive = Math.abs(settings.uiScale - scale) < 0.01;

    const tick = document.createElement('div');
    tick.style.cssText = `
      width: 4px;
      height: ${isActive ? '14px' : '10px'};
      background: ${isActive ? '#27ae60' : (settings.colorMode === 'dark' ? '#777' : '#999')};
      transition: all 0.2s ease;
      pointer-events: none;
      border-radius: 2px;
      margin-bottom: 2px;
    `;

    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 7px;
      color: ${isActive ? '#27ae60' : colors.label};
      white-space: nowrap;
      pointer-events: none;
      font-weight: ${isActive ? 'bold' : 'normal'};
      text-shadow: ${settings.colorMode === 'dark' ? '0 1px 1px rgba(0,0,0,0.5)' : 'none'};
    `;
    label.textContent = `${Math.round(scale * 100)}%`;

    tickContainer.appendChild(tick);
    tickContainer.appendChild(label);

    tickContainer.onclick = (e) => {
      e.stopPropagation();
      applyUIScale(scale);
    };

    tickContainer.onmouseenter = () => {
      if (!isActive) {
        tick.style.background = settings.colorMode === 'dark' ? '#bdc3c7' : '#5d6d7e';
        tick.style.height = '12px';
        tick.style.width = '5px';
        label.style.color = settings.colorMode === 'dark' ? '#bdc3c7' : '#5d6d7e';
        label.style.fontWeight = 'bold';
      }
    };

    tickContainer.onmouseleave = () => {
      if (!isActive) {
        tick.style.background = settings.colorMode === 'dark' ? '#777' : '#999';
        tick.style.height = '10px';
        tick.style.width = '4px';
        label.style.color = colors.label;
        label.style.fontWeight = 'normal';
      }
    };

    container.appendChild(tickContainer);
  });

  container.appendChild(track);
  return container;
}

function applyUIScale(scale) {
  settings.uiScale = scale;
  saveSettings();
  applyCurrentUIScale();
  setTimeout(() => {
    updateDisplay(lastData);
  }, 100);
}

function applyCurrentUIScale() {
  if (displayDiv) {
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

function createDisplay() {
  if (!displayDiv) {
    displayDiv = document.createElement("div");
    displayDiv.id = "grok-rate-checker";

    const styles = getOriginalStyles();
    displayDiv.style.position = "fixed";
    displayDiv.style.background = styles.background;
    displayDiv.style.padding = "12px";
    displayDiv.style.border = styles.border;
    displayDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    displayDiv.style.color = styles.color;
    displayDiv.style.zIndex = "10000";
    displayDiv.style.borderRadius = "8px";
    displayDiv.style.fontFamily = "Arial, sans-serif";
    displayDiv.style.cursor = "move";
    displayDiv.style.transition = "transform 0.2s ease, opacity 0.3s ease";
    displayDiv.style.minWidth = settings.miniMode ? "80px" : "200px";

    const savedPosition = loadPosition();
    if (savedPosition) {
      displayDiv.style.top = savedPosition.top + "px";
      displayDiv.style.left = savedPosition.left + "px";
      displayDiv.style.right = "auto";
    } else {
      const elementWidth = settings.miniMode ? 80 : 200;
      const defaultTop = 150;
      const defaultRight = 35;
      const defaultLeft = Math.max(0, window.innerWidth - elementWidth - defaultRight);

      displayDiv.style.top = defaultTop + "px";
      displayDiv.style.left = defaultLeft + "px";
      displayDiv.style.right = "auto";
    }

    displayDiv.onmouseover = () => {
      const currentScale = settings.uiScale || 1.0;
      const hoverScale = currentScale * 1.05;
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

function updateDisplay(data) {
  createDisplay();

  const styles = getOriginalStyles();
  displayDiv.style.background = styles.background;
  displayDiv.style.border = styles.border;
  displayDiv.style.color = styles.color;
  displayDiv.style.minWidth = settings.miniMode ? "80px" : "200px";

  if (currentView === 'settings') {
    showSettingsView();
  } else if (currentView === 'about') {
    showAboutView();
  } else {
    if (settings.miniMode) {
      showMiniView(data);
    } else {
      showMainView(data);
    }
  }

  applyCurrentUIScale();
  lastData = { ...data };
  addAnimationStyles();
}

function showMiniView(data) {
  const colors = getTextColors();
  const lowRemaining = data.DEFAULT?.lowEffortRateLimits?.remainingQueries || 0;
  const highRemaining = data.DEFAULT?.highEffortRateLimits?.remainingQueries || 0;
  const totalTokens = data.DEFAULT?.totalTokens || 140;
  const highEffortCost = data.DEFAULT?.highEffortRateLimits?.cost || 4;
  const highTotal = Math.floor(totalTokens / highEffortCost);

  const lowPercent = Math.round((lowRemaining / totalTokens) * 100);
  const highPercent = Math.round((highRemaining / highTotal) * 100);

  const lowColor = getQuotaColor(lowPercent);
  const highColor = getQuotaColor(highPercent);

  const lowEffortWaitTime = data.DEFAULT?.lowEffortRateLimits?.waitTimeSeconds;
  const highEffortWaitTime = data.DEFAULT?.highEffortRateLimits?.waitTimeSeconds;
  const hasLowWait = lowEffortWaitTime && lowEffortWaitTime > 0;
  const hasHighWait = highEffortWaitTime && highEffortWaitTime > 0;

  let statusIndicator = '';
  if (hasLowWait || hasHighWait) {
    let timerLines = '';
    if (hasLowWait) {
      timerLines += `<div>⏳ Lo: ${formatWaitTime(lowEffortWaitTime)}</div>`;
    }
    if (hasHighWait) {
      timerLines += `<div>⏳ Hi: ${formatWaitTime(highEffortWaitTime)}</div>`;
    }
    statusIndicator = `<div style="font-size: 9px; color: #e74c3c; margin-top: 4px;">${timerLines}</div>`;
  }

  let contentHtml;
  if (settings.showProgressBars) {
    contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; color: ${colors.label};">Lo</span>
            <span style="font-size: 11px; font-weight: bold; color: ${lowColor.color};">${lowPercent}%</span>
          </div>
          ${createProgressBar(lowPercent, lowColor)}
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; color: ${colors.label};">Hi</span>
            <span style="font-size: 11px; font-weight: bold; color: ${highColor.color};">${highPercent}%</span>
          </div>
          ${createProgressBar(highPercent, highColor)}
        </div>
      </div>
    `;
  } else {
    contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9px; color: ${colors.label};">Lo:</span>
          <span style="font-size: 12px; font-weight: bold; color: ${colors.lowEffort};">${lowRemaining}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9px; color: ${colors.label};">Hi:</span>
          <span style="font-size: 12px; font-weight: bold; color: ${colors.highEffort};">${highRemaining}</span>
        </div>
      </div>
    `;
  }

  displayDiv.innerHTML = `
    <div style="padding: 4px 6px; text-align: center; position: relative;">
      <div style="font-size: 10px; color: ${colors.label}; margin-bottom: 6px;">Usage</div>
      ${contentHtml}
      ${statusIndicator}
    </div>
  `;

  displayDiv.appendChild(createMiniSettingsButton());
}

function createMiniSettingsButton() {
  const button = document.createElement('div');
  const colors = getTextColors();

  button.className = 'no-drag';
  button.style.cssText = `
    position: absolute;
    top: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: ${colors.label};
    opacity: 0.5;
    transition: all 0.2s ease;
    background: rgba(255,255,255,0.1);
  `;

  button.innerHTML = '⚙';
  button.title = 'Settings';

  button.onmouseenter = () => {
    button.style.opacity = '1';
  };
  button.onmouseleave = () => {
    button.style.opacity = '0.5';
  };

  button.onclick = (e) => {
    e.stopPropagation();
    showSettings();
  };

  return button;
}

function showMainView(data) {
  const shouldFade = (kind, type) => lastData[kind][type] !== null && lastData[kind][type] !== data[kind][type];
  const waitTimeDisplay = getWaitTimeDisplay(data);
  const colors = getTextColors();

  const lowRemaining = data.DEFAULT?.lowEffortRateLimits?.remainingQueries || 0;
  const highRemaining = data.DEFAULT?.highEffortRateLimits?.remainingQueries || 0;
  const totalTokens = data.DEFAULT?.totalTokens || 140;
  const highEffortCost = data.DEFAULT?.highEffortRateLimits?.cost || 4;
  const highTotal = Math.floor(totalTokens / highEffortCost);

  const lowPercent = Math.round((lowRemaining / totalTokens) * 100);
  const highPercent = Math.round((highRemaining / highTotal) * 100);

  const lowColor = getQuotaColor(lowPercent);
  const highColor = getQuotaColor(highPercent);

  if (isCollapsed) {
    displayDiv.innerHTML = `
      <div style="padding: 2px 0;">
        <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center; margin: 0;">Grok Usage Watch</strong>
      </div>
    `;
    displayDiv.appendChild(createCollapseButton());
    displayDiv.appendChild(createSettingsButton());
    return;
  }

  let grok4HeavySection = '';
  if (!settings.hideGrok4Heavy) {
    const heavyRemaining = data.GROK4HEAVY?.remaining || 0;
    const heavyTotal = data.GROK4HEAVY?.total || 3;
    const heavyPercent = Math.round((heavyRemaining / heavyTotal) * 100);
    const heavyColor = getQuotaColor(heavyPercent);

    if (settings.showProgressBars) {
      grok4HeavySection = `
        <div style="font-size: 14px; color: ${colors.section}; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">Special Feature</div>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: ${colors.label};">Heavy</span>
            <span style="font-size: 13px; font-weight: bold; color: ${heavyColor.color};">${heavyRemaining}/${heavyTotal} (${heavyPercent}%)</span>
          </div>
          ${createProgressBar(heavyPercent, heavyColor)}
        </div>
      `;
    } else {
      grok4HeavySection = `
        <div style="font-size: 14px; color: ${colors.section}; font-weight: bold; margin-top: 12px; margin-bottom: 4px;">Special Feature</div>
        <div style="display: table; font-size: 16px; width: 100%;">
          <div style="display: table-row;">
            <span style="display: table-cell; padding-right: 12px; color: ${colors.label};">Heavy:</span>
            <span style="display: table-cell; text-align: right; color: ${colors.grok4Heavy};">${heavyRemaining} / ${heavyTotal}</span>
          </div>
        </div>
      `;
    }
  }

  let tokensSection;
  if (settings.showProgressBars) {
    tokensSection = `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: ${colors.label};">Low Effort</span>
          <span style="font-size: 13px; font-weight: bold; color: ${lowColor.color};">${lowRemaining}/${totalTokens} (${lowPercent}%)</span>
        </div>
        ${createProgressBar(lowPercent, lowColor)}
      </div>
      
      <div style="margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: ${colors.label};">High Effort</span>
          <span style="font-size: 13px; font-weight: bold; color: ${highColor.color};">${highRemaining}/${highTotal} (${highPercent}%)</span>
        </div>
        ${createProgressBar(highPercent, highColor)}
      </div>
    `;
  } else {
    tokensSection = `
      <div style="display: table; font-size: 16px; width: 100%;">
        <div style="display: table-row;">
          <span style="display: table-cell; padding-right: 12px; color: ${colors.label};">Low Effort:</span>
          <span style="display: table-cell; text-align: right; color: ${colors.lowEffort};">${lowRemaining} / ${totalTokens}</span>
        </div>
        <div style="display: table-row;">
          <span style="display: table-cell; padding-right: 12px; color: ${colors.label};">High Effort:</span>
          <span style="display: table-cell; text-align: right; color: ${colors.highEffort};">${highRemaining} / ${highTotal}</span>
        </div>
      </div>
    `;
  }

  displayDiv.innerHTML = `
    <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center;">Grok Usage Watch</strong>
    <div style="margin-top: 8px;">
      <div style="font-size: 14px; color: ${colors.section}; font-weight: bold; margin-bottom: 8px;">Tokens</div>
      ${tokensSection}
      ${grok4HeavySection}
    </div>
    ${waitTimeDisplay}
  `;

  displayDiv.appendChild(createCollapseButton());
  displayDiv.appendChild(createSettingsButton());
}

function showSettingsView() {
  const colors = getTextColors();

  displayDiv.innerHTML = `
    <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center;">Settings</strong>
    <div style="margin-top: 8px;">
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Mini Mode</div>
          </div>
          <div id="mini-mode-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>
      
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Progress Bars</div>
          </div>
          <div id="progress-bars-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>
      
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Hide Heavy</div>
          </div>
          <div id="hide-toggle" style="margin-left: 8px;"></div>
        </div>
      </div>
      
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
            <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">Reset Position</div>
          </div>
          <button id="reset-position-btn" class="no-drag" style="background: ${settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border: 1px solid ${colors.label}; color: ${colors.title}; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s ease; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;" title="Restore to default position">↺</button>
        </div>
      </div>
      
      <div style="padding: 6px; margin-bottom: 6px;">
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: bold; color: ${colors.title};">UI Scale</div>
            </div>
          </div>
          <div id="ui-scale-slider" style="display: flex; justify-content: center; height: 38px; align-items: center;"></div>
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
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    closeBtn.style.borderColor = settings.colorMode === 'dark' ? '#888' : '#888';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
    closeBtn.style.borderColor = getTextColors().label;
  };

  const aboutBtn = displayDiv.querySelector('#show-about');
  aboutBtn.onclick = showAbout;
  aboutBtn.onmouseenter = () => {
    aboutBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    aboutBtn.style.borderColor = settings.colorMode === 'dark' ? '#888' : '#888';
  };
  aboutBtn.onmouseleave = () => {
    aboutBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
    aboutBtn.style.borderColor = getTextColors().label;
  };

  const miniModeContainer = displayDiv.querySelector('#mini-mode-toggle');
  const miniModeToggle = createToggle(settings.miniMode, (checked) => {
    settings.miniMode = checked;
    saveSettings();
  });
  miniModeContainer.appendChild(miniModeToggle);

  const progressBarsContainer = displayDiv.querySelector('#progress-bars-toggle');
  const progressBarsToggle = createToggle(settings.showProgressBars, (checked) => {
    settings.showProgressBars = checked;
    saveSettings();
  });
  progressBarsContainer.appendChild(progressBarsToggle);

  const hideToggleContainer = displayDiv.querySelector('#hide-toggle');
  const hideToggle = createToggle(settings.hideGrok4Heavy, (checked) => {
    settings.hideGrok4Heavy = checked;
    saveSettings();
  });
  hideToggleContainer.appendChild(hideToggle);

  const colorToggleContainer = displayDiv.querySelector('#color-toggle');
  const colorToggle = createColorModeToggle();
  colorToggleContainer.appendChild(colorToggle);

  const uiScaleContainer = displayDiv.querySelector('#ui-scale-slider');
  const uiScaleSlider = createUIScaleSlider();
  uiScaleContainer.appendChild(uiScaleSlider);


  const resetPositionBtn = displayDiv.querySelector('#reset-position-btn');
  resetPositionBtn.onclick = () => {

    const elementWidth = settings.miniMode ? 80 : 200;
    const defaultTop = 130;
    const defaultRight = 70;
    const defaultLeft = Math.max(0, window.innerWidth - elementWidth - defaultRight);

    displayDiv.style.top = defaultTop + 'px';
    displayDiv.style.left = defaultLeft + 'px';
    displayDiv.style.right = 'auto';


    savePosition(defaultTop, defaultLeft);


    showMain();
  };

  resetPositionBtn.onmouseenter = () => {
    resetPositionBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    resetPositionBtn.style.borderColor = settings.colorMode === 'dark' ? '#888' : '#888';
  };

  resetPositionBtn.onmouseleave = () => {
    resetPositionBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
    resetPositionBtn.style.borderColor = getTextColors().label;
  };
}

function showAboutView() {
  const colors = getTextColors();

  displayDiv.innerHTML = `
    <div style="position: relative; height: 280px;">
      <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center; margin-bottom: 16px;">About</strong>
      
      <div style="height: 235px; overflow-y: auto; padding-right: 8px; margin-bottom: 8px; scrollbar-width: thin;">
        <div style="color: ${colors.title}; font-size: 14px; font-weight: bold; margin-bottom: 8px;">Grok Usage Watch</div>
        <div style="color: ${colors.label}; font-size: 12px; margin-bottom: 4px;"><strong>Version:</strong> 1.4.0</div>
        <div style="color: ${colors.label}; font-size: 12px; margin-bottom: 12px;"><strong>Author:</strong> Joshua Wang</div>
        
        <div style="color: ${colors.value}; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
          Made with love for the Grok community.<br>
          Free, simple, and shared with joy.
        </div>
        

        
        <div style="color: ${colors.value}; font-size: 12px; line-height: 1.5;">
          If you enjoy it,<br>
          please <a href="https://chrome.google.com/webstore/detail/bmpboaihdkpkjehbceegdmndkonlpdge" target="_blank" class="no-drag" style="color: ${colors.lowEffort}; text-decoration: underline;">leave a review</a><br>
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
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)';
    closeBtn.style.borderColor = settings.colorMode === 'dark' ? '#888' : '#888';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = settings.colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)';
    closeBtn.style.borderColor = getTextColors().label;
  };
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
      if (response.status === 401 || response.status === 403) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Request failed for ${kind} (${model}) with status: ${response.status}`);
      }
    });
}

function checkRateLimits() {
  const results = {};
  let isUnauthorized = false;

  fetchRateLimits("DEFAULT", "grok-3")
    .then(data => {
      results.DEFAULT = {
        remaining: data.remainingQueries,
        total: data.totalQueries,
        remainingTokens: data.remainingTokens,
        totalTokens: data.totalTokens,
        lowEffortRateLimits: data.lowEffortRateLimits,
        highEffortRateLimits: data.highEffortRateLimits,
        windowSizeSeconds: data.windowSizeSeconds
      };

      return fetchRateLimits("DEFAULT", "grok-4-heavy");
    })
    .then(data => {
      results.GROK4HEAVY = {
        remaining: data.remainingQueries,
        total: data.totalQueries
      };
      updateDisplay(results);
    })
    .catch(err => {
      if (err.message === 'UNAUTHORIZED') {
        isUnauthorized = true;
        createDisplay();
        if (displayDiv) {
          const colors = getTextColors();
          displayDiv.innerHTML = `
            <strong style="color: ${colors.title}; font-size: 16px; display: block; text-align: center;">Grok Usage Watch</strong>
            <div style="margin-top: 8px;">
              <div style="color: ${colors.loading}; text-align: center;">Loading...</div>
            </div>
          `;
        }
        return;
      }

      results.DEFAULT = results.DEFAULT || {
        remaining: "Error",
        total: "Error",
        remainingTokens: null,
        totalTokens: null
      };
      results.GROK4HEAVY = {
        remaining: "Error",
        total: "Error"
      };
      updateDisplay(results);
    });
}

loadSettings();
checkRateLimits();
setInterval(checkRateLimits, 5000);

document.addEventListener("submit", function () {
  setTimeout(checkRateLimits, 1000);
});
