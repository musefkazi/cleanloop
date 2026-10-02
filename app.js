(function () {
  const app = window.CLEANLOOP || (window.CLEANLOOP = {});
  const { loadState, saveState } = app.data || window.CLEANLOOP.data;

  function updateDateTime() {
    const el = document.getElementById("headerDateTime");
    if (!el) return;

    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(now);

    el.textContent = formatted;
  }

  function initSidebar() {
    const toggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });

    document.addEventListener("click", function (event) {
      const clickedInsideSidebar = sidebar.contains(event.target);
      const clickedToggle = toggle.contains(event.target);

      if (window.innerWidth <= 980 && !clickedInsideSidebar && !clickedToggle && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  }

  function setDemoToggleState() {
    const toggle = document.getElementById("demoModeToggle");
    const text = document.getElementById("demoModeText");
    const state = loadState();

    if (!toggle) return;

    toggle.checked = Boolean(state.demoMode);
    if (text) text.textContent = state.demoMode ? "ON" : "OFF";

    toggle.addEventListener("change", function () {
      const next = loadState();
      next.demoMode = this.checked;
      saveState(next);

      if (text) text.textContent = this.checked ? "ON" : "OFF";
      if (typeof window.CLEANLOOP?.dashboard?.refresh === "function") {
        window.CLEANLOOP.dashboard.refresh();
      }
    });
  }

  function seedStorageIfNeeded() {
    if (!localStorage.getItem(window.CLEANLOOP.data.STORAGE_KEY)) {
      localStorage.setItem(window.CLEANLOOP.data.STORAGE_KEY, JSON.stringify(window.CLEANLOOP.data.getDefaultState()));
    }
  }

  function ensureHistoryAndAlerts() {
    const state = loadState();
    if (!Array.isArray(state.history) || state.history.length === 0) {
      state.history = window.CLEANLOOP.data.getDefaultState().history;
    }
    if (!Array.isArray(state.alerts) || state.alerts.length === 0) {
      state.alerts = window.CLEANLOOP.data.getDefaultState().alerts;
    }
    saveState(state);
  }

  function addHistoryEntry(entry) {
    const state = loadState();
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.unshift(entry);
    saveState(state);
  }

  function addAlert(message, type, status = "Unread") {
    const state = loadState();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    state.alerts = Array.isArray(state.alerts) ? state.alerts : [];
    state.alerts.unshift({
      id: Date.now() + Math.random(),
      time,
      type,
      message,
      status
    });

    saveState(state);
  }

  function clearAlerts() {
    const state = loadState();
    state.alerts = [];
    saveState(state);
  }

  function markAlertRead(id) {
    const state = loadState();
    state.alerts = (state.alerts || []).map((item) => {
      if (String(item.id) === String(id)) {
        return { ...item, status: "Read" };
      }
      return item;
    });
    saveState(state);
  }

  app.utils = {
    addHistoryEntry,
    addAlert,
    clearAlerts,
    markAlertRead,
    loadState,
    saveState,
    setDemoToggleState,
    seedStorageIfNeeded,
    ensureHistoryAndAlerts
  };

  function init() {
    seedStorageIfNeeded();
    ensureHistoryAndAlerts();
    updateDateTime();
    setInterval(updateDateTime, 1000 * 30);
    initSidebar();
    setDemoToggleState();

    const clearBtn = document.getElementById("clearAlertsBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        clearAlerts();
        if (typeof window.CLEANLOOP?.dashboard?.renderAlerts === "function") {
          window.CLEANLOOP.dashboard.renderAlerts();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
// ================================
// COLLECTION TRACKING
// ================================

const wetBtn = document.getElementById("collectWetBtn");
const dryBtn = document.getElementById("collectDryBtn");


// Wet bin collection
if (wetBtn) {

    wetBtn.addEventListener("click", function () {

        document.getElementById("wetCollectionFill").textContent = "0%";
        document.getElementById("wetCollectionWeight").textContent = "0 kg";
        document.getElementById("wetCollectionStatus").textContent =
    "Collected";

const wetBadge =
    document.getElementById("wetCollectionBadge");

wetBadge.textContent = "COLLECTED";
wetBadge.className = "status-badge success";

        this.textContent = "Collected ✓";
        this.disabled = true;

        addCollectionHistory("Wet Bin", "24.6 kg");

    });

}


// Dry bin collection
if (dryBtn) {

    dryBtn.addEventListener("click", function () {

        document.getElementById("dryCollectionFill").textContent = "0%";
        document.getElementById("dryCollectionWeight").textContent = "0 kg";

        this.textContent = "Collected ✓";
        this.disabled = true;

        addCollectionHistory("Dry Bin", "8.7 kg");

    });

}


// Add record to collection history
// ================================
// COLLECTION TRACKING
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const wetBtn = document.getElementById("collectWetBtn");
    const dryBtn = document.getElementById("collectDryBtn");

    if (!wetBtn && !dryBtn) return;


    // Get CLEANLOOP data
    const loadState = window.CLEANLOOP.data.loadState;
    const saveState = window.CLEANLOOP.data.saveState;


    // Wet Bin
    if (wetBtn) {

        wetBtn.addEventListener("click", function () {

            const state = loadState();

            // Save collection record before resetting
            const collectedWeight = state.bins.wet.weight;

            state.history.unshift({
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                type: "Wet Waste Collection",
                moisture: "-",
                decision: "Collected",
                bin: "Wet Bin",
                weight: collectedWeight + " kg",
                status: "Completed"
            });

            // Reset wet bin
            state.bins.wet.fill = 0;
            state.bins.wet.weight = 0;
            state.bins.wet.status = "NORMAL";

            saveState(state);

            // Update page
            document.getElementById("wetCollectionFill").textContent = "0%";
            document.getElementById("wetCollectionWeight").textContent = "0 kg";

            const status = document.getElementById("wetCollectionStatus");
            if (status) {
                status.textContent = "Collected";
            }

            const badge = document.getElementById("wetCollectionBadge");
            if (badge) {
                badge.textContent = "COLLECTED";
                badge.className = "status-badge success";
            }

            this.textContent = "Collected ✓";
            this.disabled = true;

            renderCollectionHistory();
            // Sync collection page with central CLEANLOOP data
function syncCollectionPage() {
    const state = loadState();

    // Wet bin
    const wetFill = document.getElementById("wetCollectionFill");
    const wetWeight = document.getElementById("wetCollectionWeight");
    const wetStatus = document.getElementById("wetCollectionStatus");

    if (wetFill) wetFill.textContent = state.bins.wet.fill + "%";
    if (wetWeight) wetWeight.textContent = state.bins.wet.weight + " kg";

    if (wetStatus) {
        wetStatus.textContent =
            state.bins.wet.fill >= 80
                ? "Ready for Collection"
                : "No Collection Required";
    }

    // Dry bin
    const dryFill = document.getElementById("dryCollectionFill");
    const dryWeight = document.getElementById("dryCollectionWeight");
    const dryStatus = document.getElementById("dryCollectionStatus");

    if (dryFill) dryFill.textContent = state.bins.dry.fill + "%";
    if (dryWeight) dryWeight.textContent = state.bins.dry.weight + " kg";

    if (dryStatus) {
        dryStatus.textContent =
            state.bins.dry.fill >= 80
                ? "Ready for Collection"
                : "No Collection Required";
    }
}

syncCollectionPage();
        });
    }


    // Dry Bin
    if (dryBtn) {

        dryBtn.addEventListener("click", function () {

            const state = loadState();

            const collectedWeight = state.bins.dry.weight;

            state.history.unshift({
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                type: "Dry Waste Collection",
                moisture: "-",
                decision: "Collected",
                bin: "Dry Bin",
                weight: collectedWeight + " kg",
                status: "Completed"
            });

            // Reset dry bin
            state.bins.dry.fill = 0;
            state.bins.dry.weight = 0;
            state.bins.dry.status = "NORMAL";

            saveState(state);

            // Update page
            document.getElementById("dryCollectionFill").textContent = "0%";
            document.getElementById("dryCollectionWeight").textContent = "0 kg";

            const status = document.getElementById("dryCollectionStatus");
            if (status) {
                status.textContent = "Collected";
            }

            const badge = document.getElementById("dryCollectionBadge");
            if (badge) {
                badge.textContent = "COLLECTED";
                badge.className = "status-badge success";
            }

            this.textContent = "Collected ✓";
            this.disabled = true;

            renderCollectionHistory();
        });
    }


    // Render history
    function renderCollectionHistory() {

        const table = document.getElementById("collectionHistory");

        if (!table) return;

        const state = loadState();

        table.innerHTML = "";

        state.history.forEach(function (item) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.time || "-"}</td>
                <td>${item.bin || "-"}</td>
                <td>${item.weight || "-"}</td>
                <td>Housekeeping</td>
                <td>
                    <span class="status-badge success">
                        ${item.status || "Completed"}
                    </span>
                </td>
            `;

            table.appendChild(row);
        });
    }


    // Show existing history when page opens
    renderCollectionHistory();

});