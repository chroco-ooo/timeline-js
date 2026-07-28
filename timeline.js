class TimelineGenerator {
  constructor(options) {
    // projects: タイムライン上に描画するボックス群。
    // links: プロジェクトIDを from / to で結ぶ矢印。ID に対応するボックスがない場合は警告を出してスキップする。
    //        (空配列でも実行可能で、描画は省略される)
    this.targetId = options.targetId;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.scale = options.scale || "month";
    this.layout = options.layout === "vertical" ? "vertical" : "horizontal";
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
    this.startHourPadding = 6;
    this.endHourPadding = 6;
    this.virtualScrollThreshold = Number.isFinite(options.virtualScrollThreshold)
      ? Number(options.virtualScrollThreshold)
      : 180;
    this.virtualColumnBuffer = Number.isFinite(options.virtualColumnBuffer)
      ? Math.max(4, Number(options.virtualColumnBuffer))
      : 12;
    this.virtualWindowStart = 0;
    this.virtualWindowEnd = 0;
    this.allColumns = [];
    this.laneCount = 0;
    this.container = null;
    this.yearsDiv = null;
    this.monthsDiv = null;
    this.gridDiv = null;
    this.isVirtualScrollEnabled = false;
    this.scrollContainer = null;
    this.virtualScrollHandler = null;
    this.rafId = null;
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

    this.detachVirtualScroll();
    container.classList.toggle("timeline-container-vertical", this.layout === "vertical");
    container.classList.toggle("timeline-container-horizontal", this.layout !== "vertical");

    if (this.layout === "vertical") {
      this.container = container;
      this.renderVertical();
      return;
    }

    this.ensureHorizontalStructure(container);
    const yearsDiv = container.querySelector(".timeline-years");
    const monthsDiv = container.querySelector(".timeline-months");
    const gridDiv = container.querySelector(".timeline-grid");

    this.container = container;
    this.yearsDiv = yearsDiv;
    this.monthsDiv = monthsDiv;
    this.gridDiv = gridDiv;

    yearsDiv.innerHTML = "";
    monthsDiv.innerHTML = "";
    gridDiv.innerHTML = "";

    this.allColumns = this.generateColumns();
    this.laneCount = this.resolveLaneCount();
    this.isVirtualScrollEnabled = this.allColumns.length > this.virtualScrollThreshold;

    if (this.isVirtualScrollEnabled) {
      this.setupVirtualScroll();
      return;
    }

    this.renderRange(0, this.allColumns.length);
  }

  setLayout(layout) {
    const nextLayout = layout === "vertical" ? "vertical" : "horizontal";
    if (this.layout === nextLayout && this.container) {
      return;
    }
    this.layout = nextLayout;
    this.render();
  }

  ensureHorizontalStructure(container) {
    const hasRequiredSections = container.querySelector(".timeline-years")
      && container.querySelector(".timeline-months")
      && container.querySelector(".timeline-grid");
    if (hasRequiredSections) {
      return;
    }

    container.replaceChildren();
    [
      ["timeline-years", "timeline-section timeline-years"],
      ["timeline-months", "timeline-section timeline-months"],
      ["timeline-grid", "timeline-section timeline-grid"],
    ].forEach(([id, className]) => {
      const section = document.createElement("div");
      section.id = id;
      section.className = className;
      container.appendChild(section);
    });
  }

  renderVertical() {
    this.container.replaceChildren();
    this.container.style.width = "";

    const list = document.createElement("div");
    list.className = "timeline-vertical";
    list.setAttribute("role", "list");

    this.sortProjectsByDate().forEach((project, projectIndex) => {
      const item = document.createElement("article");
      item.className = "timeline-vertical-item";
      item.setAttribute("role", "listitem");

      const date = document.createElement("time");
      date.className = "timeline-vertical-date";
      if (project.eventAt) {
        date.dateTime = project.eventAt;
      }
      const dateText = document.createElement("strong");
      dateText.textContent = this.formatProjectDate(project);
      date.appendChild(dateText);
      const timeText = this.formatProjectTime(project);
      if (timeText) {
        const time = document.createElement("span");
        time.textContent = timeText;
        date.appendChild(time);
      }

      const marker = document.createElement("span");
      marker.className = "timeline-vertical-marker";
      marker.setAttribute("aria-hidden", "true");

      const card = document.createElement("div");
      card.className = "timeline-vertical-card";
      card.dataset.projectId = project.id;

      const isLinkMode = this.clickMode === "link" && project.url;
      const action = document.createElement(isLinkMode ? "a" : "button");
      action.className = "timeline-vertical-card-action";
      if (isLinkMode) {
        action.href = project.url;
        action.target = this.linkTarget;
        action.rel = this.linkRel;
      } else {
        action.type = "button";
        if (this.onProjectClick) {
          action.addEventListener("click", (event) => {
            this.onProjectClick({ event, project, element: action });
          });
        }
      }

      const imageUrl = this.normalizeImageUrl(project.backgroundImage);
      if (imageUrl) {
        const image = document.createElement("img");
        image.className = "timeline-vertical-image";
        image.src = imageUrl;
        image.alt = "";
        image.loading = "lazy";
        action.appendChild(image);
      }

      const body = document.createElement("div");
      body.className = "timeline-vertical-body";
      const heading = document.createElement("div");
      heading.className = "timeline-vertical-heading";
      this.appendProjectText(heading, "p", "timeline-vertical-site", project.name);
      this.appendProjectText(
        heading,
        "h3",
        "timeline-vertical-title",
        project.title || project.name || "Untitled"
      );
      if (isLinkMode || this.onProjectClick) {
        this.appendProjectText(
          heading,
          "span",
          "timeline-vertical-link",
          "View details →"
        );
      }
      action.appendChild(heading);
      card.appendChild(action);

      const description = this.appendProjectText(
        body,
        "p",
        "timeline-vertical-description",
        project.description
      );
      if (description) {
        const descriptionId = `${this.targetId}-description-${projectIndex}`
          .replace(/[^a-zA-Z0-9_-]/g, "-");
        description.id = descriptionId;

        const descriptionToggle = document.createElement("button");
        descriptionToggle.type = "button";
        descriptionToggle.className = "timeline-vertical-description-toggle";
        descriptionToggle.textContent = "Show more";
        descriptionToggle.setAttribute("aria-controls", descriptionId);
        descriptionToggle.setAttribute("aria-expanded", "false");
        descriptionToggle.hidden = true;
        descriptionToggle.addEventListener("click", () => {
          const expanded = descriptionToggle.getAttribute("aria-expanded") === "true";
          descriptionToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
          descriptionToggle.textContent = expanded ? "Show more" : "Show less";
          description.classList.toggle("timeline-vertical-description-expanded", !expanded);
        });
        body.appendChild(descriptionToggle);
      }

      const footer = document.createElement("div");
      footer.className = "timeline-vertical-footer";
      this.appendProjectText(footer, "span", "", this.formatProjectDate(project));
      body.appendChild(footer);
      card.appendChild(body);
      item.append(date, marker, card);
      list.appendChild(item);
    });

    this.container.appendChild(list);
    requestAnimationFrame(() => {
      list.querySelectorAll(".timeline-vertical-description").forEach((description) => {
        const toggle = description.nextElementSibling;
        if (!toggle || !toggle.classList.contains("timeline-vertical-description-toggle")) {
          return;
        }
        toggle.hidden = description.scrollHeight <= description.clientHeight;
      });
    });
  }

  appendProjectText(parent, tagName, className, value) {
    const text = String(value || "").trim();
    if (!text) {
      return null;
    }
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  normalizeImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    const cssUrlMatch = raw.match(/^url\((['"]?)(.*?)\1\)$/i);
    const url = cssUrlMatch ? cssUrlMatch[2] : raw;
    return /^(https?:\/\/|\/)/i.test(url) ? url : "";
  }

  getProjectDate(project) {
    const raw = String(project.eventAt || project.start || project.end || "").trim();
    const dateTimeMatch = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (dateTimeMatch) {
      const [, year, month, day, hour = "0", minute = "0", second = "0"] = dateTimeMatch;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );
      const isValid = date.getFullYear() === Number(year)
        && date.getMonth() === Number(month) - 1
        && date.getDate() === Number(day)
        && date.getHours() === Number(hour)
        && date.getMinutes() === Number(minute)
        && date.getSeconds() === Number(second);
      return isValid ? date : null;
    }
    const quarterMatch = raw.match(/^(\d{4})-Q([1-4])$/);
    if (quarterMatch) {
      return new Date(Number(quarterMatch[1]), (Number(quarterMatch[2]) - 1) * 3, 1);
    }
    const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const date = new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
      return date.getMonth() === Number(monthMatch[2]) - 1 ? date : null;
    }
    const yearMatch = raw.match(/^(\d{4})$/);
    return yearMatch ? new Date(Number(yearMatch[1]), 0, 1) : null;
  }

  sortProjectsByDate() {
    return this.projects
      .map((project, index) => ({ project, index }))
      .sort((leftEntry, rightEntry) => {
        const leftDate = this.getProjectDate(leftEntry.project);
        const rightDate = this.getProjectDate(rightEntry.project);
        if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
          return rightDate.getTime() - leftDate.getTime();
        }
        if (leftDate && !rightDate) {
          return -1;
        }
        if (!leftDate && rightDate) {
          return 1;
        }
        return leftEntry.index - rightEntry.index;
      })
      .map(({ project }) => project);
  }

  formatProjectDate(project) {
    const date = this.getProjectDate(project);
    if (!date) {
      return String(project.start || project.end || "");
    }
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  formatProjectTime(project) {
    const match = String(project.eventAt || "").match(/[T ](\d{2}):(\d{2})/);
    if (!match || `${match[1]}:${match[2]}` === "00:00") {
      return "";
    }
    return `${match[1]}:${match[2]}`;
  }

  setupVirtualScroll() {
    const scrollContainer = this.resolveScrollContainer();
    const totalWidth = this.allColumns.length * this.columnWidth;
    this.container.style.width = `${totalWidth}px`;
    this.virtualWindowStart = -1;
    this.virtualWindowEnd = -1;

    this.virtualScrollHandler = () => {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.updateVirtualWindow();
      });
    };

    if (scrollContainer) {
      this.scrollContainer = scrollContainer;
      this.scrollContainer.addEventListener("scroll", this.virtualScrollHandler, { passive: true });
      window.addEventListener("resize", this.virtualScrollHandler);
    }

    this.updateVirtualWindow();
  }

  resolveScrollContainer() {
    if (!this.container) return null;
    return this.container.closest(".timeline-scroll") || this.container.parentElement;
  }

  updateVirtualWindow() {
    const viewportWidth = this.scrollContainer?.clientWidth || this.container?.clientWidth || 0;
    const scrollLeft = this.scrollContainer?.scrollLeft || 0;
    const visibleStart = Math.floor(scrollLeft / this.columnWidth);
    const visibleCount = Math.max(1, Math.ceil(viewportWidth / this.columnWidth));
    const nextStart = Math.max(0, visibleStart - this.virtualColumnBuffer);
    const nextEnd = Math.min(
      this.allColumns.length,
      visibleStart + visibleCount + this.virtualColumnBuffer
    );

    if (this.virtualWindowStart === nextStart && this.virtualWindowEnd === nextEnd) {
      return;
    }

    this.virtualWindowStart = nextStart;
    this.virtualWindowEnd = nextEnd;
    this.renderRange(nextStart, nextEnd);
  }

  detachVirtualScroll() {
    if (this.scrollContainer && this.virtualScrollHandler) {
      this.scrollContainer.removeEventListener("scroll", this.virtualScrollHandler);
    }
    if (this.virtualScrollHandler) {
      window.removeEventListener("resize", this.virtualScrollHandler);
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.scrollContainer = null;
    this.virtualScrollHandler = null;
  }

  renderRange(start, end) {
    const columns = this.allColumns.slice(start, end);
    const years = this.generateHeaderGroups(columns);
    const columnCount = columns.length;
    const laneCount = this.laneCount;

    this.yearsDiv.innerHTML = "";
    this.monthsDiv.innerHTML = "";
    this.gridDiv.innerHTML = "";

    this.yearsDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    this.monthsDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    this.gridDiv.style.gridTemplateColumns = `repeat(${columnCount}, ${this.columnWidth}px)`;
    this.gridDiv.style.gridTemplateRows = `repeat(${laneCount}, 80px)`;

    const offsetX = start * this.columnWidth;
    this.yearsDiv.style.transform = `translateX(${offsetX}px)`;
    this.monthsDiv.style.transform = `translateX(${offsetX}px)`;
    this.gridDiv.style.transform = `translateX(${offsetX}px)`;

    if (!this.isVirtualScrollEnabled) {
      this.container.style.width = "";
      this.yearsDiv.style.transform = "";
      this.monthsDiv.style.transform = "";
      this.gridDiv.style.transform = "";
    }

    const currentYear = String(new Date().getFullYear());
    years.forEach((yearData) => {
      const cell = document.createElement("div");
      cell.className = "year-cell";
      cell.innerText = yearData.label;
      if (yearData.year === currentYear) {
        cell.classList.add("year-cell-current");
      }
      cell.style.gridColumn = `span ${yearData.span}`;
      this.yearsDiv.appendChild(cell);
    });

    columns.forEach((column) => {
      const cell = document.createElement("div");
      cell.className = "month-cell";
      cell.innerText = this.getColumnLabel(column);
      this.monthsDiv.appendChild(cell);
    });

    this.headerHeight = this.yearsDiv.offsetHeight + this.monthsDiv.offsetHeight;

    for (let i = 0; i < columns.length * laneCount; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      this.gridDiv.appendChild(cell);
    }

    this.renderTodayIndicator(this.allColumns, this.container, this.gridDiv);

    this.projects.forEach((project) => {
      const startIndex = this.getColumnIndex(this.allColumns, project.start);
      const endIndex = this.getColumnIndex(this.allColumns, project.end);

      if (startIndex === -1 || endIndex === -1) {
        console.warn(`プロジェクト ${project.id} の日付範囲がタイムライン範囲外です`);
        return;
      }

      if (startIndex < start || startIndex >= end) {
        return;
      }

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

      box.style.gridColumn = `${startIndex - start + 1}`;
      box.style.gridRow = `${project.lane}`;
      this.gridDiv.appendChild(box);
    });

    if (this.links && this.links.length > 0) {
      this.drawConnections(this.container);
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

    if (this.scale === "hour") {
      current.setHours(current.getHours() - this.startHourPadding, 0, 0, 0);
      end.setHours(end.getHours() + this.endHourPadding, 0, 0, 0);

      while (current <= end) {
        result.push(this.formatDate(current));
        current.setHours(current.getHours() + 1);
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
      const headerKey = this.scale === "day"
        ? column.substring(0, 7)
        : this.scale === "hour"
          ? column.substring(0, 10)
          : column.substring(0, 4);
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
    const hourMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (hourMatch) {
      const [, y, m, d, h, min] = hourMatch;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), 0, 0);
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
    if (this.scale === "hour") {
      const d = date.getDate().toString().padStart(2, "0");
      const h = date.getHours().toString().padStart(2, "0");
      return `${y}-${m}-${d} ${h}:00`;
    }
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
    if (this.scale === "hour") {
      return `${column.substring(11, 13)}時`;
    }
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

    const groupMap = this.buildConnectionGroups();

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
      const groupId = groupMap.get(String(link.from)) ?? groupMap.get(String(link.to)) ?? 0;
      path.setAttribute("stroke", this.getConnectionColor(groupId));
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      svg.appendChild(path);
    });

    gridDiv.appendChild(svg);
  }

  buildConnectionGroups() {
    if (!Array.isArray(this.links) || this.links.length === 0) {
      return new Map();
    }

    const adjacency = new Map();
    const ensureNode = (nodeId) => {
      if (!adjacency.has(nodeId)) {
        adjacency.set(nodeId, new Set());
      }
    };

    this.links.forEach((link) => {
      const from = String(link.from);
      const to = String(link.to);
      ensureNode(from);
      ensureNode(to);
      adjacency.get(from).add(to);
      adjacency.get(to).add(from);
    });

    const visited = new Set();
    const groupMap = new Map();
    let groupId = 0;

    adjacency.forEach((_, nodeId) => {
      if (visited.has(nodeId)) {
        return;
      }
      const queue = [nodeId];
      visited.add(nodeId);
      groupMap.set(nodeId, groupId);

      while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = adjacency.get(current) || [];
        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            groupMap.set(neighbor, groupId);
            queue.push(neighbor);
          }
        });
      }

      groupId += 1;
    });

    return groupMap;
  }

  getConnectionColor(groupId) {
    const hue = (groupId * 137.508) % 360;
    return `hsl(${hue} 70% 45%)`;
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
    const markerLeft = monthIndex * this.columnWidth + this.columnWidth / 2;
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
