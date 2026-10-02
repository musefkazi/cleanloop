(function () {
  function buildChartConfig(type, labels, datasets, options = {}) {
    return {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, tooltip: { enabled: true } },
        ...options
      }
    };
  }

  function createCharts() {
    if (typeof Chart === "undefined") return;

    const demoRanges = {
      today: {
        labels: ["08:00", "10:00", "12:00", "14:00", "16:00"],
        wet: [2.5, 3.4, 4.7, 3.9, 4.1],
        dry: [2.1, 2.9, 3.8, 4.1, 3.7],
        fillWet: [45, 52, 61, 70, 74],
        fillDry: [38, 44, 50, 58, 64],
        wrong: [8, 6, 10, 5, 7],
        trips: [1, 2, 2, 3, 2]
      },
      "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        wet: [3.1, 4.2, 5.0, 4.5, 6.2, 5.8, 6.7],
        dry: [2.8, 3.6, 4.3, 4.0, 5.4, 4.9, 5.7],
        fillWet: [52, 66, 59, 68, 71, 76, 82],
        fillDry: [40, 43, 47, 49, 56, 60, 64],
        wrong: [9, 8, 11, 7, 6, 9, 10],
        trips: [1, 2, 2, 3, 3, 2, 4]
      },
      "30d": {
        labels: ["W1", "W2", "W3", "W4", "W5"],
        wet: [12, 15, 16, 18, 21],
        dry: [10, 13, 14, 18, 20],
        fillWet: [55, 62, 71, 76, 79],
        fillDry: [43, 49, 52, 58, 63],
        wrong: [12, 10, 13, 9, 11],
        trips: [4, 5, 6, 7, 8]
      }
    };

    function getRangeData(rangeName) {
      return demoRanges[rangeName] || demoRanges.today;
    }

    const chartState = {
      range: "today",
      charts: {}
    };

    function renderCharts(rangeName) {
      chartState.range = rangeName;
      const data = getRangeData(rangeName);

      if (chartState.charts.wetDry) {
        chartState.charts.wetDry.data.labels = data.labels;
        chartState.charts.wetDry.data.datasets[0].data = data.wet;
        chartState.charts.wetDry.data.datasets[1].data = data.dry;
        chartState.charts.wetDry.update();
      }

      if (chartState.charts.generation) {
        chartState.charts.generation.data.labels = data.labels;
        chartState.charts.generation.data.datasets[0].data = data.wet;
        chartState.charts.generation.data.datasets[1].data = data.dry;
        chartState.charts.generation.update();
      }

      if (chartState.charts.fill) {
        chartState.charts.fill.data.labels = data.labels;
        chartState.charts.fill.data.datasets[0].data = data.fillWet;
        chartState.charts.fill.data.datasets[1].data = data.fillDry;
        chartState.charts.fill.update();
      }

      if (chartState.charts.wrongRate) {
        chartState.charts.wrongRate.data.labels = data.labels;
        chartState.charts.wrongRate.data.datasets[0].data = data.wrong;
        chartState.charts.wrongRate.update();
      }

      if (chartState.charts.trips) {
        chartState.charts.trips.data.labels = data.labels;
        chartState.charts.trips.data.datasets[0].data = data.trips;
        chartState.charts.trips.update();
      }
    }

    chartState.charts.wetDry = new Chart(document.getElementById("chartWetDry"), buildChartConfig("bar", getRangeData(chartState.range).labels, [
      { label: "Wet Waste", data: getRangeData(chartState.range).wet, backgroundColor: "#2ea8a0" },
      { label: "Dry Waste", data: getRangeData(chartState.range).dry, backgroundColor: "#a7c957" }
    ], { scales: { y: { beginAtZero: true } } }));

    chartState.charts.generation = new Chart(document.getElementById("chartGeneration"), buildChartConfig("line", getRangeData(chartState.range).labels, [
      { label: "Wet Waste", data: getRangeData(chartState.range).wet, borderColor: "#2ea8a0", fill: false, tension: 0.4 },
      { label: "Dry Waste", data: getRangeData(chartState.range).dry, borderColor: "#a7c957", fill: false, tension: 0.4 }
    ], { scales: { y: { beginAtZero: true } } }));

    chartState.charts.fill = new Chart(document.getElementById("chartFill"), buildChartConfig("line", getRangeData(chartState.range).labels, [
      { label: "Wet Bin", data: getRangeData(chartState.range).fillWet, borderColor: "#2ea8a0", backgroundColor: "rgba(46,168,160,0.12)", tension: 0.4, fill: true },
      { label: "Dry Bin", data: getRangeData(chartState.range).fillDry, borderColor: "#a7c957", backgroundColor: "rgba(167,201,87,0.12)", tension: 0.4, fill: true }
    ], { scales: { y: { beginAtZero: true, max: 100 } } }));

    chartState.charts.wrongRate = new Chart(document.getElementById("chartWrongRate"), buildChartConfig("doughnut", getRangeData(chartState.range).labels, [{
      label: "Wrong Disposal Rate",
      data: getRangeData(chartState.range).wrong,
      backgroundColor: ["#dfeee7", "#f4b942", "#e1644f", "#7cb7a7", "#a7c957"]
    }]));

    chartState.charts.trips = new Chart(document.getElementById("chartTrips"), buildChartConfig("bar", getRangeData(chartState.range).labels, [{
      label: "Collection Trips",
      data: getRangeData(chartState.range).trips,
      backgroundColor: "#123b33"
    }], { scales: { y: { beginAtZero: true } } }));

    const filters = document.querySelectorAll(".filter-btn");
    filters.forEach((button) => {
      button.addEventListener("click", function () {
        filters.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
        renderCharts(this.dataset.range);
      });
    });

    window.CLEANLOOP.charts = { renderCharts };
  }

  window.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("chartWetDry") || document.getElementById("chartGeneration")) {
      createCharts();
    }
  });
})();
