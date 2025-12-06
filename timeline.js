class TimelineGenerator {
  constructor(options) {
    // projects: タイムライン上に描画するボックス群。
    // links: プロジェクトIDを from / to で結ぶ矢印。ID に対応するボックスがない場合は警告を出してスキップする。
    //        (空配列でも実行可能で、描画は省略される)
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

    // 接続線を描画（リンクが存在するときのみ）
    if (this.links && this.links.length > 0) {
      this.drawConnections(container);
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

    if (!Array.isArray(this.links) || this.links.length === 0) {
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "timeline-svg");

    const gridDiv = document.getElementById("timeline-grid");
    if (!gridDiv) {
      console.warn("グリッド要素が見つからないため、接続線の描画をスキップします");
      return;
    }
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.width = gridDiv.scrollWidth + "px";
    svg.style.height = gridDiv.scrollHeight + "px";

    svg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
            </marker>
        </defs>
    `;

    const headerHeight = 50 + 30;

    this.links.forEach((link) => {
      const from = document.getElementById(`project-${link.from}`);
      const to = document.getElementById(`project-${link.to}`);
      if (!from || !to) {
        console.warn(
          `リンク元またはリンク先が見つかりません: ${link.from} → ${link.to}`
        );
        return;
      }

      const x1 = from.offsetLeft + from.offsetWidth;
      const y1 = from.offsetTop + from.offsetHeight / 2 + headerHeight;

      const x2 = to.offsetLeft;
      const y2 = to.offsetTop + to.offsetHeight / 2 + headerHeight;

      const distanceX = Math.abs(x2 - x1);
      let deltaX;

      if (distanceX < 100) {
        deltaX = distanceX * 6;
      // } else if (distanceX < 600) {
      //   deltaX = distanceX * 4;
      } else {
        deltaX = distanceX * 0.5;
      }

      const c1x = x1 + deltaX;
      const c1y = y1;
      const c2x = x2 - deltaX;
      const c2y = y2;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute(
        "d",
        `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
      );
      path.setAttribute("stroke", "gray");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("marker-end", "url(#arrowhead)");

      svg.appendChild(path);
    });

    container.appendChild(svg);
  }
}
