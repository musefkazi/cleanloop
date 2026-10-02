(function () {
  const app = window.CLEANLOOP || (window.CLEANLOOP = {});
  const { loadState, saveState, getDefaultState } = window.CLEANLOOP.data;

  function getState() {
    return loadState();
  }

  function formatWeight(value) {
    return `${Number(value).toFixed(1)} kg`;
  }

  function getStatusFromFill(fill) {
    if (fill >= 80) return "FULL";
    if (fill >= 60) return "WARNING";
    return "NORMAL";
  }

  function updateBinStatusDisplay() {
    const state = getState();
    const wet = state.bins.wet;
    const dry = state.bins.dry;

    const wetStatus = getStatusFromFill(wet.fill);
    const dryStatus = getStatusFromFill(dry.fill);

    const idMap = {
      "wet-fill-level": `${wet.fill}%`,
      "dry-fill-level": `${dry.fill}%`,
      "wet-weight": formatWeight(wet.weight),
      "dry-weight": formatWeight(dry.weight),
      "wet-status": wetStatus,
      "dry-status": dryStatus,
      "status-wet-fill": `${wet.fill}%`,
      "status-dry-fill": `${dry.fill}%`,
      "status-wet-weight": formatWeight(wet.weight),
      "status-dry-weight": formatWeight(dry.weight),
      "status-wet-state": wetStatus,
      "status-dry-state": dryStatus,
      "wet-progress": wet.fill,
      "dry-progress": dry.fill,
      "wetBinVisual": wet.fill,
      "dryBinVisual": dry.fill
    };

    Object.keys(idMap).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "wet-progress" || id === "dry-progress") {
        el.style.width = `${idMap[id]}%`;
      } else if (id === "wetBinVisual" || id === "dryBinVisual") {
        el.style.height = `${idMap[id]}%`;
      } else {
        el.textContent = idMap[id];
      }
    });

    const wetPanel = document.querySelector(".wet-panel .status-badge");
    const dryPanel = document.querySelector(".dry-panel .status-badge");

    [wetPanel, dryPanel].forEach((badge, index) => {
      if (!badge) return;
      const value = index === 0 ? wetStatus : dryStatus;
      badge.textContent = value;
      badge.className = `status-badge ${value === "NORMAL" ? "success" : value === "WARNING" ? "warning" : "danger"}`;
    });
  }

  function updateSensorDisplay() {
    const state = getState();
    const sensor = state.sensor;

    const mapping = {
      "sensor-moisture": `${sensor.moisture}%`,
      "sensor-distance": `${sensor.distance} cm`,
      "sensor-weight": formatWeight(sensor.weight),
      "servo-position": sensor.servoPosition,
      "lcd-message": sensor.lcdMessage,
      "buzzer-state": sensor.buzzerState,
      "waste-type": sensor.type,
      "detection-moisture": `${sensor.moisture}%`,
      "decision-text": sensor.decision,
      "servo-status": sensor.servoState,
      "kpi-total-weight": `${(state.history || []).reduce((sum, item) => sum + Number(String(item.weight).replace(/[a-zA-Z\s]/g, "") || 0), 0).toFixed(1)}`,
      "kpi-wet-weight": `${(state.history || []).filter((item) => item.type && item.type.toLowerCase().includes("wet")).reduce((sum, item) => sum + Number(String(item.weight).replace(/[a-zA-Z\s]/g, "") || 0), 0).toFixed(1)}`,
      "kpi-dry-weight": `${(state.history || []).filter((item) => item.type && item.type.toLowerCase().includes("dry")).reduce((sum, item) => sum + Number(String(item.weight).replace(/[a-zA-Z\s]/g, "") || 0), 0).toFixed(1)}`,
      "kpi-wrong-count": `${Math.max(0, (state.history || []).filter((item) => item.status && item.status.toLowerCase().includes("failed")).length)}`,
      "kpi-fill-level": `${Math.round((state.bins.wet.fill + state.bins.dry.fill) / 2)}%`,
      "kpi-trips": `${Math.max(2, Math.round((state.history || []).length / 2))}`
    };

    Object.entries(mapping).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  function renderHistoryTable() {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    const state = getState();
    const history = Array.isArray(state.history) ? state.history : [];
    tbody.innerHTML = history.map((row) => `
      <tr>
        <td>${row.time}</td>
        <td>${row.type}</td>
        <td>${row.moisture}</td>
        <td>${row.decision}</td>
        <td>${row.bin}</td>
        <td>${row.weight}</td>
        <td><span class="status-badge ${row.status === "Success" ? "success" : row.status === "Warning" ? "warning" : "danger"}">${row.status}</span></td>
      </tr>
    `).join("");
  }

  function getWasteTypePreset(type) {
    if (type === "wet") {
      return {
        moisture: 74,
        decision: "REDIRECT TO WET BIN",
        servoPosition: "WET BIN",
        servoState: "ACTIVATED",
        lcdMessage: "Waste redirected",
        buzzerState: "ALERT",
        weight: 1.2,
        bin: "Wet Bin",
        label: "Wet Waste"
      };
    }

    return {
      moisture: 31,
      decision: "REDIRECT TO DRY BIN",
      servoPosition: "DRY BIN",
      servoState: "ACTIVATED",
      lcdMessage: "Correct Bin",
      buzzerState: "READY",
      weight: 0.6,
      bin: "Dry Bin",
      label: "Dry Waste"
    };
  }

  function renderAlerts() {
    const list = document.getElementById("alertsList");
    if (!list) return;

    const state = getState();
    const alerts = Array.isArray(state.alerts) ? state.alerts : [];

    list.innerHTML = alerts.length ? alerts.map((alert) => `
      <div class="alert-item ${alert.status === "Unread" ? "unread" : ""}">
        <div class="alert-meta">
          <span class="alert-badge ${alert.type.toLowerCase() === "warning" ? "warning" : alert.type.toLowerCase() === "critical" ? "critical" : "info"}">${alert.type}</span>
          <h3>${alert.message}</h3>
          <p>${alert.time} • ${alert.status}</p>
        </div>
        <div class="alert-actions">
          <button data-alert-id="${alert.id}" class="mark-read-btn">${alert.status === "Read" ? "Read" : "Mark as read"}</button>
        </div>
      </div>
    `).join("") : '<div class="alert-item"><div class="alert-meta"><h3>No active alerts</h3><p>System healthy.</p></div></div>';

    list.querySelectorAll(".mark-read-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.dataset.alertId;
        app.utils.markAlertRead(id);
        renderAlerts();
      });
    });
  }

  function applyHistoryFilters() {
    const searchEl = document.getElementById("historySearch");
    const typeEl = document.getElementById("historyFilterType");
    const sortEl = document.getElementById("historySort");

    if (!(searchEl && typeEl && sortEl)) return;

    const state = getState();
    let rows = [...(state.history || [])];

    const query = searchEl.value.toLowerCase();
    const selectedType = typeEl.value;

    rows = rows.filter((row) => {
      const measure = [row.type, row.decision, row.bin, row.status].join(" ").toLowerCase();
      const matchesSearch = !query || measure.includes(query);
      const matchesType = selectedType === "all" || row.type === selectedType;
      return matchesSearch && matchesType;
    });

    const sortBy = sortEl.value;
    if (sortBy === "time-desc") {
      rows.sort((a, b) => (b.time > a.time ? 1 : -1));
    } else if (sortBy === "time-asc") {
      rows.sort((a, b) => (a.time > b.time ? 1 : -1));
    } else if (sortBy === "weight-desc") {
      rows.sort((a, b) => Number(String(b.weight).replace(/[a-zA-Z\s]/g, "")) - Number(String(a.weight).replace(/[a-zA-Z\s]/g, "")));
    }

    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.time}</td>
        <td>${row.type}</td>
        <td>${row.moisture}</td>
        <td>${row.decision}</td>
        <td>${row.bin}</td>
        <td>${row.weight}</td>
        <td><span class="status-badge ${row.status === "Success" ? "success" : row.status === "Warning" ? "warning" : "danger"}">${row.status}</span></td>
      </tr>
    `).join("");
  }

  function simulateWaste(type) {
    const state = getState();
    const preset = getWasteTypePreset(type);

    state.sensor = {
      ...state.sensor,
      moisture: preset.moisture,
      distance: 18,
      weight: Number((state.sensor.weight + preset.weight).toFixed(1)),
      type: type === "wet" ? "WET WASTE" : "DRY WASTE",
      decision: preset.decision,
      servoPosition: preset.servoPosition,
      servoState: preset.servoState,
      lcdMessage: preset.lcdMessage,
      buzzerState: preset.buzzerState
    };

    state.bins.wet.fill = Math.min(100, Math.max(0, state.bins.wet.fill + (type === "wet" ? 10 : 2)));
    state.bins.dry.fill = Math.min(100, Math.max(0, state.bins.dry.fill + (type === "wet" ? 2 : 8)));
    state.bins.wet.weight = Number((state.bins.wet.weight + (type === "wet" ? 1.2 : 0.2)).toFixed(1));
    state.bins.dry.weight = Number((state.bins.dry.weight + (type === "wet" ? 0.2 : 0.8)).toFixed(1));

    state.bins.wet.status = getStatusFromFill(state.bins.wet.fill);
    state.bins.dry.status = getStatusFromFill(state.bins.dry.fill);

    state.history.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: preset.label,
      moisture: `${preset.moisture}%`,
      decision: type === "wet" ? "Redirected" : "Correct Bin",
      bin: preset.bin,
      weight: `${preset.weight.toFixed(1)} kg`,
      status: "Success"
    });

    state.alerts.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "INFO",
      message: type === "wet" ? "Waste successfully redirected to wet bin." : "Dry waste correctly sorted to dry bin.",
      status: "Unread"
    });

    saveState(state);
    updateDashboard();
  }
function checkBinAlerts() {
    const state = getState();

    // Wet Bin Alert
    if (state.bins.wet.fill >= 80) {
        const alreadyAlerted = state.alerts.some(
            alert => alert.message === "Wet bin is above 80% capacity."
        );

        if (!alreadyAlerted) {
            state.alerts.unshift({
                id: Date.now(),
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                type: "WARNING",
                message: "Wet bin is above 80% capacity.",
                status: "Unread"
            });
        }
    }

    // Dry Bin Alert
    if (state.bins.dry.fill >= 80) {
        const alreadyAlerted = state.alerts.some(
            alert => alert.message === "Dry bin is above 80% capacity."
        );

        if (!alreadyAlerted) {
            state.alerts.unshift({
                id: Date.now() + 1,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                type: "WARNING",
                message: "Dry bin is above 80% capacity.",
                status: "Unread"
            });
        }
    }

    saveState(state);
}
  function updateDashboard() {
    checkBinAlerts();
    updateBinStatusDisplay();
    updateSensorDisplay();
    renderHistoryTable();
    renderAlerts();
    if (document.getElementById("historySearch")) applyHistoryFilters();
  }

  function initDashboardPage() {
    if (document.getElementById("historyTableBody")) {
      const searchEl = document.getElementById("historySearch");
      const typeEl = document.getElementById("historyFilterType");
      const sortEl = document.getElementById("historySort");

      [searchEl, typeEl, sortEl].forEach((el) => {
        if (el) el.addEventListener("input", applyHistoryFilters);
        if (el) el.addEventListener("change", applyHistoryFilters);
      });
    }

    const simulateWetBtn = document.getElementById("simulateWetBtn");
    const simulateDryBtn = document.getElementById("simulateDryBtn");
    const simulateDetectionBtn = document.getElementById("simulateDetectionBtn");
    if (simulateWetBtn) simulateWetBtn.addEventListener("click", () => simulateWaste("wet"));
    if (simulateDryBtn) simulateDryBtn.addEventListener("click", () => simulateWaste("dry"));
  if (simulateDetectionBtn) {
  simulateDetectionBtn.addEventListener("click", () => {
    const state = getState();

    // Moisture-based wet/dry classification
    // > 55% = Wet Waste
    // <= 55% = Dry Waste
    const type = state.sensor.moisture > 55 ? "wet" : "dry";

    simulateWaste(type);
  });
}

    updateDashboard();

    if (window.CLEANLOOP && !window.CLEANLOOP.dashboard) {
      window.CLEANLOOP.dashboard = {};
    }
    window.CLEANLOOP.dashboard.refresh = updateDashboard;
    window.CLEANLOOP.dashboard.renderAlerts = renderAlerts;

    setInterval(function () {
      const state = getState();
      if (!state.demoMode) return;

      const wetFill = state.bins.wet.fill + 1;
      const dryFill = state.bins.dry.fill + 0.6;
      state.bins.wet.fill = Math.min(100, wetFill);
      state.bins.dry.fill = Math.min(100, dryFill);
      state.bins.wet.weight = Number((state.bins.wet.weight + 0.15).toFixed(1));
      state.bins.dry.weight = Number((state.bins.dry.weight + 0.1).toFixed(1));
      state.sensor.moisture = Math.max(22, Math.min(88, state.sensor.moisture + (Math.random() > 0.5 ? 2 : -2)));
      state.sensor.distance = Math.max(8, Math.min(32, state.sensor.distance + (Math.random() > 0.5 ? -1 : 1)));
      state.sensor.weight = Number((state.sensor.weight + 0.2).toFixed(1));
      const isWet = state.sensor.moisture > 55;

state.sensor.type = isWet ? "WET WASTE" : "DRY WASTE";

state.sensor.servoPosition = isWet
  ? "WET BIN"
  : "DRY BIN";

state.sensor.decision = isWet
  ? "REDIRECT TO WET BIN"
  : "REDIRECT TO DRY BIN";

state.sensor.servoState = "ACTIVATED";

state.sensor.lcdMessage = isWet
  ? "Waste redirected"
  : "Correct Bin";

state.sensor.buzzerState = isWet
  ? "ALERT"
  : "READY";
      saveState(state);
      updateDashboard();
    }, 5000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDashboardPage();
  });
})();
