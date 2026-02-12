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
    this.minLaneCount = Number.isFinite(options.minLaneCount) ? options.minLaneCount : 5;
    this.maxLaneCount = Number.isFinite(options.maxLaneCount) ? options.maxLaneCount : 10;
    this.clickMode = options.clickMode === "link" ? "link" : "event";
    this.linkTarget = options.linkTarget || "_blank";
    this.linkRel = options.linkRel || "noopener";
    this.onProjectClick = typeof options.onProjectClick === "function"
      ? options.onProjectClick
      : null;
    this.columnWidth = 120;
    this.headerHeight = 80; // years (50px) + months (30px)
    this.startMonthPadding = 2;
    this.endMonthPadding = 2;
  }

  resolveLaneCount() {
    const lanes = Array.isArray(this.projects)
      ? this.projects.map((project) => Number(project.lane) || 0)
      : [];
    const maxLane = lanes.length > 0 ? Math.max(...lanes) : 0;
    const baseCount = Math.max(maxLane, this.projects.length || 0);
    const minLaneCount = Math.max(1, this.minLaneCount);
    const maxLaneCount = Math.max(minLaneCount, this.maxLaneCount);
    return Math.min(maxLaneCount, Math.max(minLaneCount, baseCount));
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

    const columns = this.generateColumns();
    const years = this.generateHeaderGroups(columns);
    const laneCount = this.resolveLaneCount();

    const columnCount = columns.length;
    yearsDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    monthsDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    gridDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    gridDiv.style.gridTemplateRows = `repeat(${laneCount}, 80px)`;

    // 年・月ラベル
    const currentYear = String(new Date().getFullYear());
    years.forEach((yearData) => {
      const cell = document.createElement("div");
      cell.className = "year-cell";
      cell.innerText = yearData.label;
      if (yearData.year === currentYear) {
        cell.classList.add("year-cell-current");
      }
      cell.style.gridColumn = `span ${yearData.span}`;
      yearsDiv.appendChild(cell);
    });

    columns.forEach((column) => {
      const cell = document.createElement("div");
      cell.className = "month-cell";
      cell.innerText = this.getColumnLabel(column);
      monthsDiv.appendChild(cell);
    });

    this.headerHeight = yearsDiv.offsetHeight + monthsDiv.offsetHeight;

    // グリッド作成
    for (let i = 0; i < columns.length * laneCount; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      gridDiv.appendChild(cell);
    }

    this.renderTodayIndicator(columns, container, gridDiv);

    // プロジェクトボックス配置
    this.projects.forEach((project) => {
      const isLinkMode = this.clickMode === "link" && project.url;
      const box = document.createElement(isLinkMode ? "a" : "div");
      box.className = "project-box";
      box.id = `project-${project.id}`;
      box.setAttribute("aria-label", project.name || "");
      box.dataset.projectId = project.id;
      if (isLinkMode) {
        box.href = project.url;
        box.target = this.linkTarget;
        box.rel = this.linkRel;
      }

      const label = document.createElement("div");
      label.className = "project-label";
      label.innerText = this.truncateTitle(project.name);
      box.appendChild(label);

      const icon = document.createElement("div");
      icon.className = "project-icon";
      if (project.backgroundImage) {
        icon.style.backgroundImage = `url("${project.backgroundImage}")`;
        icon.classList.add("project-icon-has-image");
      }
      box.appendChild(icon);

      if (project.color) {
        box.style.backgroundColor = project.color;
      }

      if (!isLinkMode && this.onProjectClick) {
        box.classList.add("project-box-clickable");
        box.addEventListener("click", (event) => {
          this.onProjectClick({ event, project, element: box });
        });
      }

      const startIndex = this.getColumnIndex(columns, project.start);
      const endIndex = this.getColumnIndex(columns, project.end);

      if (startIndex === -1 || endIndex === -1) {
        console.warn(
          `プロジェクト ${project.id} の日付範囲がタイムライン範囲外です`
        );
        return;
      }

      box.style.gridColumn = `${startIndex + 1}`;
      box.style.gridRow = `${project.lane}`;

      gridDiv.appendChild(box);
    });

    // 接続線を描画（リンクが存在するときのみ）
    if (this.links && this.links.length > 0) {
      this.drawConnections(container);
    }
  }

  truncateTitle(text) {
    if (!text) return "";
    const trimmed = String(text).trim();
    const maxLength = 20;
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength - 1)}…`;
  }

  getLabelWidth(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return 140;
    const baseWidth = 36;
    const charWidth = 12;
    return Math.min(360, Math.max(140, baseWidth + trimmed.length * charWidth));
  }

  generateColumns() {
    const result = [];
    let current = this.parseDate(this.startDate);
    const end = this.parseDate(this.endDate);

    if (this.scale === "day") {
      current.setDate(current.getDate() - this.startMonthPadding);
      end.setDate(end.getDate() + this.endMonthPadding);

      while (current <= end) {
        result.push(this.formatDate(current));
        current.setDate(current.getDate() + 1);
      }
      return result;
    }

    if (this.scale === "quarter") {
      current.setMonth(current.getMonth() - this.startMonthPadding * 3);
      end.setMonth(end.getMonth() + this.endMonthPadding * 3);

      while (current <= end) {
        result.push(this.formatDate(current));
        current.setMonth(current.getMonth() + 3);
      }
      return result;
    }

    if (this.scale === "year") {
      current.setFullYear(current.getFullYear() - this.startMonthPadding);
      end.setFullYear(end.getFullYear() + this.endMonthPadding);

      while (current <= end) {
        result.push(this.formatDate(current));
        current.setFullYear(current.getFullYear() + 1);
      }
      return result;
    }

    current.setMonth(current.getMonth() - this.startMonthPadding);
    end.setMonth(end.getMonth() + this.endMonthPadding);

    while (current <= end) {
      result.push(this.formatDate(current));
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }

  generateHeaderGroups(columns) {
    const headers = [];
    let currentKey = null;
    let spanCount = 0;

    columns.forEach((column) => {
      const headerKey = this.scale === "day" ? column.substring(0, 7) : column.substring(0, 4);
      if (headerKey !== currentKey) {
        if (currentKey !== null) {
          headers.push({ label: currentKey, year: currentKey.substring(0, 4), span: spanCount });
        }
        currentKey = headerKey;
        spanCount = 1;
      } else {
        spanCount++;
      }
    });

    if (currentKey !== null) {
      headers.push({ label: currentKey, year: currentKey.substring(0, 4), span: spanCount });
    }

    return headers;
  }

  getColumnIndex(columns, target) {
    return columns.indexOf(target);
  }

  parseDate(str) {
    const trimmed = String(str || "").trim();
    if (!trimmed) {
      return new Date();
    }
    if (trimmed.includes("Q")) {
      const [yearText, quarterText] = trimmed.split("-Q");
      const year = Number(yearText);
      const quarter = Number(quarterText);
      const month = Number.isFinite(quarter) ? (quarter - 1) * 3 + 1 : 1;
      return new Date(year, Math.max(month - 1, 0), 1);
    }
    const parts = trimmed.split("-").map(Number);
    const year = parts[0];
    const month = parts[1] || 1;
    const day = parts[2] || 1;
    return new Date(year, month - 1, day);
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    if (this.scale === "day") {
      const d = date.getDate().toString().padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    if (this.scale === "quarter") {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${y}-Q${quarter}`;
    }
    if (this.scale === "year") {
      return `${y}`;
    }
    return `${y}-${m}`;
  }

  getColumnLabel(column) {
    if (this.scale === "day") {
      return column.substring(8);
    }
    if (this.scale === "quarter") {
      const quarterText = column.split("-Q")[1];
      const quarter = Number(quarterText);
      if (!Number.isNaN(quarter) && quarter >= 1 && quarter <= 4) {
        const month = (quarter - 1) * 3 + 1;
        return `${month}月`;
      }
      return column;
    }
    if (this.scale === "year") {
      return column;
    }
    return column.substring(5);
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
    svg.style.zIndex = "0";
    svg.style.width = gridDiv.scrollWidth + "px";
    svg.style.height = gridDiv.scrollHeight + "px";

    svg.innerHTML = "";

    this.links.forEach((link) => {
      const from = document.getElementById(`project-${link.from}`);
      const to = document.getElementById(`project-${link.to}`);
      if (!from || !to) {
        console.warn(
          `リンク元またはリンク先が見つかりません: ${link.from} → ${link.to}`
        );
        return;
      }

      const fromIcon = from.querySelector(".project-icon");
      const toIcon = to.querySelector(".project-icon");
      const fromBox = from.getBoundingClientRect();
      const toBox = to.getBoundingClientRect();
      const gridBox = gridDiv.getBoundingClientRect();

      const fromIconBox = fromIcon ? fromIcon.getBoundingClientRect() : fromBox;
      const toIconBox = toIcon ? toIcon.getBoundingClientRect() : toBox;

      const x1 = fromIconBox.left - gridBox.left + fromIconBox.width / 2;
      const y1 = fromIconBox.top - gridBox.top + fromIconBox.height / 2;

      const x2 = toIconBox.left - gridBox.left + toIconBox.width / 2;
      const y2 = toIconBox.top - gridBox.top + toIconBox.height / 2;

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
      svg.appendChild(path);
    });

    gridDiv.appendChild(svg);
  }

  renderTodayIndicator(columns, container, gridDiv) {
    if (!container || !gridDiv) {
      return;
    }

    const todayLabel = document.getElementById("timeline-today-label");
    const existingMarker = container.querySelector(".timeline-today-marker");
    if (existingMarker) {
      existingMarker.remove();
    }

    if (!columns || columns.length === 0) {
      if (todayLabel) {
        todayLabel.textContent = "今日の位置を計算できませんでした";
      }
      return;
    }

    const todayKey = this.formatDate(new Date());
    const monthIndex = columns.indexOf(todayKey);

    if (todayLabel) {
      todayLabel.textContent = `今日: ${todayKey}`;
    }

    if (monthIndex === -1) {
      if (todayLabel) {
        todayLabel.textContent = `今日 (${todayKey}) は範囲外です`;
      }
      return;
    }

    const marker = document.createElement("div");
    marker.className = "timeline-today-marker";
    const monthCell = document.getElementById("timeline-months")?.children?.[monthIndex];
    const markerLeft = monthCell
      ? monthCell.offsetLeft + monthCell.offsetWidth / 2
      : monthIndex * this.columnWidth + this.columnWidth / 2;
    marker.style.left = `${markerLeft}px`;

    const line = document.createElement("div");
    line.className = "timeline-today-line";
    line.style.height = `${gridDiv.scrollHeight + this.headerHeight}px`;

    const badge = document.createElement("div");
    badge.className = "timeline-today-badge";
    badge.innerText = "Today";

    marker.appendChild(line);
    marker.appendChild(badge);
    container.appendChild(marker);
  }
}
