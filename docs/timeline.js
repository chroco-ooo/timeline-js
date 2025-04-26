class TimelineGenerator {
  constructor(options) {
    this.targetId = options.targetId;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.scale = options.scale || "month";
    this.projects = options.projects || [];
    this.links = options.links || [];
  }

  render() {
    const container = document.getElementById(this.targetId);
    if (!container) {
      console.error("ターゲット要素が見つかりません");
      return;
    }

    const yearsDiv = document.getElementById("timeline-years");
    const monthsDiv = document.getElementById("timeline-months");
    const gridDiv = document.getElementById("timeline-grid");

    yearsDiv.innerHTML = "";
    monthsDiv.innerHTML = "";
    gridDiv.innerHTML = "";

    const months = this.generateMonths();
    const years = this.generateYears(months);

    const columnCount = months.length;
    yearsDiv.style.gridTemplateColumns = `repeat(${columnCount}, 120px)`;
    monthsDiv.style.gridTemplateColumns = `repeat(${columnCount}, 120px)`;
    gridDiv.style.gridTemplateColumns = `repeat(${columnCount}, 120px)`;

    // 年ラベル
    years.forEach((yearData) => {
      const cell = document.createElement("div");
      cell.className = "year-cell";
      cell.innerText = yearData.year;
      cell.style.gridColumn = `span ${yearData.span}`;
      yearsDiv.appendChild(cell);
    });

    // 月ラベル
    months.forEach((month) => {
      const cell = document.createElement("div");
      cell.className = "month-cell";
      cell.innerText = month.substring(5); // "YYYY-MM"から"MM"だけ取り出す
      monthsDiv.appendChild(cell);
    });

    // グリッド作成（仮で3レーン）
    for (let i = 0; i < months.length * 3; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      gridDiv.appendChild(cell);
    }
  }

  generateMonths() {
    const result = [];
    let current = this.parseDate(this.startDate);
    const end = this.parseDate(this.endDate);

    while (current <= end) {
      result.push(this.formatDate(current));
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }

  generateYears(months) {
    const years = [];
    let currentYear = null;
    let spanCount = 0;

    months.forEach((month) => {
      const year = month.substring(0, 4);
      if (year !== currentYear) {
        if (currentYear !== null) {
          years.push({ year: currentYear, span: spanCount });
        }
        currentYear = year;
        spanCount = 1;
      } else {
        spanCount++;
      }
    });

    if (currentYear !== null) {
      years.push({ year: currentYear, span: spanCount });
    }

    return years;
  }

  parseDate(str) {
    const [year, month] = str.split("-").map(Number);
    return new Date(year, (month || 1) - 1);
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${y}-${m}`;
  }
}
