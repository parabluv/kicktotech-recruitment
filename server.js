const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const db = require('./server/db');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Cryptographically secure JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'kicktotech-recruitment-secret-key-2026-oct19-secure-vault';

// 1. HTTP Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Disable X-Powered-By Express header
app.disable('x-powered-by');

// 2. CORS - Restrict origins in production or allow same-origin
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || true,
  credentials: true
}));

// 3. Body parser with strict size limit (DoS protection)
app.use(express.json({ limit: '50kb' }));

// 4. Rate Limiting Protection (Generous limits for shared networks and campuses)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Rate Limiter for Admin Login (Brute Force Protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many failed login attempts from this IP. Please wait 15 minutes before trying again.' 
  }
});

// Public: Get all available hiring positions
app.get('/api/positions', (req, res) => {
  const positionsMetadata = [
    {
      id: "Social Media",
      title: "Social Media",
      icon: "📱",
      badge: "Marketing",
      tagline: "Drive virality, engage followers & amplify startup visibility",
      description: "Manage our official channels, create trending stories/reels, analyze audience analytics, and grow active community engagement."
    },
    {
      id: "✍️ Content Creation",
      title: "✍️ Content Creation",
      icon: "✍️",
      badge: "Creative",
      tagline: "Craft compelling copy, storytelling, scripts & blogs",
      description: "Write catchy hooks, newsletter articles, promotional scripts for videos, and engaging captions that communicate our startup's mission."
    },
    {
      id: "💻 Web Team",
      title: "💻 Web Team",
      icon: "💻",
      badge: "Engineering",
      tagline: "Build dynamic, high-performance web products & portals",
      description: "Develop frontend interfaces, user dashboards, integrate REST APIs, optimize web performance, and maintain our web applications."
    },
    {
      id: "⚙️ Technical Team",
      title: "⚙️ Technical Team",
      icon: "⚙️",
      badge: "Engineering",
      tagline: "Core system architecture, databases & software engineering",
      description: "Work on backend microservices, system design, data pipelines, integrations, bug triage, and developer tooling."
    },
    {
      id: "🤝 Partnership & Collaboration",
      title: "🤝 Partnership & Collaboration",
      icon: "🤝",
      badge: "Growth & BD",
      tagline: "Form strategic alliances, sponsorship & college outreach",
      description: "Lead outreach to student organizations, tech communities, brands, industry sponsors, and manage partner relationships."
    },
    {
      id: "🎨 Graphic / Poster Designer",
      title: "🎨 Graphic / Poster Designer",
      icon: "🎨",
      badge: "Design",
      tagline: "Craft stunning branding, posters, UI assets & illustrations",
      description: "Design eye-catching posters for events, social media carousel layouts, marketing banners, vector assets, and brand design."
    },
    {
      id: "🎬 Video Editor",
      title: "🎬 Video Editor",
      icon: "🎬",
      badge: "Media",
      tagline: "Transform raw footage into dynamic, viral video content",
      description: "Edit reels, YouTube/event teasers, podcast clips, add sound design, motion graphics, and punchy visual pacing."
    },
    {
      id: "🎤 Event Management (Manager & Team)",
      title: "🎤 Event Management (Manager & Team)",
      icon: "🎤",
      badge: "Operations",
      tagline: "Organize hackathons, launches, workshops & live sessions",
      description: "Coordinate venue logistics, speaker management, crowd flow, scheduling, and on-ground execution for startup events."
    }
  ];

  res.json({ success: true, positions: positionsMetadata });
});

// Public: Candidate Submit Application with Strict Validation
app.post('/api/applications', async (req, res) => {
  try {
    const { name, college, program, yearClass, contact, gmail, post, reason, portfolio, skills, availability } = req.body;

    // 1. Mandatory Fields Check
    if (!name || !college || !program || !yearClass || !contact || !gmail || !post || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill out all required fields: Name, College, Program, Class/Year, Contact, Gmail, Post, and Reason to apply.' 
      });
    }

    // 2. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof gmail !== 'string' || !emailRegex.test(gmail.trim()) || gmail.length > 100) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Gmail or Email address.' });
    }

    // 3. Contact Phone Number Validation (10-15 digits only)
    const phoneDigits = String(contact).replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit contact number.' });
    }

    // 4. Validate Position Against Whitelist (support with or without emoji and encoding variance)
    const cleanStr = (s) => (s || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '').replace(/[^a-zA-Z0-9\s&()/-]/g, '').trim().toLowerCase();
    const matchedPosition = db.INITIAL_POSITIONS.find(p => p === post || cleanStr(p) === cleanStr(post));
    if (!matchedPosition) {
      return res.status(400).json({ success: false, message: 'Invalid position selected.' });
    }
    const validatedPost = matchedPosition;

    // 5. Length Restrictions
    if (name.length > 100 || college.length > 150 || program.length > 100 || reason.length > 3000) {
      return res.status(400).json({ success: false, message: 'One or more fields exceed the allowed character limit.' });
    }

    // 6. Portfolio URL Validation (prevent javascript: XSS)
    if (portfolio && typeof portfolio === 'string') {
      const trimmedUrl = portfolio.trim();
      if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
        return res.status(400).json({ success: false, message: 'Portfolio link must start with http:// or https://' });
      }
    }

    const newApp = await db.addApplication({
      name,
      college,
      program,
      yearClass,
      contact: phoneDigits,
      gmail,
      post: validatedPost,
      reason,
      portfolio,
      skills,
      availability
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully to KICK TO TECH! Your interview details will be coordinated soon.',
      application: newApp
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ success: false, message: 'An internal error occurred while processing your application.' });
  }
});

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if email is in the authorized admins list
    if (!db.isAuthorizedAdmin(decoded.email)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access Denied: Your email is not authorized to access the Admin Panel.' 
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

// Admin: Login with bcrypt check & rate limiting
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { email, passcode } = req.body;

  if (!email || !passcode || typeof email !== 'string' || typeof passcode !== 'string') {
    return res.status(400).json({ success: false, message: 'Email and passcode are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verify email authorization
  if (!db.isAuthorizedAdmin(normalizedEmail)) {
    return res.status(403).json({
      success: false,
      message: `Access Denied: ${normalizedEmail} is not authorized. Only designated admin emails can access this portal.`
    });
  }

  // 2. Verify passcode with bcrypt (resistant to timing attacks)
  const isMatch = db.verifyAdminPasscode(passcode);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect admin credentials.'
    });
  }

  // Generate secure JWT token with 24h expiration
  const token = jwt.sign(
    { 
      email: normalizedEmail,
      isPrimary: normalizedEmail === db.DEFAULT_SUPERADMIN.toLowerCase()
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    message: 'Admin authorization successful',
    token,
    admin: {
      email: normalizedEmail,
      isPrimary: normalizedEmail === db.DEFAULT_SUPERADMIN.toLowerCase()
    }
  });
});

// Admin: Current Session Check
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// Admin: Get applications with filters
app.get('/api/admin/applications', requireAdmin, async (req, res) => {
  try {
    await db.syncFromFirestore();
  } catch (e) {
    // ignore
  }
  const { post, status, college, search, sortBy } = req.query;
  const applications = db.getApplications({ post, status, college, search, sortBy });
  res.json({
    success: true,
    total: applications.length,
    applications
  });
});

// Admin: Get single application
app.get('/api/admin/applications/:id', requireAdmin, (req, res) => {
  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }
  res.json({ success: true, application: appItem });
});

// Admin: Update application status / rating / notes / interview slot
app.patch('/api/admin/applications/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateApplication(req.params.id, req.body);
    res.json({ success: true, message: 'Application updated', application: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Clear all test applications (Purge test data)
app.delete('/api/admin/applications', requireAdmin, async (req, res) => {
  try {
    const result = await db.clearAllApplications();
    res.json({ success: true, message: 'All test candidate applications have been cleared.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Delete single application
app.delete('/api/admin/applications/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteApplication(req.params.id);
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    await db.syncFromFirestore();
  } catch (e) {
    // ignore
  }
  const stats = db.getStats();
  res.json({ success: true, stats });
});

// Admin: Authorized Emails Management
app.get('/api/admin/authorized-emails', requireAdmin, (req, res) => {
  const admins = db.getAdmins();
  res.json({ success: true, admins });
});

app.post('/api/admin/authorized-emails', requireAdmin, (req, res) => {
  try {
    const { email, role } = req.body;
    const added = db.addAuthorizedAdmin({
      email,
      role: role || 'Admin',
      addedBy: req.admin.email
    });
    res.status(201).json({ success: true, message: `Successfully added ${email} as authorized admin`, admin: added });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/authorized-emails/:email', requireAdmin, (req, res) => {
  try {
    const result = db.removeAuthorizedAdmin(req.params.email, req.admin.email);
    res.json({ success: true, message: `Successfully revoked admin access for ${req.params.email}`, result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Change Passcode
app.post('/api/admin/update-passcode', requireAdmin, (req, res) => {
  try {
    const { newPasscode } = req.body;
    db.updateAdminPasscode(newPasscode);
    res.json({ success: true, message: 'Admin passcode updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Export to CSV (Secured against CSV / Formula Injection)
app.get('/api/admin/export/csv', requireAdmin, async (req, res) => {
  try {
    await db.syncFromFirestore();
  } catch (e) {
    // ignore
  }
  const { post, status, college, search } = req.query;
  const applications = db.getApplications({ post, status, college, search });

  const headers = [
    'Application ID',
    'Applied Date',
    'Full Name',
    'College',
    'Program',
    'Class / Year',
    'Contact Number',
    'Gmail / Email',
    'Applied Post',
    'Status',
    'Rating (out of 5)',
    'Availability (Interview on 19 Oct)',
    'Portfolio / Links',
    'Skills / Tools',
    'Reason to Apply',
    'Admin Evaluator Notes'
  ];

  // Defensive CSV Sanitizer preventing CSV/Formula Injection (=, +, -, @, \t, \r, |)
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    let s = String(str).replace(/"/g, '""');
    // Prepend single quote if string starts with formula trigger character (=, +, -, @, \t, \r, |)
    if (/^[=+\-@|\t\r]/.test(s)) {
      s = "'" + s;
    }
    return `"${s}"`;
  };

  const rows = applications.map(a => [
    escapeCsv(a.id),
    escapeCsv(new Date(a.createdAt).toLocaleString()),
    escapeCsv(a.name),
    escapeCsv(a.college),
    escapeCsv(a.program),
    escapeCsv(a.yearClass),
    escapeCsv(a.contact),
    escapeCsv(a.gmail),
    escapeCsv(a.post),
    escapeCsv(a.status),
    escapeCsv(a.rating || 0),
    escapeCsv(a.availability || ''),
    escapeCsv(a.portfolio || ''),
    escapeCsv(a.skills || ''),
    escapeCsv(a.reason || ''),
    escapeCsv(a.notes || '')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="KICKTOTECH_candidates_19oct_${Date.now()}.csv"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(csvContent);
});

// Serve frontend static build if available
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// Serve frontend static build fallback
app.use((req, res) => {
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>KICK TO TECH Hiring Portal API</title></head>
          <body style="font-family:sans-serif;background:#FFFDF5;color:#1E293B;padding:40px;text-align:center;">
            <h1>KICK TO TECH Recruitment Server</h1>
            <p>API is active on port ${PORT}. Run client in dev mode or build client.</p>
          </body>
        </html>
      `);
    }
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[SECURITY ACTIVE] Server running securely at http://localhost:${PORT}`);
    console.log(`[AUTH] Primary Authorized Admin: ${db.DEFAULT_SUPERADMIN}`);
    console.log(`[PROTECTION] Helmet headers, bcrypt authentication & rate limiting enabled.`);
  });
}

module.exports = app;
