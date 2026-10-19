const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const fb = require('./firebase');

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const SOURCE_DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const DB_PATH = isVercel ? path.join('/tmp', 'kicktotech-db.json') : SOURCE_DB_PATH;

const INITIAL_POSITIONS = [
  "Social Media",
  "✍️ Content Creation",
  "💻 Web Team",
  "⚙️ Technical Team",
  "🤝 Partnership & Collaboration",
  "🎨 Graphic / Poster Designer",
  "🎬 Video Editor",
  "🎤 Event Management (Manager & Team)"
];

const DEFAULT_SUPERADMIN = 'parabluv25@gmail.com';
const DEFAULT_PASSCODE = 'admin19oct';

const DEFAULT_DATA = {
  admins: [
    {
      email: DEFAULT_SUPERADMIN,
      role: 'Super Admin',
      addedAt: new Date().toISOString(),
      addedBy: 'System',
      isPrimary: true
    }
  ],
  adminSettings: {
    masterPasscodeHash: bcrypt.hashSync(DEFAULT_PASSCODE, 10)
  },
  applications: []
};

// Initialize DB file and migrate plaintext passcodes to bcrypt hashes
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    let initialData = DEFAULT_DATA;
    if (fs.existsSync(SOURCE_DB_PATH)) {
      try {
        initialData = JSON.parse(fs.readFileSync(SOURCE_DB_PATH, 'utf8'));
      } catch (err) {
        initialData = DEFAULT_DATA;
      }
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      let needsSave = false;

      // 1. Ensure parabluv25@gmail.com is present
      const hasSuper = data.admins && data.admins.some(a => a.email.toLowerCase() === DEFAULT_SUPERADMIN.toLowerCase());
      if (!hasSuper) {
        data.admins = data.admins || [];
        data.admins.unshift({
          email: DEFAULT_SUPERADMIN,
          role: 'Super Admin',
          addedAt: new Date().toISOString(),
          addedBy: 'System',
          isPrimary: true
        });
        needsSave = true;
      }

      // 2. Security Migration: Migrate plaintext passcode to bcrypt hash
      data.adminSettings = data.adminSettings || {};
      if (data.adminSettings.masterPasscode && !data.adminSettings.masterPasscodeHash) {
        console.log('[SECURITY] Migrating plaintext admin passcode to bcrypt hash...');
        data.adminSettings.masterPasscodeHash = bcrypt.hashSync(data.adminSettings.masterPasscode, 10);
        delete data.adminSettings.masterPasscode;
        needsSave = true;
      } else if (!data.adminSettings.masterPasscodeHash) {
        data.adminSettings.masterPasscodeHash = bcrypt.hashSync(DEFAULT_PASSCODE, 10);
        needsSave = true;
      }

      if (needsSave) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Error verifying DB contents, reinitializing', e);
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    }
  }
}

initDb();

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading DB file, returning fallback:', err);
    return DEFAULT_DATA;
  }
}

function writeDb(data) {
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, DB_PATH);
}

// Background sync to Firestore
async function syncApplicationToFirestore(app) {
  try {
    if (!fb.firestoreDb) return;
    const docRef = fb.doc(fb.firestoreDb, 'applications', app.id);
    await fb.setDoc(docRef, app, { merge: true });
    console.log(`[FIREBASE] Synced application ${app.id} (${app.name}) to Firestore`);
  } catch (err) {
    console.error(`[FIREBASE] Failed syncing application ${app.id} to Firestore:`, err.message);
  }
}

async function removeApplicationFromFirestore(id) {
  try {
    if (!fb.firestoreDb) return;
    const docRef = fb.doc(fb.firestoreDb, 'applications', id);
    try {
      await fb.deleteDoc(docRef);
      console.log(`[FIREBASE] Hard-deleted application ${id} from Firestore`);
    } catch (permErr) {
      // If Firestore security rules restrict hard delete, use soft delete flag
      await fb.setDoc(docRef, { _deleted: true, deletedAt: new Date().toISOString() }, { merge: true });
      console.log(`[FIREBASE] Soft-deleted application ${id} from Firestore (deleteDoc permission fallback)`);
    }
  } catch (err) {
    console.error(`[FIREBASE] Failed removing application ${id} from Firestore:`, err.message);
  }
}

async function syncAdminToFirestore(admin) {
  try {
    if (!fb.firestoreDb) return;
    const docRef = fb.doc(fb.firestoreDb, 'admins', admin.email.replace(/[.@]/g, '_'));
    await fb.setDoc(docRef, admin, { merge: true });
    console.log(`[FIREBASE] Synced admin ${admin.email} to Firestore`);
  } catch (err) {
    console.error(`[FIREBASE] Failed syncing admin ${admin.email} to Firestore:`, err.message);
  }
}

// Initial pull from Firestore on startup if Firestore has applications
async function syncFromFirestore() {
  try {
    if (!fb.firestoreDb) return;
    const colRef = fb.collection(fb.firestoreDb, 'applications');
    const snapshot = await fb.getDocs(colRef);
    if (!snapshot.empty) {
      const data = readDb();
      const firestoreApps = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        if (item && item.id && !item._deleted) {
          firestoreApps.push(item);
        }
      });
      // Sort newest first
      firestoreApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      data.applications = firestoreApps;
      writeDb(data);
      console.log(`[FIREBASE] Synced ${firestoreApps.length} applications from Firestore into memory cache.`);
    }
  } catch (err) {
    console.error('[FIREBASE] Error in syncFromFirestore:', err.message);
  }
}

// Trigger initial sync in background
setTimeout(() => {
  syncFromFirestore();
}, 2000);

// Admins operations
function getAdmins() {
  const data = readDb();
  return (data.admins || []).map(a => ({
    email: a.email,
    role: a.role,
    addedAt: a.addedAt,
    addedBy: a.addedBy,
    isPrimary: a.isPrimary
  }));
}

function isAuthorizedAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAdmins();
  return admins.some(a => a.email.trim().toLowerCase() === normalized);
}

function addAuthorizedAdmin({ email, role = 'Admin', addedBy = 'parabluv25@gmail.com' }) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 100) {
    throw new Error('Invalid email address format');
  }

  const normalized = email.trim().toLowerCase();
  const data = readDb();
  data.admins = data.admins || [];
  
  const existing = data.admins.find(a => a.email.trim().toLowerCase() === normalized);
  if (existing) {
    throw new Error('Email is already authorized as an admin');
  }

  const sanitizedRole = String(role).replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 30);

  const newAdmin = {
    email: normalized,
    role: sanitizedRole,
    addedAt: new Date().toISOString(),
    addedBy: addedBy.slice(0, 100),
    isPrimary: false
  };

  data.admins.push(newAdmin);
  writeDb(data);
  syncAdminToFirestore(newAdmin);
  return newAdmin;
}

function removeAuthorizedAdmin(email, requesterEmail) {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEFAULT_SUPERADMIN.toLowerCase()) {
    throw new Error('Cannot remove the primary Super Admin account (parabluv25@gmail.com)');
  }
  
  const data = readDb();
  const initialCount = data.admins.length;
  data.admins = data.admins.filter(a => a.email.trim().toLowerCase() !== normalized);

  if (data.admins.length === initialCount) {
    throw new Error('Admin email not found in authorized list');
  }

  writeDb(data);
  return { success: true, removed: normalized };
}

// Secure Passcode Verification with bcrypt
function verifyAdminPasscode(inputPasscode) {
  if (!inputPasscode || typeof inputPasscode !== 'string') return false;
  const data = readDb();
  const hash = data.adminSettings && data.adminSettings.masterPasscodeHash;
  if (!hash) {
    // Fallback if not yet initialized
    return inputPasscode === DEFAULT_PASSCODE;
  }
  return bcrypt.compareSync(inputPasscode, hash);
}

function updateAdminPasscode(newPasscode) {
  if (!newPasscode || typeof newPasscode !== 'string' || newPasscode.length < 6) {
    throw new Error('Passcode must be at least 6 characters long');
  }
  if (newPasscode.length > 128) {
    throw new Error('Passcode is too long');
  }
  const data = readDb();
  data.adminSettings = data.adminSettings || {};
  data.adminSettings.masterPasscodeHash = bcrypt.hashSync(newPasscode, 10);
  delete data.adminSettings.masterPasscode; // Ensure plaintext is removed
  writeDb(data);
  return true;
}

// Applications operations
function getApplications(filters = {}) {
  const data = readDb();
  let apps = [...(data.applications || [])];

  // Filter by post
  if (filters.post && filters.post !== 'All') {
    apps = apps.filter(a => a.post === filters.post);
  }

  // Filter by status
  if (filters.status && filters.status !== 'All') {
    apps = apps.filter(a => a.status === filters.status);
  }

  // Filter by college
  if (filters.college && filters.college !== 'All') {
    apps = apps.filter(a => a.college && a.college.toLowerCase().includes(filters.college.toLowerCase()));
  }

  // Search query (sanitized regex-free search)
  if (filters.search && typeof filters.search === 'string') {
    const q = filters.search.toLowerCase().trim().slice(0, 100);
    apps = apps.filter(a => 
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.gmail && a.gmail.toLowerCase().includes(q)) ||
      (a.contact && a.contact.includes(q)) ||
      (a.college && a.college.toLowerCase().includes(q)) ||
      (a.program && a.program.toLowerCase().includes(q)) ||
      (a.skills && a.skills.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (filters.sortBy === 'name') {
    apps.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sortBy === 'rating') {
    apps.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (filters.sortBy === 'oldest') {
    apps.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    // Default: newest first
    apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return apps;
}

function getApplicationById(id) {
  const data = readDb();
  return (data.applications || []).find(a => a.id === id);
}

// Sanitization helper
function cleanText(str, maxLen = 200) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\0/g, '').trim().slice(0, maxLen);
}

function cleanUrl(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  // Strictly only allow http:// or https:// schemes
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.slice(0, 300);
  }
  return '';
}

async function addApplication(appData) {
  const data = readDb();
  data.applications = data.applications || [];

  const timestamp = Date.now().toString().slice(-4);
  const count = data.applications.length + 1;
  const padCount = String(count).padStart(3, '0');
  const id = `APP-1019-${padCount}-${timestamp}`;

  const newApp = {
    id,
    name: cleanText(appData.name, 100),
    college: cleanText(appData.college, 150),
    program: cleanText(appData.program, 100),
    yearClass: cleanText(appData.yearClass, 50),
    contact: appData.contact.replace(/\D/g, '').slice(0, 15),
    gmail: cleanText(appData.gmail, 100).toLowerCase(),
    post: cleanText(appData.post, 100),
    reason: cleanText(appData.reason, 3000),
    portfolio: cleanUrl(appData.portfolio),
    skills: cleanText(appData.skills, 250),
    availability: cleanText(appData.availability || 'Available on 19th Oct Monday', 150),
    status: 'Pending',
    rating: 0,
    notes: '',
    createdAt: new Date().toISOString()
  };

  data.applications.unshift(newApp);
  writeDb(data);
  await syncApplicationToFirestore(newApp);
  return newApp;
}

async function updateApplication(id, updates) {
  const data = readDb();
  const index = (data.applications || []).findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error('Application not found');
  }

  if (updates.status !== undefined) {
    const validStatuses = ['Pending', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Rejected'];
    if (validStatuses.includes(updates.status)) {
      data.applications[index].status = updates.status;
    }
  }

  if (updates.rating !== undefined) {
    const r = Number(updates.rating);
    if (!isNaN(r) && r >= 0 && r <= 5) {
      data.applications[index].rating = Math.round(r);
    }
  }

  if (updates.notes !== undefined) {
    data.applications[index].notes = cleanText(updates.notes, 2000);
  }

  if (updates.interviewSlot !== undefined) {
    data.applications[index].interviewSlot = cleanText(updates.interviewSlot, 150);
  }

  data.applications[index].updatedAt = new Date().toISOString();
  writeDb(data);
  await syncApplicationToFirestore(data.applications[index]);
  return data.applications[index];
}

async function deleteApplication(id) {
  const data = readDb();
  const initialLength = (data.applications || []).length;
  data.applications = data.applications.filter(a => a.id !== id);
  if (data.applications.length === initialLength) {
    throw new Error('Application not found');
  }
  writeDb(data);
  await removeApplicationFromFirestore(id);
  return { success: true };
}

async function clearAllApplications() {
  const data = readDb();
  const prevIds = (data.applications || []).map(a => a.id);
  data.applications = [];
  writeDb(data);
  for (const id of prevIds) {
    await removeApplicationFromFirestore(id);
  }
  return { success: true, count: 0 };
}

function getStats() {
  const data = readDb();
  const apps = data.applications || [];

  const total = apps.length;
  
  const byPost = {};
  INITIAL_POSITIONS.forEach(p => { byPost[p] = 0; });
  apps.forEach(a => {
    byPost[a.post] = (byPost[a.post] || 0) + 1;
  });

  const byStatus = {
    Pending: 0,
    Shortlisted: 0,
    'Interview Scheduled': 0,
    Accepted: 0,
    Rejected: 0
  };
  apps.forEach(a => {
    if (byStatus[a.status] !== undefined) {
      byStatus[a.status]++;
    } else {
      byStatus[a.status] = 1;
    }
  });

  const colleges = {};
  apps.forEach(a => {
    if (a.college) {
      colleges[a.college] = (colleges[a.college] || 0) + 1;
    }
  });

  return {
    total,
    byPost,
    byStatus,
    colleges,
    totalAdmins: (data.admins || []).length
  };
}

module.exports = {
  INITIAL_POSITIONS,
  DEFAULT_SUPERADMIN,
  DEFAULT_PASSCODE,
  getAdmins,
  isAuthorizedAdmin,
  addAuthorizedAdmin,
  removeAuthorizedAdmin,
  verifyAdminPasscode,
  updateAdminPasscode,
  getApplications,
  getApplicationById,
  addApplication,
  updateApplication,
  deleteApplication,
  clearAllApplications,
  syncFromFirestore,
  getStats
};
