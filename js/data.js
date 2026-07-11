/* =========================================================
   SafePark — data.js
   Client-side data layer.
   Mirrors the MySQL schema (users, drivers, vehicles,
   parking_slots, parking_records, payments) using
   localStorage so the whole UI is demonstrable without a
   live PHP/MySQL server. config/db.php + database/safepark_db.sql
   contain the real schema for production deployment.
========================================================= */

const DB_KEY = "safepark_db_v1";

/* ---------- Seed data (used only the first time the app runs) ---------- */
function seedDatabase() {
  const now = Date.now();
  const hrs = (h) => new Date(now - h * 3600 * 1000).toISOString();

  const data = {
    users: [
      { id: 1, name: "Admin User", email: "admin@safepark.com", password: "admin123", role: "Administrator", created_at: hrs(720) }
    ],
    drivers: [
      { id: 1, full_name: "Ahmed Hassan",     phone: "0611223344", email: "ahmed.hassan@mail.com",  license_number: "DL-10234", address: "Hargeisa, Somaliland", status: "active",   created_at: hrs(600) },
      { id: 2, full_name: "Farah Abdi",       phone: "0629988776", email: "farah.abdi@mail.com",    license_number: "DL-10399", address: "Hargeisa, Somaliland", status: "active",   created_at: hrs(540) },
      { id: 3, full_name: "Ikram Warsame",    phone: "0634455667", email: "ikram.warsame@mail.com",  license_number: "DL-11021", address: "Burao, Somaliland",    status: "active",   created_at: hrs(480) },
      { id: 4, full_name: "Cabdi Rashiid",    phone: "0655221199", email: "cabdi.rashiid@mail.com",  license_number: "DL-11288", address: "Berbera, Somaliland",  status: "inactive", created_at: hrs(400) },
      { id: 5, full_name: "Nasra Xasan",      phone: "0611998877", email: "nasra.xasan@mail.com",    license_number: "DL-11733", address: "Hargeisa, Somaliland", status: "active",   created_at: hrs(300) },
      { id: 6, full_name: "Yusuf Cali",       phone: "0625566334", email: "yusuf.cali@mail.com",     license_number: "DL-12045", address: "Hargeisa, Somaliland", status: "active",   created_at: hrs(200) }
    ],
    vehicles: [
      { id: 1, driver_id: 1, plate_number: "SL-1042-A", type: "Car",   brand: "Toyota Corolla", color: "White",  created_at: hrs(600) },
      { id: 2, driver_id: 2, plate_number: "SL-2871-B", type: "Car",   brand: "Hyundai Accent", color: "Silver", created_at: hrs(540) },
      { id: 3, driver_id: 3, plate_number: "SL-3390-C", type: "SUV",   brand: "Toyota RAV4",    color: "Black",  created_at: hrs(480) },
      { id: 4, driver_id: 4, plate_number: "SL-4021-D", type: "Van",   brand: "Toyota Hiace",   color: "White",  created_at: hrs(400) },
      { id: 5, driver_id: 5, plate_number: "SL-5510-E", type: "Bike",  brand: "Honda CB",       color: "Red",    created_at: hrs(300) },
      { id: 6, driver_id: 6, plate_number: "SL-6684-F", type: "Car",   brand: "Kia Sportage",   color: "Blue",   created_at: hrs(200) },
      { id: 7, driver_id: 1, plate_number: "SL-7742-G", type: "Truck", brand: "Isuzu NPR",      color: "White",  created_at: hrs(150) }
    ],
    parking_slots: (() => {
      const zones = ["A", "B", "C", "D"];
      const slots = [];
      let id = 1;
      zones.forEach((z, zi) => {
        for (let i = 1; i <= 6; i++) {
          slots.push({
            id: id,
            slot_code: `${z}-${String(i).padStart(2, "0")}`,
            zone: z,
            floor: zi < 2 ? "Ground Floor" : "Level 1",
            type: i % 5 === 0 ? "Reserved" : (i % 4 === 0 ? "Bike" : "Standard"),
            status: "available"
          });
          id++;
        }
      });
      return slots;
    })(),
    parking_records: [],
    payments: []
  };

  // Occupy a handful of slots with active + past parking records
  const occupy = [
    { slotIdx: 0, vehicle_id: 1, hoursAgoIn: 3, out: null },
    { slotIdx: 5, vehicle_id: 3, hoursAgoIn: 1.5, out: null },
    { slotIdx: 9, vehicle_id: 6, hoursAgoIn: 0.5, out: null },
    { slotIdx: 2, vehicle_id: 2, hoursAgoIn: 30, out: 27 },
    { slotIdx: 3, vehicle_id: 5, hoursAgoIn: 50, out: 48 },
    { slotIdx: 7, vehicle_id: 4, hoursAgoIn: 75, out: 72 },
    { slotIdx: 11, vehicle_id: 7, hoursAgoIn: 100, out: 96 }
  ];

  let recId = 1, payId = 1;
  occupy.forEach((o) => {
    const slot = data.parking_slots[o.slotIdx];
    const entry = hrs(o.hoursAgoIn);
    const exit = o.out !== null ? hrs(o.out) : null;
    const rate = 1.5; // $ per hour, used for fee calc
    const durationHrs = o.out !== null ? (o.hoursAgoIn - o.out) : null;
    const fee = durationHrs !== null ? Math.max(1, Math.round(durationHrs * rate * 10) / 10) : null;

    data.parking_records.push({
      id: recId,
      vehicle_id: o.vehicle_id,
      slot_id: slot.id,
      entry_time: entry,
      exit_time: exit,
      status: exit ? "completed" : "parked",
      fee: fee
    });

    if (exit) {
      data.payments.push({
        id: payId,
        record_id: recId,
        amount: fee,
        method: payId % 2 === 0 ? "Cash" : "Mobile Money",
        status: "paid",
        paid_at: exit
      });
      payId++;
    } else {
      slot.status = "occupied";
    }
    recId++;
  });

  // one reserved slot for variety
  data.parking_slots[16].status = "reserved";
  data.parking_slots[20].status = "maintenance";

  localStorage.setItem(DB_KEY, JSON.stringify(data));
  return data;
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return seedDatabase();
  try {
    return JSON.parse(raw);
  } catch (e) {
    return seedDatabase();
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(list) {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

/* ---------- Public data API (mimics simple REST/DB calls) ---------- */
const SafeParkDB = {
  reset() { return seedDatabase(); },
  all() { return loadDB(); },

  // Generic helpers
  get(table) { return loadDB()[table] || []; },
  find(table, id) { return this.get(table).find((r) => r.id === Number(id)); },

  insert(table, record) {
    const db = loadDB();
    record.id = nextId(db[table]);
    record.created_at = record.created_at || new Date().toISOString();
    db[table].push(record);
    saveDB(db);
    return record;
  },

  update(table, id, patch) {
    const db = loadDB();
    const idx = db[table].findIndex((r) => r.id === Number(id));
    if (idx === -1) return null;
    db[table][idx] = { ...db[table][idx], ...patch };
    saveDB(db);
    return db[table][idx];
  },

  remove(table, id) {
    const db = loadDB();
    db[table] = db[table].filter((r) => r.id !== Number(id));
    saveDB(db);
    return true;
  },

  /* ---------- Joined / computed views ---------- */
  driverWithVehicleCount(driver) {
    const count = this.get("vehicles").filter((v) => v.driver_id === driver.id).length;
    return { ...driver, vehicle_count: count };
  },

  vehicleWithDriver(vehicle) {
    const driver = this.find("drivers", vehicle.driver_id);
    return { ...vehicle, driver_name: driver ? driver.full_name : "Unknown" };
  },

  recordDetailed(record) {
    const vehicle = this.find("vehicles", record.vehicle_id);
    const driver = vehicle ? this.find("drivers", vehicle.driver_id) : null;
    const slot = this.find("parking_slots", record.slot_id);
    return {
      ...record,
      plate_number: vehicle ? vehicle.plate_number : "—",
      vehicle_type: vehicle ? vehicle.type : "—",
      driver_name: driver ? driver.full_name : "—",
      slot_code: slot ? slot.slot_code : "—"
    };
  },

  paymentDetailed(payment) {
    const record = this.find("parking_records", payment.record_id);
    const detail = record ? this.recordDetailed(record) : {};
    // payment's own fields (id, amount, method, status, paid_at) must win
    // over the joined record's fields (e.g. record.status vs payment.status)
    return { ...detail, ...payment };
  },

  /* ---------- Dashboard stats ---------- */
  stats() {
    const slots = this.get("parking_slots");
    const records = this.get("parking_records");
    const drivers = this.get("drivers");
    const vehicles = this.get("vehicles");
    const payments = this.get("payments");

    const totalSlots = slots.length;
    const occupied = slots.filter((s) => s.status === "occupied").length;
    const available = slots.filter((s) => s.status === "available").length;
    const reserved = slots.filter((s) => s.status === "reserved").length;
    const maintenance = slots.filter((s) => s.status === "maintenance").length;

    const activeRecords = records.filter((r) => r.status === "parked").length;
    const todayRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalSlots, occupied, available, reserved, maintenance,
      occupancyRate: totalSlots ? Math.round((occupied / totalSlots) * 100) : 0,
      totalDrivers: drivers.length,
      totalVehicles: vehicles.length,
      activeRecords,
      totalRevenue: Math.round(todayRevenue * 100) / 100
    };
  },

  /* ---------- Payments page stats ---------- */
  paymentsStats() {
    const payments = this.get("payments");
    const paid = payments.filter((p) => p.status === "paid");
    const pending = payments.filter((p) => p.status === "pending");
    const totalPaid = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      count: payments.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      avgTransaction: paid.length ? Math.round((totalPaid / paid.length) * 100) / 100 : 0
    };
  }
};

/* ---------- Simple auth layer (demo only — no PHP business logic) ---------- */
const SafeParkAuth = {
  SESSION_KEY: "safepark_session",

  login(email, password) {
    const db = loadDB();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
    if (!user) return false;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
    return true;
  },

  emailExists(email) {
    const db = loadDB();
    return db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
  },

  /**
   * Register a new admin/staff account.
   * Returns { ok: true } on success or { ok: false, message } on failure.
   * (Demo-only: passwords are stored as plain text in localStorage. A real
   * deployment must hash passwords server-side, e.g. with password_hash().)
   */
  register(name, email, password, role = "Staff") {
    name = String(name || "").trim();
    email = String(email || "").trim();

    if (!name || !email || !password) {
      return { ok: false, message: "Please fill in all required fields." };
    }
    if (password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters long." };
    }
    if (this.emailExists(email)) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const user = SafeParkDB.insert("users", { name, email, password, role, status: "active" });
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
    return { ok: true };
  },

  currentUser() {
    const raw = sessionStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() { return !!this.currentUser(); },

  logout() { sessionStorage.removeItem(this.SESSION_KEY); },

  /* Redirect guard used on every protected page */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = "index.php";
    }
  }
};

// Ensure DB exists on first load of any page
loadDB();
