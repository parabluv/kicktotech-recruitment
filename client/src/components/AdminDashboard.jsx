import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Star, 
  Phone, 
  Mail, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  Eye, 
  Printer, 
  Building, 
  Sparkles,
  Lock,
  MessageSquare,
  ArrowRight,
  Zap,
  Filter
} from 'lucide-react';
import { Squiggle, StarBadge, FloatingGeometry } from './GeometricDecorations';
import logoImg from '../assets/kicktotech-logo.png';
import { db as firestoreDb, collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from '../firebase';

const POSITIONS = [
  "All",
  "Social Media",
  "✍️ Content Creation",
  "💻 Web Team",
  "⚙️ Technical Team",
  "🤝 Partnership & Collaboration",
  "🎨 Graphic / Poster Designer",
  "🎬 Video Editor",
  "🎤 Event Management (Manager & Team)"
];

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Shortlisted",
  "Interview Scheduled",
  "Accepted",
  "Rejected"
];

export default function AdminDashboard({ adminUser, onLogout, onBackToForm }) {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'analytics', 'admins', 'interview-sheet'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState(null);

  // Filters & Search
  const [filterPost, setFilterPost] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selected Candidate Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateSlot, setCandidateSlot] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);

  // Authorized Admins State
  const [authorizedAdmins, setAuthorizedAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // Passcode update
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');

  const token = localStorage.getItem('recruitment_admin_token');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPost !== 'All') params.append('post', filterPost);
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/admin/applications?${params.toString()}`, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      let apps = data.success ? (data.applications || []) : [];

      // Always query Firestore as authoritative source if server returned empty
      if (apps.length === 0 && firestoreDb) {
        try {
          const colRef = collection(firestoreDb, 'applications');
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            const fbApps = [];
            snap.forEach(d => {
              const item = d.data();
              if (item && item.id && !item._deleted) {
                fbApps.push(item);
              }
            });
            // Apply current filters to Firestore results
            let filtered = fbApps;
            if (filterPost !== 'All') {
              filtered = filtered.filter(a => a.post === filterPost);
            }
            if (filterStatus !== 'All') {
              filtered = filtered.filter(a => a.status === filterStatus);
            }
            if (searchQuery) {
              const q = searchQuery.toLowerCase().trim();
              filtered = filtered.filter(a =>
                (a.name && a.name.toLowerCase().includes(q)) ||
                (a.gmail && a.gmail.toLowerCase().includes(q)) ||
                (a.contact && a.contact.includes(q)) ||
                (a.college && a.college.toLowerCase().includes(q)) ||
                (a.program && a.program.toLowerCase().includes(q)) ||
                (a.skills && a.skills.toLowerCase().includes(q))
              );
            }
            if (sortBy === 'name') {
              filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy === 'rating') {
              filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            } else if (sortBy === 'oldest') {
              filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            } else {
              filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
            apps = filtered;
            console.log('[FIREBASE] Client fetched applications directly from Firestore:', fbApps.length);
          }
        } catch (e) {
          console.warn('[FIREBASE] Client Firestore read notice:', e.message);
        }
      }

      setApplications(apps);
    } catch (err) {
      // If server API fails completely, fallback directly to Firestore
      if (firestoreDb) {
        try {
          const colRef = collection(firestoreDb, 'applications');
          const snap = await getDocs(colRef);
          const fbApps = [];
          snap.forEach(d => {
            const item = d.data();
            if (item && item.id && !item._deleted) {
              fbApps.push(item);
            }
          });
          fbApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setApplications(fbApps);
        } catch (fbErr) {
          setErrorMsg('Failed to load candidate applications');
        }
      } else {
        setErrorMsg('Failed to load candidate applications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuthorizedAdmins = async () => {
    try {
      const res = await fetch('/api/admin/authorized-emails', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setAuthorizedAdmins(data.admins || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchAuthorizedAdmins();
  }, [filterPost, filterStatus, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(prev => ({ ...prev, status: newStatus }));
      }

      // 1. Direct Firestore update for immediate consistency
      if (firestoreDb) {
        try {
          const docRef = doc(firestoreDb, 'applications', id);
          await updateDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() });
        } catch (e) {
          console.warn('[FIREBASE] Client status update:', e.message);
        }
      }

      // 2. Server API sync
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRating = async (id, newRating) => {
    try {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, rating: newRating } : a));
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(prev => ({ ...prev, rating: newRating }));
      }

      // 1. Direct Firestore update
      if (firestoreDb) {
        try {
          const docRef = doc(firestoreDb, 'applications', id);
          await updateDoc(docRef, { rating: newRating, updatedAt: new Date().toISOString() });
        } catch (e) {
          console.warn('[FIREBASE] Client rating update:', e.message);
        }
      }

      // 2. Server API sync
      await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ rating: newRating })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openCandidateModal = (cand) => {
    setSelectedCandidate(cand);
    setCandidateNotes(cand.notes || '');
    setCandidateSlot(cand.interviewSlot || '');
  };

  const handleSaveCandidateDetails = async () => {
    if (!selectedCandidate) return;
    setSavingCandidate(true);
    try {
      setApplications(prev => prev.map(a => a.id === selectedCandidate.id ? { ...a, notes: candidateNotes, interviewSlot: candidateSlot } : a));
      setSelectedCandidate(prev => ({ ...prev, notes: candidateNotes, interviewSlot: candidateSlot }));

      // 1. Direct Firestore update
      if (firestoreDb) {
        try {
          const docRef = doc(firestoreDb, 'applications', selectedCandidate.id);
          await updateDoc(docRef, {
            notes: candidateNotes,
            interviewSlot: candidateSlot,
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('[FIREBASE] Client details update:', e.message);
        }
      }

      // 2. Server API sync
      await fetch(`/api/admin/applications/${selectedCandidate.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          notes: candidateNotes,
          interviewSlot: candidateSlot
        })
      });
    } catch (err) {
      alert('Failed to save evaluator notes');
    } finally {
      setSavingCandidate(false);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      setApplications(prev => prev.filter(a => a.id !== id));
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(null);
      }

      // 1. Direct Firestore delete (hard-delete with soft-delete fallback)
      if (firestoreDb) {
        try {
          const docRef = doc(firestoreDb, 'applications', id);
          try {
            await deleteDoc(docRef);
          } catch (permErr) {
            await setDoc(docRef, { _deleted: true, deletedAt: new Date().toISOString() }, { merge: true });
          }
        } catch (e) {
          console.warn('[FIREBASE] Client delete:', e.message);
        }
      }

      // 2. Server API delete
      await fetch(`/api/admin/applications/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      fetchStats();
    } catch (err) {
      alert('Error deleting candidate record');
    }
  };

  const handleClearAllApplications = async () => {
    if (!window.confirm('Are you sure you want to PURGE all candidate applications? This will clear all test records so you can start receiving real data!')) return;
    try {
      const prevApps = [...applications];
      setApplications([]);
      setSelectedCandidate(null);

      // Direct Firestore purge
      if (firestoreDb && prevApps.length > 0) {
        for (const app of prevApps) {
          try {
            const docRef = doc(firestoreDb, 'applications', app.id);
            try {
              await deleteDoc(docRef);
            } catch (pErr) {
              await setDoc(docRef, { _deleted: true, deletedAt: new Date().toISOString() }, { merge: true });
            }
          } catch (e) {}
        }
      }

      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
        alert('All candidate records cleared! The portal is ready for real applicants.');
      } else {
        alert(data.message || 'Failed to clear applications');
      }
    } catch (err) {
      alert('Error clearing candidate records');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setAddingAdmin(true);
    setAdminActionMsg('');
    try {
      const res = await fetch('/api/admin/authorized-emails', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email: newAdminEmail.trim(), role: newAdminRole })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to authorize admin');
      }
      setAdminActionMsg(`Successfully added ${newAdminEmail} as an authorized admin!`);
      setNewAdminEmail('');
      fetchAuthorizedAdmins();
    } catch (err) {
      setAdminActionMsg(`Error: ${err.message}`);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if (!window.confirm(`Are you sure you want to revoke admin authorization for ${emailToRemove}?`)) return;
    try {
      const res = await fetch(`/api/admin/authorized-emails/${encodeURIComponent(emailToRemove)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to revoke authorization');
      }
      setAdminActionMsg(`Revoked authorization for ${emailToRemove}`);
      fetchAuthorizedAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePasscode = async (e) => {
    e.preventDefault();
    if (!newPasscode || newPasscode.length < 4) {
      alert('Passcode must be at least 4 characters');
      return;
    }
    try {
      const res = await fetch('/api/admin/update-passcode', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ newPasscode })
      });
      const data = await res.json();
      if (data.success) {
        setPasscodeSuccess('Passcode updated successfully!');
        setNewPasscode('');
        setTimeout(() => setPasscodeSuccess(''), 4000);
      }
    } catch (err) {
      alert('Failed to update passcode');
    }
  };

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (filterPost !== 'All') params.append('post', filterPost);
    if (filterStatus !== 'All') params.append('status', filterStatus);
    if (searchQuery) params.append('search', searchQuery);

    const downloadUrl = `/api/admin/export/csv?${params.toString()}`;
    
    fetch(downloadUrl, { headers: authHeaders })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KICKTOTECH_candidates_19oct_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => alert('Failed to download CSV file'));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Shortlisted':
        return 'bg-[#34D399] text-[#1E293B] border-2 border-[#1E293B] shadow-pop-sm';
      case 'Interview Scheduled':
        return 'bg-[#8B5CF6] text-white border-2 border-[#1E293B] shadow-pop-sm';
      case 'Accepted':
        return 'bg-[#F472B6] text-white border-2 border-[#1E293B] shadow-pop-sm';
      case 'Rejected':
        return 'bg-[#EF4444] text-white border-2 border-[#1E293B] shadow-pop-sm';
      default:
        return 'bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] shadow-pop-sm';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1E293B] flex flex-col font-body">
      {/* Top Admin Navbar */}
      <header className="bg-white border-b-2 border-[#1E293B] sticky top-0 z-30 shadow-pop-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#15616D] border-2 border-[#1E293B] overflow-hidden shadow-pop-sm group-hover:rotate-3 transition-transform shrink-0 flex items-center justify-center p-0.5">
                <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-heading font-black text-lg text-[#1E293B] tracking-tight">KICK TO TECH</span>
                <span className="ml-2 text-[10px] bg-[#FBBF24] text-[#1E293B] px-2.5 py-0.5 rounded-full border-2 border-[#1E293B] font-heading font-black shadow-pop-sm uppercase">
                  ADMIN
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#1E293B] bg-[#FFFDF5] px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] shadow-pop-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] border border-[#1E293B]"></span>
              <span>Logged in as: <strong className="text-[#8B5CF6]">{adminUser.email}</strong></span>
              {adminUser.isPrimary && (
                <span className="bg-[#8B5CF6] text-white px-2 py-0.2 rounded-full text-[10px] font-black">Super Admin</span>
              )}
            </div>

            <button
              onClick={onBackToForm}
              className="candy-btn bg-[#FFFDF5] hover:bg-[#F1F5F9] text-[#1E293B] px-3.5 py-1.5 text-xs"
            >
              Public Form
            </button>

            <button
              onClick={onLogout}
              className="candy-btn bg-[#EF4444] hover:bg-[#DC2626] text-white px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-3 border-t-2 border-[#1E293B]/20 py-2.5 text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`candy-btn px-4 py-2 text-xs flex items-center gap-2 ${
              activeTab === 'candidates'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white text-[#1E293B] hover:bg-[#FBBF24]'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>Applications ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`candy-btn px-4 py-2 text-xs flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white text-[#1E293B] hover:bg-[#FBBF24]'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Positions & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`candy-btn px-4 py-2 text-xs flex items-center gap-2 ${
              activeTab === 'admins'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white text-[#1E293B] hover:bg-[#FBBF24]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Authorized Admins ({authorizedAdmins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('interview-sheet')}
            className={`candy-btn px-4 py-2 text-xs flex items-center gap-2 ${
              activeTab === 'interview-sheet'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white text-[#1E293B] hover:bg-[#FBBF24]'
            }`}
          >
            <Calendar className="w-4 h-4 stroke-[2.5]" />
            <span>Oct 19 Interview Roster</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* TAB 1: CANDIDATES MANAGEMENT */}
        {activeTab === 'candidates' && (
          <div className="space-y-8">
            {/* KPI Cards with Pop Shadows */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="sticker-card p-5 bg-white shadow-pop">
                  <span className="font-heading text-xs text-[#64748B] font-bold uppercase tracking-wider block">Total Applicants</span>
                  <div className="font-heading text-3xl font-black text-[#1E293B] mt-1">{stats.total}</div>
                </div>
                <div className="sticker-card p-5 bg-white shadow-pop-mint">
                  <span className="font-heading text-xs text-[#059669] font-bold uppercase tracking-wider block">Shortlisted</span>
                  <div className="font-heading text-3xl font-black text-[#059669] mt-1">{stats.byStatus['Shortlisted'] || 0}</div>
                </div>
                <div className="sticker-card p-5 bg-white shadow-pop-violet">
                  <span className="font-heading text-xs text-[#8B5CF6] font-bold uppercase tracking-wider block">Oct 19 Scheduled</span>
                  <div className="font-heading text-3xl font-black text-[#8B5CF6] mt-1">{stats.byStatus['Interview Scheduled'] || 0}</div>
                </div>
                <div className="sticker-card p-5 bg-white shadow-pop-yellow">
                  <span className="font-heading text-xs text-[#D97706] font-bold uppercase tracking-wider block">Pending Review</span>
                  <div className="font-heading text-3xl font-black text-[#D97706] mt-1">{stats.byStatus['Pending'] || 0}</div>
                </div>
              </div>
            )}

            {/* Position Filter Pills */}
            <div className="sticker-card p-5 bg-white shadow-pop">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-[#8B5CF6] stroke-[2.5]" />
                <span className="font-heading text-xs font-black uppercase tracking-wider text-[#1E293B]">
                  Filter By Position
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setFilterPost(pos)}
                    className={`candy-btn px-3 py-1.5 text-xs ${
                      filterPost === pos
                        ? 'bg-[#8B5CF6] text-white shadow-pop-sm'
                        : 'bg-[#FFFDF5] text-[#1E293B] hover:bg-[#FBBF24] shadow-none border-[#1E293B]'
                    }`}
                  >
                    {pos}
                    {pos !== 'All' && stats && stats.byPost[pos] !== undefined && (
                      <span className="ml-1.5 text-[10px] bg-[#1E293B] text-white px-1.5 py-0.2 rounded-full font-black">
                        {stats.byPost[pos]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, Filter, & Download CSV Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between sticker-card p-4 bg-white shadow-pop">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, college, email, phone, skills..."
                    className="geometric-input w-full pl-10 pr-4 py-2.5 text-xs font-medium"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="geometric-input px-3 py-2.5 text-xs font-bold"
                >
                  <option value="All">All Statuses</option>
                  {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="geometric-input px-3 py-2.5 text-xs font-bold"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="rating">Sort: Highest Rating</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {/* Official Candidate WhatsApp Group */}
                <a
                  href="https://chat.whatsapp.com/Ik7xEPjROaoEMoVZBnqtHt?s=qt&p=a&mlu=4&ilr=4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="candy-btn bg-[#25D366] hover:bg-[#20BD5A] text-[#1E293B] px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-pop"
                  title="Open Candidate WhatsApp Group"
                >
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>WhatsApp Group</span>
                </a>

                {/* Candy Download CSV Button */}
                <button
                  onClick={handleDownloadCsv}
                  className="candy-btn bg-[#34D399] hover:bg-[#10B981] text-[#1E293B] px-4 sm:px-5 py-2.5 text-xs flex items-center gap-2 shadow-pop"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download CSV ({applications.length})</span>
                </button>

                {/* Purge Test Data Button */}
                {applications.length > 0 && (
                  <button
                    onClick={handleClearAllApplications}
                    className="candy-btn bg-[#FFFDF5] hover:bg-[#FEE2E2] text-[#EF4444] border-2 border-[#EF4444] px-3.5 py-2.5 text-xs flex items-center gap-1.5 shadow-pop transition-colors"
                    title="Clear test data from database"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Clear Data</span>
                  </button>
                )}
              </div>
            </div>

            {/* Candidate List Container */}
            <div className="sticker-card bg-white overflow-hidden shadow-pop-xl">
              {loading ? (
                <div className="p-12 sm:p-16 text-center text-[#64748B]">
                  <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="font-heading font-bold text-sm">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-12 sm:p-16 text-center text-[#64748B]">
                  <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 stroke-[2]" />
                  <h3 className="font-heading font-black text-lg text-[#1E293B] mb-1">No Applications Match Filter</h3>
                  <p className="font-body text-xs">Try selecting a different position or clearing the search keyword.</p>
                </div>
              ) : (
                <>
                  {/* MOBILE VIEW: Tactile Candidate Cards (< md) */}
                  <div className="block md:hidden divide-y-2 border-[#1E293B]/20">
                    {applications.map((app) => (
                      <div 
                        key={app.id} 
                        className="p-4 sm:p-5 hover:bg-[#FFFDF5] transition active:bg-[#FFFDF5]"
                        onClick={() => openCandidateModal(app)}
                      >
                        {/* Header: ID, Name, Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-heading font-bold text-[10px] bg-[#FFFDF5] text-[#1E293B] px-2 py-0.5 rounded-md border border-[#1E293B] mr-2">
                              {app.id}
                            </span>
                            <h4 className="font-heading font-black text-base text-[#1E293B] inline">{app.name}</h4>
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-heading font-black cursor-pointer ${getStatusBadge(app.status)}`}
                            >
                              {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                                <option key={s} value={s} className="bg-white text-[#1E293B]">
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Post & College Info */}
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-extrabold text-xs text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-md border border-[#8B5CF6]/30">
                              {app.post}
                            </span>
                            {app.portfolio && (
                              <a
                                href={app.portfolio}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] font-bold text-[#8B5CF6] hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3 stroke-[2.5]" /> Portfolio
                              </a>
                            )}
                          </div>
                          <div className="text-[#64748B] text-xs font-medium flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 stroke-[2.5]" />
                            <span className="truncate">{app.college}</span>
                          </div>
                          <div className="text-[#1E293B] text-[11px] font-semibold">
                            {app.program} • <span className="text-[#8B5CF6]">{app.yearClass}</span>
                          </div>
                        </div>

                        {/* Rating Row */}
                        <div className="flex items-center justify-between py-2 border-t border-dashed border-[#E2E8F0] mb-3" onClick={(e) => e.stopPropagation()}>
                          <span className="font-heading text-xs font-bold text-[#64748B]">Rating:</span>
                          <div className="flex items-center gap-1.5 p-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                onClick={() => handleUpdateRating(app.id, star === app.rating ? 0 : star)}
                                className={`w-5 h-5 cursor-pointer transition ${
                                  star <= (app.rating || 0)
                                    ? 'text-[#FBBF24] fill-[#FBBF24] stroke-[#1E293B] stroke-[2]'
                                    : 'text-[#CBD5E1] stroke-[2]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Quick Action Touch Buttons */}
                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`https://wa.me/91${app.contact.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(app.name)},%20regarding%20your%20application%20for%20${encodeURIComponent(app.post)}%20at%20KICK%20TO%20TECH...`}
                            target="_blank"
                            rel="noreferrer"
                            className="candy-btn bg-[#34D399] hover:bg-[#10B981] text-[#1E293B] flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-pop-sm"
                          >
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${app.contact}`}
                            className="candy-btn bg-[#FFFDF5] hover:bg-[#F1F5F9] text-[#1E293B] px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1 shadow-pop-sm"
                            title="Call Candidate"
                          >
                            <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Call</span>
                          </a>

                          <button
                            onClick={() => openCandidateModal(app)}
                            className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1 shadow-pop-sm"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Notes</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP VIEW: Full Structured Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#1E293B] bg-[#FFFDF5] text-[11px] font-heading font-black text-[#1E293B] uppercase tracking-wider">
                          <th className="py-4 px-5">Candidate & College</th>
                          <th className="py-4 px-5">Applied Post</th>
                          <th className="py-4 px-5">Contact & Gmail</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Rating</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 border-[#1E293B]/20 text-xs font-body">
                        {applications.map((app) => (
                          <tr 
                            key={app.id} 
                            className="hover:bg-[#FFFDF5] transition cursor-pointer"
                            onClick={() => openCandidateModal(app)}
                          >
                            <td className="py-4 px-5">
                              <div className="font-heading font-black text-sm text-[#1E293B]">{app.name}</div>
                              <div className="text-[#64748B] text-xs font-medium flex items-center gap-1.5 mt-0.5">
                                <Building className="w-3.5 h-3.5 text-[#8B5CF6] stroke-[2.5]" />
                                <span>{app.college}</span>
                              </div>
                              <div className="text-[#8B5CF6] text-[11px] font-bold mt-0.5">
                                {app.program} • {app.yearClass}
                              </div>
                            </td>

                            <td className="py-4 px-5">
                              <span className="font-heading font-extrabold text-[#1E293B] text-xs block">
                                {app.post}
                              </span>
                              {app.portfolio && (
                                <a
                                  href={app.portfolio}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-bold text-[#8B5CF6] hover:underline flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3 stroke-[2.5]" /> Portfolio
                                </a>
                              )}
                            </td>

                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#1E293B]">{app.contact}</span>
                                <a
                                  href={`https://wa.me/91${app.contact.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(app.name)},%20regarding%20your%20application%20for%20${encodeURIComponent(app.post)}%20at%20KICK%20TO%20TECH...`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="candy-btn bg-[#34D399] text-[#1E293B] px-2 py-0.5 text-[10px] shadow-none border border-[#1E293B]"
                                >
                                  WhatsApp
                                </a>
                              </div>
                              <div className="text-[#64748B] text-[11px] font-medium mt-1">
                                <a
                                  href={`mailto:${app.gmail}?subject=KICK%20TO%20TECH%20Interview%20-%20Monday%2019%20Oct&body=Hi%20${encodeURIComponent(app.name)},`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-[#8B5CF6] font-semibold"
                                >
                                  {app.gmail}
                                </a>
                              </div>
                            </td>

                            <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                className={`px-3 py-1 rounded-full text-[11px] font-heading font-black cursor-pointer ${getStatusBadge(app.status)}`}
                              >
                                {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                                  <option key={s} value={s} className="bg-white text-[#1E293B]">
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    onClick={() => handleUpdateRating(app.id, star === app.rating ? 0 : star)}
                                    className={`w-4 h-4 cursor-pointer transition ${
                                      star <= (app.rating || 0)
                                        ? 'text-[#FBBF24] fill-[#FBBF24] stroke-[#1E293B] stroke-[2]'
                                        : 'text-[#CBD5E1] hover:text-[#FBBF24] stroke-[2]'
                                    }`}
                                  />
                                ))}
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openCandidateModal(app)}
                                  className="candy-btn bg-[#FFFDF5] hover:bg-[#F1F5F9] text-[#1E293B] p-2 text-xs"
                                  title="View Details & Notes"
                                >
                                  <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCandidate(app.id)}
                                  className="candy-btn bg-[#FEE2E2] hover:bg-[#EF4444] text-[#B91C1C] hover:text-white p-2 text-xs"
                                  title="Delete Application"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            <h2 className="font-heading text-2xl font-black text-[#1E293B] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#FBBF24] stroke-[2.5]" /> Positions & Applicant Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Positions Progress Bars */}
              <div className="sticker-card p-6 bg-white shadow-pop">
                <h3 className="font-heading font-extrabold text-sm text-[#1E293B] uppercase tracking-wider mb-5">
                  Applications by Department
                </h3>
                <div className="space-y-4">
                  {POSITIONS.filter(p => p !== 'All').map((pos, idx) => {
                    const count = stats.byPost[pos] || 0;
                    const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const colors = ['#8B5CF6', '#F472B6', '#FBBF24', '#34D399'];
                    const barColor = colors[idx % colors.length];

                    return (
                      <div key={pos}>
                        <div className="flex items-center justify-between text-xs font-heading font-bold mb-1">
                          <span className="text-[#1E293B]">{pos}</span>
                          <span className="text-[#64748B]">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-3.5 bg-[#FFFDF5] rounded-full overflow-hidden border-2 border-[#1E293B]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, backgroundColor: barColor }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Breakdown & Colleges */}
              <div className="space-y-8">
                <div className="sticker-card p-6 bg-white shadow-pop">
                  <h3 className="font-heading font-extrabold text-sm text-[#1E293B] uppercase tracking-wider mb-4">
                    Review Pipeline
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                    {Object.entries(stats.byStatus).map(([st, cnt]) => (
                      <div key={st} className="p-3 bg-[#FFFDF5] rounded-2xl border-2 border-[#1E293B] shadow-pop-sm">
                        <div className="font-heading text-xs font-bold text-[#64748B]">{st}</div>
                        <div className="font-heading text-2xl font-black text-[#1E293B] mt-1">{cnt}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sticker-card p-6 bg-white shadow-pop">
                  <h3 className="font-heading font-extrabold text-sm text-[#1E293B] uppercase tracking-wider mb-4">
                    Top Colleges
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.colleges || {}).slice(0, 6).map(([clg, count]) => (
                      <div key={clg} className="flex items-center justify-between text-xs py-2 border-b-2 border-dashed border-[#E2E8F0] last:border-0 font-medium">
                        <span className="text-[#1E293B] font-bold truncate max-w-xs">{clg}</span>
                        <span className="bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] px-2.5 py-0.5 rounded-full font-heading font-black text-[11px] shadow-pop-sm">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTHORIZED ADMINS MANAGEMENT */}
        {activeTab === 'admins' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="sticker-card p-6 sm:p-8 bg-white shadow-pop-violet relative">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#8B5CF6] text-white border-2 border-[#1E293B] rounded-2xl flex items-center justify-center shrink-0 shadow-pop-sm">
                  <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-black text-[#1E293B]">Admin Whitelist Engine</h2>
                  <p className="font-body text-xs sm:text-sm text-[#64748B] font-medium mt-1 leading-relaxed">
                    Access is restricted only to authorized email addresses. Primary owner <code className="bg-[#FBBF24] text-[#1E293B] font-bold px-1.5 py-0.5 rounded border border-[#1E293B] shadow-pop-sm">parabluv25@gmail.com</code> is protected. Authorize additional team member emails below.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Admin Form */}
            <div className="sticker-card p-6 bg-white shadow-pop">
              <h3 className="font-heading font-black text-base text-[#1E293B] flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-[#8B5CF6] stroke-[2.5]" /> Authorize New Team Member
              </h3>

              {adminActionMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border-2 border-[#34D399] text-[#065F46] text-xs font-bold flex items-center gap-2 shadow-pop-sm">
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>{adminActionMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block font-heading text-xs font-extrabold uppercase text-[#1E293B] mb-1">
                    Teammate Gmail / Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="teammate@gmail.com"
                    className="geometric-input w-full px-4 py-2.5 text-xs font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-heading text-xs font-extrabold uppercase text-[#1E293B] mb-1">
                    Role
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="geometric-input w-full px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Interviewer">Interviewer / Panel</option>
                    <option value="HR Lead">HR Lead</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-full py-2.5 text-xs shadow-pop"
                  >
                    {addingAdmin ? 'Authorizing...' : 'Grant Access'}
                  </button>
                </div>
              </form>
            </div>

            {/* Authorized Admins List */}
            <div className="sticker-card bg-white overflow-hidden shadow-pop-xl">
              <div className="p-5 border-b-2 border-[#1E293B] bg-[#FFFDF5] flex items-center justify-between">
                <h3 className="font-heading font-black text-sm text-[#1E293B] uppercase tracking-wider">
                  Whitelisted Admins ({authorizedAdmins.length})
                </h3>
              </div>

              <div className="divide-y-2 border-[#1E293B]/20">
                {authorizedAdmins.map((adm) => {
                  const isPrimary = adm.email.toLowerCase() === 'parabluv25@gmail.com';
                  return (
                    <div key={adm.email} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#FFFDF5] transition">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] text-[#1E293B] flex items-center justify-center font-heading font-black text-sm shadow-pop-sm">
                          {adm.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-[#1E293B]">{adm.email}</span>
                            {isPrimary && (
                              <span className="bg-[#8B5CF6] text-white font-heading font-black text-[10px] px-2 py-0.5 rounded-full border border-[#1E293B] shadow-pop-sm">
                                Super Admin (Root)
                              </span>
                            )}
                          </div>
                          <div className="font-body text-xs text-[#64748B] font-medium mt-0.5">
                            Role: <strong className="text-[#1E293B]">{adm.role || 'Admin'}</strong> • Added: {new Date(adm.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPrimary ? (
                          <span className="text-xs font-bold text-[#94A3B8] italic">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleRemoveAdmin(adm.email)}
                            className="candy-btn bg-[#FEE2E2] hover:bg-[#EF4444] text-[#B91C1C] hover:text-white px-3 py-1.5 text-xs shadow-none border border-[#1E293B]"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" /> Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passcode Settings */}
            <div className="sticker-card p-6 bg-white shadow-pop">
              <h3 className="font-heading font-black text-sm text-[#1E293B] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FBBF24] stroke-[2.5]" /> Admin Passcode Settings
              </h3>
              <p className="font-body text-xs text-[#64748B] font-medium mb-4">
                Update the master passcode used to authenticate alongside authorized emails.
              </p>

              {passcodeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border-2 border-[#34D399] text-[#065F46] text-xs font-bold">
                  {passcodeSuccess}
                </div>
              )}

              <form onSubmit={handleUpdatePasscode} className="flex gap-3 max-w-md">
                <input
                  type="text"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode (e.g. kick2026)"
                  className="geometric-input flex-1 px-4 py-2 text-xs font-medium"
                />
                <button
                  type="submit"
                  className="candy-btn bg-[#1E293B] hover:bg-black text-white px-4 py-2 text-xs"
                >
                  Update Passcode
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: INTERVIEW DAY ROSTER */}
        {activeTab === 'interview-sheet' && (
          <div className="space-y-6">
            <div className="sticker-card p-6 bg-white shadow-pop-yellow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#15616D] border-2 border-[#1E293B] overflow-hidden shadow-pop-sm shrink-0 p-1 flex items-center justify-center">
                  <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] text-xs font-heading font-black px-3 py-1 rounded-full shadow-pop-sm uppercase">
                    Interview Round • Monday 19th October
                  </span>
                  <h2 className="font-heading text-2xl font-black text-[#1E293B] mt-1.5">
                    KICK TO TECH Interview Day Schedule
                  </h2>
                  <p className="font-body text-xs sm:text-sm text-[#64748B] font-medium">
                    Prepared cheat-sheet for interview panel evaluation. Assign slots and take notes live.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="candy-btn bg-white hover:bg-[#F1F5F9] text-[#1E293B] px-4 py-2 text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" /> Print Roster
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="candy-btn bg-[#34D399] hover:bg-[#10B981] text-[#1E293B] px-4 py-2 text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" /> Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="sticker-card p-5 bg-white shadow-pop flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-[10px] bg-[#FFFDF5] text-[#1E293B] px-2 py-0.5 rounded-md border border-[#1E293B]">
                        {app.id}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-heading font-black ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <h4 className="font-heading font-black text-base text-[#1E293B]">{app.name}</h4>
                    <p className="font-heading font-extrabold text-xs text-[#8B5CF6]">{app.post}</p>
                    <p className="font-body text-[11px] text-[#64748B] font-medium mt-1">{app.college} • {app.program}</p>

                    <div className="mt-4 text-xs bg-[#FFFDF5] p-3 rounded-xl border-2 border-[#1E293B]">
                      <span className="font-heading font-black text-[10px] uppercase text-[#64748B] block">Interview Slot:</span>
                      <span className="font-bold text-[#1E293B] block mt-0.5">
                        {app.interviewSlot || 'Slot not assigned yet'}
                      </span>
                    </div>

                    {app.notes && (
                      <div className="mt-2 text-xs bg-[#FFFDF5] p-2.5 rounded-xl border border-[#CBD5E1] text-[#1E293B] font-medium italic">
                        "{app.notes}"
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t-2 border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <button
                      onClick={() => openCandidateModal(app)}
                      className="font-heading font-extrabold text-xs text-[#8B5CF6] hover:underline flex items-center gap-1"
                    >
                      Assign Slot / Notes →
                    </button>
                    <a
                      href={`https://wa.me/91${app.contact.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="candy-btn bg-[#34D399] text-[#1E293B] px-2.5 py-0.5 text-[10px] shadow-none border border-[#1E293B]"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Candidate Detail Modal / Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-[#1E293B]/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l-4 border-[#1E293B] p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#1E293B] mb-6">
                <div>
                  <span className="bg-[#8B5CF6] text-white font-heading font-black text-xs px-2.5 py-0.5 rounded-full border border-[#1E293B] shadow-pop-sm">
                    {selectedCandidate.id}
                  </span>
                  <h3 className="font-heading font-black text-2xl text-[#1E293B] mt-1.5">{selectedCandidate.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="candy-btn bg-[#FFFDF5] hover:bg-[#FEE2E2] text-[#1E293B] w-9 h-9 text-base"
                >
                  ✕
                </button>
              </div>

              {/* Status & Rating Bar */}
              <div className="bg-[#FFFDF5] p-4 rounded-2xl border-2 border-[#1E293B] mb-6 space-y-3 shadow-pop-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-black uppercase text-[#64748B]">Status:</span>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) => handleUpdateStatus(selectedCandidate.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-heading font-black ${getStatusBadge(selectedCandidate.status)}`}
                  >
                    {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#CBD5E1]">
                  <span className="font-heading text-xs font-black uppercase text-[#64748B]">Evaluator Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => handleUpdateRating(selectedCandidate.id, star === selectedCandidate.rating ? 0 : star)}
                        className={`w-4 h-4 cursor-pointer transition ${
                          star <= (selectedCandidate.rating || 0)
                            ? 'text-[#FBBF24] fill-[#FBBF24] stroke-[#1E293B] stroke-[2]'
                            : 'text-[#CBD5E1] hover:text-[#FBBF24] stroke-[2]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-body mb-6">
                <div className="p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B]">
                  <span className="font-heading font-black text-[10px] text-[#64748B] uppercase block">Position</span>
                  <span className="font-heading font-black text-sm text-[#8B5CF6]">{selectedCandidate.post}</span>
                </div>
                <div className="p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B]">
                  <span className="font-heading font-black text-[10px] text-[#64748B] uppercase block">College</span>
                  <span className="font-bold text-[#1E293B]">{selectedCandidate.college}</span>
                </div>
                <div className="p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B]">
                  <span className="font-heading font-black text-[10px] text-[#64748B] uppercase block">Program & Year</span>
                  <span className="font-bold text-[#1E293B]">{selectedCandidate.program} ({selectedCandidate.yearClass})</span>
                </div>
                <div className="p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B]">
                  <span className="font-heading font-black text-[10px] text-[#64748B] uppercase block">Contact</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-[#1E293B]">{selectedCandidate.contact}</span>
                    <a
                      href={`https://wa.me/91${selectedCandidate.contact.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="candy-btn bg-[#34D399] text-[#1E293B] px-2 py-0.5 text-[10px] shadow-none border border-[#1E293B]"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Interview Availability */}
              <div className="mb-6 p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#8B5CF6] text-xs font-body shadow-pop-sm">
                <span className="font-heading font-black text-[10px] uppercase text-[#8B5CF6] block mb-0.5">
                  Interview Availability (Monday, 19th Oct):
                </span>
                <span className="font-bold text-[#1E293B]">
                  {selectedCandidate.availability || 'Available on 19th Oct Monday'}
                </span>
              </div>

              {/* Portfolio Link */}
              {selectedCandidate.portfolio && (
                <div className="mb-6 p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B] text-xs font-body shadow-pop-sm">
                  <span className="font-heading font-black text-[10px] uppercase text-[#64748B] block mb-1">Portfolio Link:</span>
                  <a
                    href={selectedCandidate.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#8B5CF6] hover:underline flex items-center gap-1 break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{selectedCandidate.portfolio}</span>
                  </a>
                </div>
              )}

              {/* Skills */}
              {selectedCandidate.skills && (
                <div className="mb-6 p-3 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B] text-xs font-body shadow-pop-sm">
                  <span className="font-heading font-black text-[10px] uppercase text-[#64748B] block mb-1">Key Skills & Tools:</span>
                  <span className="font-bold text-[#1E293B]">{selectedCandidate.skills}</span>
                </div>
              )}

              {/* Reason to Apply */}
              <div className="mb-6 p-4 bg-[#FFFDF5] rounded-xl border-2 border-[#1E293B] text-xs font-body shadow-pop-sm">
                <span className="font-heading font-black text-[10px] uppercase text-[#64748B] block mb-1.5">
                  Reason to Apply:
                </span>
                <p className="font-medium text-[#1E293B] leading-relaxed whitespace-pre-line">
                  {selectedCandidate.reason}
                </p>
              </div>

              {/* Evaluator Notes Section */}
              <div className="space-y-4 pt-4 border-t-2 border-[#1E293B]">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-[#8B5CF6] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" /> Interview Slot & Internal Notes
                </h4>

                <div>
                  <label className="block font-heading text-[11px] font-bold text-[#1E293B] mb-1">
                    Scheduled Interview Slot (Monday 19 Oct):
                  </label>
                  <input
                    type="text"
                    value={candidateSlot}
                    onChange={(e) => setCandidateSlot(e.target.value)}
                    placeholder="e.g. Monday 11:30 AM (Meet Link / Panel 1)"
                    className="geometric-input w-full px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-heading text-[11px] font-bold text-[#1E293B] mb-1">
                    Evaluator Feedback & Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                    placeholder="Record notes during the interview (communication, depth, culture fit)..."
                    className="geometric-input w-full px-3 py-2 text-xs font-medium"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-6 border-t-2 border-[#1E293B] flex items-center justify-between mt-6">
              <button
                onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                className="font-heading font-bold text-xs text-[#EF4444] hover:underline flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" /> Delete
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="candy-btn bg-[#FFFDF5] hover:bg-[#F1F5F9] text-[#1E293B] px-4 py-2 text-xs"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveCandidateDetails}
                  disabled={savingCandidate}
                  className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2 text-xs"
                >
                  {savingCandidate ? 'Saving...' : 'Save Notes & Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
