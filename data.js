(function () {
  const STORAGE_KEY = "cleanloop-state";

  function getDefaultState() {
    return {
      demoMode: true,
      sensor: {
  moisture: 72,
  distance: 18,
  weight: 0.8,
  servoPosition: "WET BIN",
  lcdMessage: "Waste redirected",
  buzzerState: "ALERT",
  type: "WET WASTE",
  decision: "REDIRECT TO WET BIN",
  servoState: "ACTIVATED"
},
      bins: {
        wet: { fill: 68, weight: 12.4, status: "NORMAL" },
        dry: { fill: 43, weight: 8.7, status: "NORMAL" }
      },
      history: [
        { time: "10:42 PM", type: "Wet Waste", moisture: "76%", decision: "Redirected", bin: "Wet Bin", weight: "0.8 kg", status: "Success" },
        { time: "09:18 AM", type: "Dry Waste", moisture: "31%", decision: "Correct Bin", bin: "Dry Bin", weight: "0.5 kg", status: "Success" },
        { time: "08:57 AM", type: "Wet Waste", moisture: "71%", decision: "Redirected", bin: "Wet Bin", weight: "1.1 kg", status: "Success" }
      ],
      alerts: [
        { id: 1, time: "10:42 PM", type: "WARNING", message: "Wet bin reaching 80% capacity.", status: "Unread" },
        { id: 2, time: "10:34 PM", type: "INFO", message: "Waste successfully redirected.", status: "Unread" },
        { id: 3, time: "10:16 PM", type: "CRITICAL", message: "Bin capacity above 90%.", status: "Unread" }
      ]
    };
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultState()));
      return getDefaultState();
    }

    try {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed, sensor: { ...getDefaultState().sensor, ...(parsed.sensor || {}) }, bins: { wet: { ...getDefaultState().bins.wet, ...(parsed.bins && parsed.bins.wet ? parsed.bins.wet : {}) }, dry: { ...getDefaultState().bins.dry, ...(parsed.bins && parsed.bins.dry ? parsed.bins.dry : {}) } } };
    } catch (error) {
      console.warn("CLEANLOOP: invalid localStorage data, resetting state.", error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultState()));
      return getDefaultState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getSensorData() {
    const state = loadState();
    const moisture = state.sensor.moisture ?? 72;
    const distance = state.sensor.distance ?? 18;
    const weight = state.sensor.weight ?? 12.4;

    return {
      moisture,
      distance,
      weight,
      type: state.sensor.type || "WET WASTE",
      decision: state.sensor.decision || "REDIRECT TO WET BIN",
      servoPosition: state.sensor.servoPosition || "DRY BIN",
      servoState: state.sensor.servoState || "ACTIVATED",
      lcdMessage: state.sensor.lcdMessage || "Correct Bin",
      buzzerState: state.sensor.buzzerState || "READY"
    };
  }

  window.CLEANLOOP = window.CLEANLOOP || {};
  window.CLEANLOOP.data = {
    STORAGE_KEY,
    getDefaultState,
    loadState,
    saveState,
    getSensorData
  };
})();
