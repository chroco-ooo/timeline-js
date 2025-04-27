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

    // 年・月ラベル
    years.forEach((yearData) => {
      const cell = document.createElement("div");
      cell.className = "year-cell";
      cell.innerText = yearData.year;
      cell.style.gridColumn = `span ${yearData.span}`;
      yearsDiv.appendChild(cell);
    });

    months.forEach((month) => {
      const cell = document.createElement("div");
      cell.className = "month-cell";
      cell.innerText = month.substring(5);
      monthsDiv.appendChild(cell);
    });

    // グリッド作成
    for (let i = 0; i < months.length * 5; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      gridDiv.appendChild(cell);
    }

    // プロジェクトボックス配置
    this.projects.forEach((project) => {
      const box = document.createElement("div");
      box.className = "project-box";
      box.id = `project-${project.id}`;
      box.innerText = project.name;

      if (project.color) {
        box.style.backgroundColor = project.color;
      }

      const startIndex = this.getMonthIndex(months, project.start);
      const endIndex = this.getMonthIndex(months, project.end);

      if (startIndex === -1 || endIndex === -1) {
        console.warn(
          `プロジェクト ${project.id} の日付範囲がタイムライン範囲外です`
        );
        return;
      }

      box.style.gridColumn = `${startIndex + 1} / ${endIndex + 2}`;
      box.style.gridRow = `${project.lane}`;

      gridDiv.appendChild(box);
    });

    // 接続線を描画
    this.drawConnections(container);
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

  getMonthIndex(months, target) {
    return months.indexOf(target);
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

  drawConnections(container) {
    const existingSvg = document.getElementById("timeline-svg");
    if (existingSvg) {
      existingSvg.remove();
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "timeline-svg");
    svg.setAttribute(
      "style",
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"
    );
    svg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
            </marker>
        </defs>
    `;

    this.links.forEach((link) => {
      const from = document.getElementById(`project-${link.from}`);
      const to = document.getElementById(`project-${link.to}`);
      if (!from || !to) {
        console.warn(
          `リンク元またはリンク先が見つかりません: ${link.from} → ${link.to}`
        );
        return;
      }

      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const x1 = fromRect.right - containerRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
      const x2 = toRect.left - containerRect.left;
      const y2 = toRect.top + toRect.height / 2 - containerRect.top;

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "gray");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("marker-end", "url(#arrowhead)");

      svg.appendChild(line);
    });

    container.appendChild(svg);
  }
}
