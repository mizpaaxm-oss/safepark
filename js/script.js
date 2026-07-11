/* =========================================================
   SafePark — script.js
   All UI behaviour, rendering and interactivity.
   Vanilla JavaScript only — no frameworks.
   Depends on data.js (SafeParkDB / SafeParkAuth) being
   loaded first.
========================================================= */

/* ---------------- Utility helpers ---------------- */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function initials(name) {
  return String(name).split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function durationBetween(startIso, endIso) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const mins = Math.max(1, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function csvCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  // Escape quotes and wrap in quotes if the value contains a comma, quote, or newline
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(filename, rows) {
  const csvContent = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toast(message, type = "success") {
  let wrap = qs(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(30px)";
    el.style.transition = "all .3s ease";
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* ---------------- App shell (sidebar / topbar) ---------------- */
function initShell() {
  const page = document.body.dataset.page;

  // highlight active nav link
  qsa(".sidebar-nav a[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === page);
  });

  // mobile sidebar toggle
  const menuBtn = qs("#menuToggle");
  const sidebar = qs(".sidebar");
  const overlay = qs(".sidebar-overlay");
  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }

  // populate current user in topbar
  const user = SafeParkAuth.currentUser();
  const nameEl = qs("#topbarUserName");
  const roleEl = qs("#topbarUserRole");
  const avatarEl = qs("#topbarAvatar");
  if (user) {
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = initials(user.name);
  }

  // logout links (in sidebar footer) go straight to logout.html — no extra JS needed,
  // but we clear the session as soon as the logout page loads (see initLogoutPage).
}

/* ---------------- Modal helper ---------------- */
function openModal(id) { const m = qs("#" + id); if (m) m.classList.add("show"); }
function closeModal(id) { const m = qs("#" + id); if (m) m.classList.remove("show"); }
function bindModalDismiss() {
  qsa(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("show");
    });
  });
  qsa("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
}

/* =========================================================
   LOGIN PAGE
========================================================= */
function initLoginPage() {
  const form = qs("#loginForm");
  if (!form) return;
  const errorBox = qs("#loginError");
  const toggle = qs("#togglePass");
  const passInput = qs("#password");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isPass = passInput.type === "password";
      passInput.type = isPass ? "text" : "password";
      toggle.textContent = isPass ? "HIDE" : "SHOW";
    });
  }

  // if already logged in, skip straight to dashboard
  if (SafeParkAuth.isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = qs("#email").value.trim();
    const password = passInput.value;
    const ok = SafeParkAuth.login(email, password);
    if (ok) {
      errorBox.classList.remove("show");
      window.location.href = "dashboard.html";
    } else {
      errorBox.textContent = "Invalid email or password. Please try again.";
      errorBox.classList.add("show");
    }
  });
}

/* =========================================================
   REGISTER PAGE
========================================================= */
function initRegisterPage() {
  const form = qs("#registerForm");
  if (!form) return;
  const errorBox = qs("#registerError");
  const toggle = qs("#toggleRegPass");
  const passInput = qs("#regPassword");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isPass = passInput.type === "password";
      passInput.type = isPass ? "text" : "password";
      toggle.textContent = isPass ? "HIDE" : "SHOW";
    });
  }

  if (SafeParkAuth.isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#regName").value.trim();
    const email = qs("#regEmail").value.trim();
    const password = passInput.value;
    const confirm = qs("#regConfirmPassword").value;

    if (password !== confirm) {
      errorBox.textContent = "Passwords do not match. Please try again.";
      errorBox.classList.add("show");
      return;
    }

    const result = SafeParkAuth.register(name, email, password);
    if (result.ok) {
      errorBox.classList.remove("show");
      toast("Account created successfully. Welcome to SafePark!");
      window.location.href = "dashboard.html";
    } else {
      errorBox.textContent = result.message;
      errorBox.classList.add("show");
    }
  });
}

/* =========================================================
   DASHBOARD PAGE
========================================================= */
function initDashboard() {
  if (!qs("#statsGrid")) return;
  const s = SafeParkDB.stats();

  qs("#statsGrid").innerHTML = `
    <div class="stat-card" style="animation-delay:.05s">
      <div class="stat-top">
        <div class="stat-icon blue">${iconHtml("car")}</div>
        <span class="stat-trend up">${iconHtml("arrow-up", "icon-sm")} ${s.totalVehicles}</span>
      </div>
      <h3>${s.totalVehicles}</h3>
      <span class="label">Registered Vehicles</span>
    </div>
    <div class="stat-card" style="animation-delay:.1s">
      <div class="stat-top">
        <div class="stat-icon navy">${iconHtml("drivers")}</div>
        <span class="stat-trend up">${iconHtml("arrow-up", "icon-sm")} ${s.totalDrivers}</span>
      </div>
      <h3>${s.totalDrivers}</h3>
      <span class="label">Active Drivers</span>
    </div>
    <div class="stat-card" style="animation-delay:.15s">
      <div class="stat-top">
        <div class="stat-icon amber">${iconHtml("slots")}</div>
        <span class="stat-trend ${s.occupancyRate > 70 ? "down" : "up"}">${s.occupancyRate}%</span>
      </div>
      <h3>${s.occupied}/${s.totalSlots}</h3>
      <span class="label">Slots Occupied</span>
    </div>
    <div class="stat-card" style="animation-delay:.2s">
      <div class="stat-top">
        <div class="stat-icon green">${iconHtml("money")}</div>
        <span class="stat-trend up">${iconHtml("arrow-up", "icon-sm")}</span>
      </div>
      <h3>$${s.totalRevenue.toFixed(2)}</h3>
      <span class="label">Revenue Collected</span>
    </div>
  `;

  // Recent activity: latest 6 records, newest first
  const records = SafeParkDB.get("parking_records")
    .slice()
    .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
    .slice(0, 6)
    .map((r) => SafeParkDB.recordDetailed(r));

  const listEl = qs("#recentActivity");
  if (listEl) {
    listEl.innerHTML = records.length ? records.map((r) => `
      <div class="activity-item">
        <div class="a-icon ${r.status === "parked" ? "in" : "out"}">${iconHtml(r.status === "parked" ? "gate" : "check")}</div>
        <div class="a-info">
          <strong>${escapeHtml(r.plate_number)} · ${escapeHtml(r.driver_name)}</strong>
          <span>Slot ${escapeHtml(r.slot_code)} — ${r.status === "parked" ? "Currently parked" : "Checked out"}</span>
        </div>
        <div class="a-time">${timeAgo(r.entry_time)}</div>
      </div>
    `).join("") : `<div class="empty-state">No parking activity yet.</div>`;
  }

  // Occupancy donut chart (pure SVG, computed live)
  const donutHost = qs("#occupancyDonut");
  if (donutHost) {
    donutHost.innerHTML = buildDonut([
      { label: "Occupied", value: s.occupied, color: "#3d8bff" },
      { label: "Available", value: s.available, color: "#1fa37b" },
      { label: "Reserved", value: s.reserved, color: "#e8a33d" },
      { label: "Maintenance", value: s.maintenance, color: "#e2564f" }
    ], s.totalSlots);
  }

  // Mini weekly bar chart (simulated 7-day trend derived from record count, deterministic)
  const bars = qs("#miniBars");
  if (bars) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = Math.max(4, SafeParkDB.get("parking_records").length);
    bars.innerHTML = days.map((d, i) => {
      const val = Math.round(30 + Math.sin(i * 1.3 + base) * 20 + base * 3);
      const height = Math.min(100, Math.max(12, val));
      return `<div class="bar-col"><div class="bar" style="height:${height}%"></div><span>${d}</span></div>`;
    }).join("");
  }
}

function buildDonut(segments, total) {
  const size = 200, stroke = 24, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  const safeTotal = total || 1;
  const circles = segments.map((seg) => {
    const frac = seg.value / safeTotal;
    const dash = frac * c;
    const circle = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${seg.color}"
      stroke-width="${stroke}" stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-offset}" stroke-linecap="butt"/>`;
    offset += dash;
    return circle;
  }).join("");

  const occupiedPct = segments[0] && total ? Math.round((segments[0].value / total) * 100) : 0;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef2f8" stroke-width="${stroke}"/>
      ${circles}
    </svg>
    <div class="occ-center-label"><strong>${occupiedPct}%</strong><span>Occupied</span></div>
    <div class="occ-legend">
      ${segments.map((s) => `<div class="row"><span><span class="dot" style="background:${s.color}"></span>${s.label}</span><span>${s.value}</span></div>`).join("")}
    </div>
  `;
}

/* small helper to inline an icon by fetch-free <img> tag (icons are local files) */
function iconHtml(name, cls = "icon") {
  return `<img src="icons/${name}.svg" class="${cls}" alt="" />`;
}

/* =========================================================
   DRIVERS PAGE
========================================================= */
function initDrivers() {
  const tbody = qs("#driversTableBody");
  if (!tbody) return;

  let searchTerm = "";
  let statusFilter = "";

  function render() {
    let drivers = SafeParkDB.get("drivers").map((d) => SafeParkDB.driverWithVehicleCount(d));
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      drivers = drivers.filter((d) => d.full_name.toLowerCase().includes(t) || d.phone.includes(t) || d.license_number.toLowerCase().includes(t));
    }
    if (statusFilter) drivers = drivers.filter((d) => d.status === statusFilter);

    tbody.innerHTML = drivers.length ? drivers.map((d) => `
      <tr>
        <td>
          <div class="cell-user">
            <div class="avatar-sm">${initials(d.full_name)}</div>
            <div><strong>${escapeHtml(d.full_name)}</strong><span>${escapeHtml(d.email || "—")}</span></div>
          </div>
        </td>
        <td>${escapeHtml(d.phone)}</td>
        <td>${escapeHtml(d.license_number)}</td>
        <td>${escapeHtml(d.address || "—")}</td>
        <td>${d.vehicle_count}</td>
        <td><span class="badge ${d.status}">${d.status}</span></td>
        <td>
          <div class="row-actions">
            <button data-edit="${d.id}" title="Edit">${iconHtml("edit", "icon-sm")}</button>
            <button data-del="${d.id}" class="del" title="Delete">${iconHtml("delete", "icon-sm")}</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="7"><div class="empty-state">${iconHtml("drivers", "icon")}<p>No drivers found.</p></div></td></tr>`;

    qsa("[data-edit]", tbody).forEach((btn) => btn.addEventListener("click", () => openDriverModal(Number(btn.dataset.edit))));
    qsa("[data-del]", tbody).forEach((btn) => btn.addEventListener("click", () => {
      if (confirm("Remove this driver? This cannot be undone.")) {
        SafeParkDB.remove("drivers", Number(btn.dataset.del));
        toast("Driver removed successfully.");
        render();
      }
    }));

    const countEl = qs("#driversCount");
    if (countEl) countEl.textContent = `${drivers.length} driver${drivers.length !== 1 ? "s" : ""}`;
  }

  qs("#driverSearch")?.addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  qs("#driverStatusFilter")?.addEventListener("change", (e) => { statusFilter = e.target.value; render(); });
  qs("#addDriverBtn")?.addEventListener("click", () => openDriverModal(null));

  function openDriverModal(id) {
    const form = qs("#driverForm");
    form.reset();
    qs("#driverModalTitle").textContent = id ? "Edit Driver" : "Add New Driver";
    form.dataset.editId = id || "";
    if (id) {
      const d = SafeParkDB.find("drivers", id);
      qs("#driverName").value = d.full_name;
      qs("#driverPhone").value = d.phone;
      qs("#driverEmail").value = d.email || "";
      qs("#driverLicense").value = d.license_number;
      qs("#driverAddress").value = d.address || "";
      qs("#driverStatus").value = d.status;
    }
    openModal("driverModal");
  }

  qs("#driverForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = qs("#driverForm").dataset.editId;
    const payload = {
      full_name: qs("#driverName").value.trim(),
      phone: qs("#driverPhone").value.trim(),
      email: qs("#driverEmail").value.trim(),
      license_number: qs("#driverLicense").value.trim(),
      address: qs("#driverAddress").value.trim(),
      status: qs("#driverStatus").value
    };
    if (!payload.full_name || !payload.phone || !payload.license_number) {
      toast("Please fill in all required fields.", "error");
      return;
    }
    if (id) {
      SafeParkDB.update("drivers", Number(id), payload);
      toast("Driver updated successfully.");
    } else {
      SafeParkDB.insert("drivers", payload);
      toast("Driver added successfully.");
    }
    closeModal("driverModal");
    render();
  });

  render();
}

/* =========================================================
   VEHICLES PAGE
========================================================= */
function initVehicles() {
  const tbody = qs("#vehiclesTableBody");
  if (!tbody) return;

  let searchTerm = "";
  let typeFilter = "";

  function driverOptions(selectedId) {
    return SafeParkDB.get("drivers").map((d) => `<option value="${d.id}" ${d.id === selectedId ? "selected" : ""}>${escapeHtml(d.full_name)}</option>`).join("");
  }

  function render() {
    let vehicles = SafeParkDB.get("vehicles").map((v) => SafeParkDB.vehicleWithDriver(v));
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      vehicles = vehicles.filter((v) => v.plate_number.toLowerCase().includes(t) || v.driver_name.toLowerCase().includes(t) || v.brand.toLowerCase().includes(t));
    }
    if (typeFilter) vehicles = vehicles.filter((v) => v.type === typeFilter);

    tbody.innerHTML = vehicles.length ? vehicles.map((v) => `
      <tr>
        <td><strong>${escapeHtml(v.plate_number)}</strong></td>
        <td>${escapeHtml(v.brand)}</td>
        <td><span class="badge info">${escapeHtml(v.type)}</span></td>
        <td>${escapeHtml(v.color)}</td>
        <td>${escapeHtml(v.driver_name)}</td>
        <td>${formatDateTime(v.created_at).split(" · ")[0]}</td>
        <td>
          <div class="row-actions">
            <button data-edit="${v.id}" title="Edit">${iconHtml("edit", "icon-sm")}</button>
            <button data-del="${v.id}" class="del" title="Delete">${iconHtml("delete", "icon-sm")}</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="7"><div class="empty-state">${iconHtml("vehicles", "icon")}<p>No vehicles found.</p></div></td></tr>`;

    qsa("[data-edit]", tbody).forEach((btn) => btn.addEventListener("click", () => openVehicleModal(Number(btn.dataset.edit))));
    qsa("[data-del]", tbody).forEach((btn) => btn.addEventListener("click", () => {
      if (confirm("Remove this vehicle? This cannot be undone.")) {
        SafeParkDB.remove("vehicles", Number(btn.dataset.del));
        toast("Vehicle removed successfully.");
        render();
      }
    }));

    const countEl = qs("#vehiclesCount");
    if (countEl) countEl.textContent = `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""}`;
  }

  qs("#vehicleSearch")?.addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  qs("#vehicleTypeFilter")?.addEventListener("change", (e) => { typeFilter = e.target.value; render(); });
  qs("#addVehicleBtn")?.addEventListener("click", () => openVehicleModal(null));

  function openVehicleModal(id) {
    const form = qs("#vehicleForm");
    form.reset();
    qs("#vehicleModalTitle").textContent = id ? "Edit Vehicle" : "Add New Vehicle";
    form.dataset.editId = id || "";
    qs("#vehicleDriver").innerHTML = driverOptions(id ? SafeParkDB.find("vehicles", id).driver_id : null);
    if (id) {
      const v = SafeParkDB.find("vehicles", id);
      qs("#vehiclePlate").value = v.plate_number;
      qs("#vehicleBrand").value = v.brand;
      qs("#vehicleType").value = v.type;
      qs("#vehicleColor").value = v.color;
      qs("#vehicleDriver").value = v.driver_id;
    }
    openModal("vehicleModal");
  }

  qs("#vehicleForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = qs("#vehicleForm").dataset.editId;
    const payload = {
      plate_number: qs("#vehiclePlate").value.trim().toUpperCase(),
      brand: qs("#vehicleBrand").value.trim(),
      type: qs("#vehicleType").value,
      color: qs("#vehicleColor").value.trim(),
      driver_id: Number(qs("#vehicleDriver").value)
    };
    if (!payload.plate_number || !payload.brand || !payload.driver_id) {
      toast("Please fill in all required fields.", "error");
      return;
    }
    if (id) {
      SafeParkDB.update("vehicles", Number(id), payload);
      toast("Vehicle updated successfully.");
    } else {
      SafeParkDB.insert("vehicles", payload);
      toast("Vehicle added successfully.");
    }
    closeModal("vehicleModal");
    render();
  });

  render();
}

/* =========================================================
   PARKING SLOTS PAGE
========================================================= */
function initSlots() {
  const grid = qs("#slotsGrid");
  if (!grid) return;

  let zoneFilter = "";

  function render() {
    let slots = SafeParkDB.get("parking_slots");
    if (zoneFilter) slots = slots.filter((s) => s.zone === zoneFilter);

    grid.innerHTML = slots.map((s) => `
      <div class="slot-card status-${s.status}" data-slot="${s.id}">
        <div class="slot-card-top">
          <strong>${escapeHtml(s.slot_code)}</strong>
          <span class="badge ${s.status}">${s.status}</span>
        </div>
        <div class="slot-card-meta">
          <span>${escapeHtml(s.floor)}</span>
          <span>${escapeHtml(s.type)}</span>
        </div>
      </div>
    `).join("");

    const summary = qs("#slotsSummary");
    if (summary) {
      const total = slots.length;
      const occ = slots.filter((s) => s.status === "occupied").length;
      summary.textContent = `${total} slots · ${occ} occupied · ${total - occ} free`;
    }

    qsa("[data-slot]", grid).forEach((card) => card.addEventListener("click", () => openSlotModal(Number(card.dataset.slot))));
  }

  qs("#slotZoneFilter")?.addEventListener("change", (e) => { zoneFilter = e.target.value; render(); });
  qs("#addSlotBtn")?.addEventListener("click", () => openSlotModal(null));

  function openSlotModal(id) {
    const form = qs("#slotForm");
    form.reset();
    qs("#slotModalTitle").textContent = id ? "Update Slot" : "Add New Slot";
    form.dataset.editId = id || "";
    if (id) {
      const s = SafeParkDB.find("parking_slots", id);
      qs("#slotCode").value = s.slot_code;
      qs("#slotZone").value = s.zone;
      qs("#slotFloor").value = s.floor;
      qs("#slotType").value = s.type;
      qs("#slotStatus").value = s.status;
    }
    openModal("slotModal");
  }

  qs("#slotForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = qs("#slotForm").dataset.editId;
    const payload = {
      slot_code: qs("#slotCode").value.trim().toUpperCase(),
      zone: qs("#slotZone").value.trim().toUpperCase(),
      floor: qs("#slotFloor").value.trim(),
      type: qs("#slotType").value,
      status: qs("#slotStatus").value
    };
    if (!payload.slot_code || !payload.zone) {
      toast("Please fill in all required fields.", "error");
      return;
    }
    if (id) {
      SafeParkDB.update("parking_slots", Number(id), payload);
      toast("Slot updated successfully.");
    } else {
      SafeParkDB.insert("parking_slots", payload);
      toast("Slot added successfully.");
    }
    closeModal("slotModal");
    render();
  });

  render();
}

/* =========================================================
   PARKING RECORDS PAGE (Entry / Exit)
========================================================= */
function initRecords() {
  const tbody = qs("#recordsTableBody");
  if (!tbody) return;

  const RATE_PER_HOUR = 1.5;
  let statusFilter = "";
  let searchTerm = "";

  function render() {
    let records = SafeParkDB.get("parking_records").slice().sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time)).map((r) => SafeParkDB.recordDetailed(r));
    if (statusFilter) records = records.filter((r) => r.status === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      records = records.filter((r) => r.plate_number.toLowerCase().includes(t) || r.driver_name.toLowerCase().includes(t));
    }

    tbody.innerHTML = records.length ? records.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.plate_number)}</strong><br><span class="text-muted" style="font-size:11.5px">${escapeHtml(r.driver_name)}</span></td>
        <td>${escapeHtml(r.slot_code)}</td>
        <td>${formatDateTime(r.entry_time)}</td>
        <td>${r.exit_time ? formatDateTime(r.exit_time) : "—"}</td>
        <td>${durationBetween(r.entry_time, r.exit_time)}</td>
        <td>${r.fee !== null && r.fee !== undefined ? "$" + Number(r.fee).toFixed(2) : "—"}</td>
        <td><span class="badge ${r.status}">${r.status === "parked" ? "Parked" : "Completed"}</span></td>
        <td>
          <div class="row-actions">
            ${r.status === "parked" ? `<button data-checkout="${r.id}" title="Check out">${iconHtml("check", "icon-sm")}</button>` : ""}
            <button data-del="${r.id}" class="del" title="Delete record">${iconHtml("delete", "icon-sm")}</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="8"><div class="empty-state">${iconHtml("records", "icon")}<p>No parking records found.</p></div></td></tr>`;

    qsa("[data-checkout]", tbody).forEach((btn) => btn.addEventListener("click", () => checkout(Number(btn.dataset.checkout))));
    qsa("[data-del]", tbody).forEach((btn) => btn.addEventListener("click", () => {
      if (confirm("Delete this record permanently?")) {
        SafeParkDB.remove("parking_records", Number(btn.dataset.del));
        toast("Record deleted.");
        render();
      }
    }));

    const countEl = qs("#recordsCount");
    if (countEl) countEl.textContent = `${records.length} record${records.length !== 1 ? "s" : ""}`;
  }

  function checkout(id) {
    const record = SafeParkDB.find("parking_records", id);
    if (!record) return;
    const exitTime = new Date().toISOString();
    const durationHrs = (new Date(exitTime) - new Date(record.entry_time)) / 3600000;
    const fee = Math.max(1, Math.round(durationHrs * RATE_PER_HOUR * 10) / 10);

    SafeParkDB.update("parking_records", id, { exit_time: exitTime, status: "completed", fee });
    SafeParkDB.update("parking_slots", record.slot_id, { status: "available" });
    SafeParkDB.insert("payments", { record_id: id, amount: fee, method: "Cash", status: "paid", paid_at: exitTime });

    toast(`Vehicle checked out. Fee: $${fee.toFixed(2)}`);
    render();
  }

  qs("#recordSearch")?.addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  qs("#recordStatusFilter")?.addEventListener("change", (e) => { statusFilter = e.target.value; render(); });
  qs("#addRecordBtn")?.addEventListener("click", () => openEntryModal());

  function openEntryModal() {
    const form = qs("#recordForm");
    form.reset();

    const vehicles = SafeParkDB.get("vehicles").map((v) => SafeParkDB.vehicleWithDriver(v));
    qs("#recordVehicle").innerHTML = vehicles.map((v) => `<option value="${v.id}">${escapeHtml(v.plate_number)} — ${escapeHtml(v.driver_name)}</option>`).join("");

    const freeSlots = SafeParkDB.get("parking_slots").filter((s) => s.status === "available");
    qs("#recordSlot").innerHTML = freeSlots.length
      ? freeSlots.map((s) => `<option value="${s.id}">${escapeHtml(s.slot_code)} (${escapeHtml(s.floor)})</option>`).join("")
      : `<option value="">No slots available</option>`;

    openModal("recordModal");
  }

  qs("#recordForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const vehicleId = Number(qs("#recordVehicle").value);
    const slotId = Number(qs("#recordSlot").value);
    if (!vehicleId || !slotId) {
      toast("Please select a vehicle and an available slot.", "error");
      return;
    }
    const entry = {
      vehicle_id: vehicleId,
      slot_id: slotId,
      entry_time: new Date().toISOString(),
      exit_time: null,
      status: "parked",
      fee: null
    };
    SafeParkDB.insert("parking_records", entry);
    SafeParkDB.update("parking_slots", slotId, { status: "occupied" });
    toast("Vehicle checked in successfully.");
    closeModal("recordModal");
    render();
  });

  render();
}

/* =========================================================
   REPORTS PAGE
========================================================= */
function initReports() {
  const host = qs("#reportsBarChart");
  if (!host) return;

  const records = SafeParkDB.get("parking_records");
  const payments = SafeParkDB.get("payments");
  const s = SafeParkDB.stats();

  // KPI row
  qs("#reportKpis").innerHTML = `
    <div class="stat-card"><div class="stat-top"><div class="stat-icon blue">${iconHtml("records")}</div></div><h3>${records.length}</h3><span class="label">Total Parking Sessions</span></div>
    <div class="stat-card"><div class="stat-top"><div class="stat-icon green">${iconHtml("money")}</div></div><h3>$${s.totalRevenue.toFixed(2)}</h3><span class="label">Total Revenue</span></div>
    <div class="stat-card"><div class="stat-top"><div class="stat-icon amber">${iconHtml("clock")}</div></div><h3>${s.activeRecords}</h3><span class="label">Currently Parked</span></div>
    <div class="stat-card"><div class="stat-top"><div class="stat-icon navy">${iconHtml("slots")}</div></div><h3>${s.occupancyRate}%</h3><span class="label">Avg. Occupancy</span></div>
  `;

  // Weekly revenue bar chart (deterministic pseudo-data derived from actual payments total, for demo)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const totalRev = Math.max(10, s.totalRevenue);
  host.innerHTML = days.map((d, i) => {
    const share = Math.abs(Math.sin(i * 1.7 + totalRev)) * 0.6 + 0.4;
    const revenueHeight = Math.min(100, Math.max(15, Math.round(share * 90)));
    const occupancyHeight = Math.min(100, Math.max(10, Math.round(share * 60)));
    return `
      <div class="col">
        <div class="stack" style="height:150px">
          <div style="height:${revenueHeight}%; background:#3d8bff;"></div>
        </div>
        <span>${d}</span>
      </div>
    `;
  }).join("");

  // Vehicle type distribution
  const types = {};
  SafeParkDB.get("vehicles").forEach((v) => { types[v.type] = (types[v.type] || 0) + 1; });
  const typeHost = qs("#vehicleTypeChart");
  if (typeHost) {
    const colors = ["#3d8bff", "#1fa37b", "#e8a33d", "#e2564f", "#123a68"];
    const entries = Object.entries(types);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    typeHost.innerHTML = entries.map(([type, count], i) => `
      <div class="col">
        <div class="stack" style="height:150px">
          <div style="height:${Math.round((count / max) * 100)}%; background:${colors[i % colors.length]};"></div>
        </div>
        <span>${escapeHtml(type)}</span>
      </div>
    `).join("");
  }

  // Recent payments table
  const payTbody = qs("#paymentsTableBody");
  if (payTbody) {
    const detailed = payments.slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((p) => SafeParkDB.paymentDetailed(p));
    payTbody.innerHTML = detailed.length ? detailed.map((p) => `
      <tr>
        <td>#PAY-${String(p.id).padStart(4, "0")}</td>
        <td>${escapeHtml(p.plate_number)}</td>
        <td>${escapeHtml(p.slot_code)}</td>
        <td>$${Number(p.amount).toFixed(2)}</td>
        <td>${escapeHtml(p.method)}</td>
        <td><span class="badge paid">${p.status}</span></td>
        <td>${formatDateTime(p.paid_at)}</td>
      </tr>
    `).join("") : `<tr><td colspan="7"><div class="empty-state">No payments recorded yet.</div></td></tr>`;
  }

  qs("#exportReportBtn")?.addEventListener("click", () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows = [];

    rows.push(["SafePark — Parking Report"]);
    rows.push(["Generated on", formatDateTime(new Date().toISOString())]);
    rows.push([]);

    rows.push(["Summary"]);
    rows.push(["Total Parking Sessions", records.length]);
    rows.push(["Total Revenue ($)", s.totalRevenue.toFixed(2)]);
    rows.push(["Currently Parked", s.activeRecords]);
    rows.push(["Average Occupancy (%)", s.occupancyRate]);
    rows.push([]);

    rows.push(["Parking Records"]);
    rows.push(["Plate Number", "Driver", "Slot", "Entry Time", "Exit Time", "Duration", "Fee ($)", "Status"]);
    records.map((r) => SafeParkDB.recordDetailed(r)).forEach((r) => {
      rows.push([
        r.plate_number, r.driver_name, r.slot_code,
        formatDateTime(r.entry_time), r.exit_time ? formatDateTime(r.exit_time) : "—",
        durationBetween(r.entry_time, r.exit_time),
        r.fee !== null && r.fee !== undefined ? Number(r.fee).toFixed(2) : "—",
        r.status
      ]);
    });
    rows.push([]);

    rows.push(["Payments"]);
    rows.push(["Payment ID", "Plate Number", "Slot", "Amount ($)", "Method", "Status", "Paid At"]);
    payments.slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((p) => SafeParkDB.paymentDetailed(p)).forEach((p) => {
      rows.push([
        "PAY-" + String(p.id).padStart(4, "0"), p.plate_number, p.slot_code,
        Number(p.amount).toFixed(2), p.method, p.status, formatDateTime(p.paid_at)
      ]);
    });

    downloadCSV(`safepark-report-${dateStr}.csv`, rows);
    toast("Report downloaded successfully.");
  });
}

/* =========================================================
   PAYMENTS PAGE
========================================================= */
function initPayments() {
  const tbody = qs("#paymentsPageTableBody");
  if (!tbody) return;

  let searchTerm = "";
  let statusFilter = "";
  let methodFilter = "";

  function renderStats() {
    const s = SafeParkDB.paymentsStats();
    qs("#paymentsStatsGrid").innerHTML = `
      <div class="stat-card">
        <div class="stat-top"><div class="stat-icon green">${iconHtml("money")}</div></div>
        <h3>$${s.totalPaid.toFixed(2)}</h3><span class="label">Total Collected</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><div class="stat-icon amber">${iconHtml("clock")}</div></div>
        <h3>$${s.totalPending.toFixed(2)}</h3><span class="label">Pending Payments</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><div class="stat-icon blue">${iconHtml("check")}</div></div>
        <h3>${s.paidCount}</h3><span class="label">Paid Transactions</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><div class="stat-icon navy">${iconHtml("reports")}</div></div>
        <h3>$${s.avgTransaction.toFixed(2)}</h3><span class="label">Average Transaction</span>
      </div>
    `;
  }

  function render() {
    renderStats();
    let payments = SafeParkDB.get("payments").slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((p) => SafeParkDB.paymentDetailed(p));
    if (statusFilter) payments = payments.filter((p) => p.status === statusFilter);
    if (methodFilter) payments = payments.filter((p) => p.method === methodFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      payments = payments.filter((p) => (p.plate_number || "").toLowerCase().includes(t) || (p.driver_name || "").toLowerCase().includes(t));
    }

    tbody.innerHTML = payments.length ? payments.map((p) => `
      <tr>
        <td><strong>#PAY-${String(p.id).padStart(4, "0")}</strong></td>
        <td>${escapeHtml(p.plate_number || "—")}<br><span class="text-muted" style="font-size:11.5px">${escapeHtml(p.driver_name || "")}</span></td>
        <td>${escapeHtml(p.slot_code || "—")}</td>
        <td>$${Number(p.amount).toFixed(2)}</td>
        <td>${escapeHtml(p.method)}</td>
        <td><span class="badge ${p.status}">${p.status}</span></td>
        <td>${formatDateTime(p.paid_at)}</td>
        <td>
          <div class="row-actions">
            ${p.status === "pending" ? `<button data-mark-paid="${p.id}" title="Mark as paid">${iconHtml("check", "icon-sm")}</button>` : ""}
            <button data-del="${p.id}" class="del" title="Delete">${iconHtml("delete", "icon-sm")}</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="8"><div class="empty-state">${iconHtml("records", "icon")}<p>No payments found.</p></div></td></tr>`;

    qsa("[data-mark-paid]", tbody).forEach((btn) => btn.addEventListener("click", () => {
      SafeParkDB.update("payments", Number(btn.dataset.markPaid), { status: "paid", paid_at: new Date().toISOString() });
      toast("Payment marked as paid.");
      render();
    }));
    qsa("[data-del]", tbody).forEach((btn) => btn.addEventListener("click", () => {
      if (confirm("Delete this payment record permanently?")) {
        SafeParkDB.remove("payments", Number(btn.dataset.del));
        toast("Payment deleted.");
        render();
      }
    }));

    const countEl = qs("#paymentsCount");
    if (countEl) countEl.textContent = `${payments.length} payment${payments.length !== 1 ? "s" : ""}`;
  }

  qs("#paymentSearch")?.addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  qs("#paymentStatusFilter")?.addEventListener("change", (e) => { statusFilter = e.target.value; render(); });
  qs("#paymentMethodFilter")?.addEventListener("change", (e) => { methodFilter = e.target.value; render(); });
  qs("#addPaymentBtn")?.addEventListener("click", () => openPaymentModal());

  function openPaymentModal() {
    const form = qs("#paymentForm");
    form.reset();

    const completedRecords = SafeParkDB.get("parking_records").filter((r) => r.status === "completed").map((r) => SafeParkDB.recordDetailed(r));
    qs("#paymentRecord").innerHTML = completedRecords.length
      ? completedRecords.map((r) => `<option value="${r.id}">${escapeHtml(r.plate_number)} — Slot ${escapeHtml(r.slot_code)} ($${Number(r.fee || 0).toFixed(2)})</option>`).join("")
      : `<option value="">No completed sessions available</option>`;

    openModal("paymentModal");
  }

  qs("#paymentForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const recordId = Number(qs("#paymentRecord").value);
    const method = qs("#paymentMethod").value;
    const status = qs("#paymentStatus").value;
    if (!recordId) {
      toast("Please select a completed parking session.", "error");
      return;
    }
    const record = SafeParkDB.find("parking_records", recordId);
    const amount = Number(qs("#paymentAmount").value) || Number(record?.fee) || 0;

    SafeParkDB.insert("payments", {
      record_id: recordId,
      amount,
      method,
      status,
      paid_at: new Date().toISOString()
    });
    toast("Payment recorded successfully.");
    closeModal("paymentModal");
    render();
  });

  render();
}

/* =========================================================
   SETTINGS PAGE
========================================================= */
function initSettings() {
  const tabs = qsa(".settings-tabs button");
  if (!tabs.length) return;

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      qsa(".settings-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      qs("#" + btn.dataset.tab).classList.add("active");
    });
  });

  // populate profile form with current user
  const user = SafeParkAuth.currentUser();
  if (user) {
    if (qs("#settingsName")) qs("#settingsName").value = user.name;
    if (qs("#settingsEmail")) qs("#settingsEmail").value = user.email;
  }

  qs("#profileForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    toast("Profile updated successfully.");
  });

  qs("#passwordForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    toast("Password changed successfully.");
    e.target.reset();
  });

  // toggle switches
  qsa(".switch").forEach((sw) => {
    sw.addEventListener("click", () => sw.classList.toggle("on"));
  });

  qs("#resetDataBtn")?.addEventListener("click", () => {
    if (confirm("This will reset all demo data (drivers, vehicles, slots, records) to the default sample set. Continue?")) {
      SafeParkDB.reset();
      toast("Demo data has been reset.");
    }
  });
}

/* =========================================================
   LOGOUT PAGE
========================================================= */
function initLogoutPage() {
  const btn = qs("#confirmLogoutBtn");
  if (!btn) return;
  SafeParkAuth.logout();
  btn.addEventListener("click", () => { window.location.href = "index.php"; });
  qs("#cancelLogoutBtn")?.addEventListener("click", () => { window.location.href = "dashboard.html"; });
}

/* =========================================================
   BOOTSTRAP
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "login") { initLoginPage(); return; }
  if (page === "register") { initRegisterPage(); return; }
  if (page === "logout") { initLogoutPage(); return; }

  // every other page is protected
  SafeParkAuth.guard();
  initShell();
  bindModalDismiss();

  switch (page) {
    case "dashboard": initDashboard(); break;
    case "drivers": initDrivers(); break;
    case "vehicles": initVehicles(); break;
    case "slots": initSlots(); break;
    case "records": initRecords(); break;
    case "payments": initPayments(); break;
    case "reports": initReports(); break;
    case "settings": initSettings(); break;
  }
});
