import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Briefcase, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Calendar, 
  Link as LinkIcon, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Rocket,
  Check,
  Zap,
  Smile,
  MessageCircle
} from 'lucide-react';
import { Squiggle, StarBadge, FloatingGeometry } from './GeometricDecorations';
import logoImg from '../assets/kicktotech-logo.png';
import { db as firestoreDb, collection, doc, setDoc } from '../firebase';

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/Ik7xEPjROaoEMoVZBnqtHt?s=qt&p=a&mlu=4&ilr=4";

const POSITIONS = [
  {
    id: "Social Media",
    title: "Social Media",
    icon: "📱",
    color: "#F472B6", // Hot Pink
    bgPill: "bg-[#F472B6]",
    shadowHover: "hover:shadow-[8px_8px_0px_#F472B6]",
    badge: "Viral & Growth",
    description: "Manage handles, track reels/trends, engage the tech community, and scale audience reach."
  },
  {
    id: "✍️ Content Creation",
    title: "✍️ Content Creation",
    icon: "✍️",
    color: "#FBBF24", // Yellow
    bgPill: "bg-[#FBBF24]",
    shadowHover: "hover:shadow-[8px_8px_0px_#FBBF24]",
    badge: "Storytelling",
    description: "Write viral tech hooks, newsletter articles, video scripts, blog stories, and copy."
  },
  {
    id: "💻 Web Team",
    title: "💻 Web Team",
    icon: "💻",
    color: "#8B5CF6", // Violet
    bgPill: "bg-[#8B5CF6]",
    shadowHover: "hover:shadow-[8px_8px_0px_#8B5CF6]",
    badge: "Frontend & Fullstack",
    description: "Build reactive web portals, landing pages, interactive apps, and API integrations."
  },
  {
    id: "⚙️ Technical Team",
    title: "⚙️ Technical Team",
    icon: "⚙️",
    color: "#34D399", // Mint
    bgPill: "bg-[#34D399]",
    shadowHover: "hover:shadow-[8px_8px_0px_#34D399]",
    badge: "Systems & Backend",
    description: "Core backend architecture, database modeling, cloud services, and developer tooling."
  },
  {
    id: "🤝 Partnership & Collaboration",
    title: "🤝 Partnership & Collaboration",
    icon: "🤝",
    color: "#8B5CF6", // Violet
    bgPill: "bg-[#8B5CF6]",
    shadowHover: "hover:shadow-[8px_8px_0px_#8B5CF6]",
    badge: "Outreach & BD",
    description: "Build strategic alliances, sponsor tie-ups, campus ambassador network, and club collabs."
  },
  {
    id: "🎨 Graphic / Poster Designer",
    title: "🎨 Graphic / Poster Designer",
    icon: "🎨",
    color: "#F472B6", // Hot Pink
    bgPill: "bg-[#F472B6]",
    shadowHover: "hover:shadow-[8px_8px_0px_#F472B6]",
    badge: "Visual & UI",
    description: "Craft eye-catching event posters, vector illustrations, Instagram carousels, and branding."
  },
  {
    id: "🎬 Video Editor",
    title: "🎬 Video Editor",
    icon: "🎬",
    color: "#FBBF24", // Yellow
    bgPill: "bg-[#FBBF24]",
    shadowHover: "hover:shadow-[8px_8px_0px_#FBBF24]",
    badge: "Motion & Reels",
    description: "Edit punchy short-form reels, product demos, teaser videos with motion graphics and sound."
  },
  {
    id: "🎤 Event Management (Manager & Team)",
    title: "🎤 Event Management (Manager & Team)",
    icon: "🎤",
    color: "#34D399", // Mint
    bgPill: "bg-[#34D399]",
    shadowHover: "hover:shadow-[8px_8px_0px_#34D399]",
    badge: "Operations",
    description: "Lead hackathons, workshops, live demo days, panel scheduling, and on-ground logistics."
  }
];

export default function CandidateForm({ onNavigateAdmin }) {
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    program: '',
    yearClass: '',
    contact: '',
    gmail: '',
    post: '',
    portfolio: '',
    skills: '',
    availability: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSelectPosition = (postTitle) => {
    setFormData(prev => ({ ...prev, post: postTitle }));
    const el = document.getElementById('application-form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit application.');
      }

      const savedApp = result.application;

      // Direct Firestore write for persistent cloud backup
      try {
        if (firestoreDb && savedApp && savedApp.id) {
          const appDocRef = doc(firestoreDb, 'applications', savedApp.id);
          await setDoc(appDocRef, savedApp, { merge: true });
          console.log('[FIREBASE] Application saved to Firestore:', savedApp.id);
        }
      } catch (fbErr) {
        console.warn('[FIREBASE] Firestore client backup notice:', fbErr.message);
      }

      // Pop confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#F472B6', '#FBBF24', '#34D399', '#1E293B']
        });
      } catch (e) {}

      setSubmittedData(savedApp);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFormData({
      name: '',
      college: '',
      program: '',
      yearClass: '',
      contact: '',
      gmail: '',
      post: '',
      portfolio: '',
      skills: '',
      availability: '',
      reason: ''
    });
  };

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 relative">
        <FloatingGeometry />
        <div className="bg-white border-2 border-[#1E293B] rounded-3xl p-8 sm:p-12 text-center shadow-pop-xl relative">
          <div className="w-20 h-20 bg-[#34D399] border-2 border-[#1E293B] text-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-pop animate-wiggle">
            <CheckCircle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="inline-block bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] text-xs font-black px-4 py-1.5 rounded-full shadow-pop-sm uppercase tracking-wider mb-4">
            APPLICATION RECEIVED • {submittedData.id}
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight mb-2">
            You're In, {submittedData.name.split(' ')[0]}!
          </h2>

          <p className="font-body text-[#64748B] text-base leading-relaxed mb-6 max-w-lg mx-auto">
            Your application for the <span className="font-bold text-[#8B5CF6] underline decoration-[#F472B6] decoration-4">{submittedData.post}</span> position has been logged into the KICK TO TECH interview schedule!
          </p>

          {/* Ticket Style Box */}
          <div className="bg-[#FFFDF5] border-2 border-[#1E293B] rounded-2xl p-6 text-left mb-8 shadow-pop-sm relative">
            <div className="absolute -top-3.5 right-6">
              <StarBadge text="19 OCT" />
            </div>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md overflow-hidden border border-[#1E293B] shrink-0">
                <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-[#8B5CF6] font-heading font-black text-sm">
                KICK TO TECH • INTERVIEW BRIEF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
              <div>
                <span className="text-[#64748B] block font-semibold uppercase text-[10px]">Interview Date:</span>
                <span className="text-[#1E293B] font-bold text-sm">Monday, 19th October</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold uppercase text-[10px]">Position:</span>
                <span className="text-[#1E293B] font-bold text-sm">{submittedData.post}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold uppercase text-[10px]">Candidate Email:</span>
                <span className="text-[#1E293B] font-semibold break-all">{submittedData.gmail}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold uppercase text-[10px]">Contact / WhatsApp:</span>
                <span className="text-[#1E293B] font-semibold">{submittedData.contact}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1E293B]/20 text-xs text-[#64748B]">
              ⚡ <strong>Next Step:</strong> Our team will reach out on WhatsApp to coordinate your specific time slot on Monday.
            </div>
          </div>

          {/* Important Next Step: Join WhatsApp Group Card */}
          <div className="bg-[#DCFCE7] border-2 border-[#1E293B] rounded-2xl p-5 sm:p-6 mb-8 text-center shadow-pop relative">
            <div className="inline-block bg-[#22C55E] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-[#1E293B] shadow-pop-sm mb-2">
              MANDATORY NEXT STEP
            </div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#1E293B] mb-1.5 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#16A34A] stroke-[2.5]" />
              <span>Join Official Candidates WhatsApp Group</span>
            </h3>
            <p className="font-body text-xs sm:text-sm text-[#1E293B]/80 font-medium max-w-md mx-auto mb-4">
              All interview time slots, Google Meet links, reporting instructions, and updates for <strong>Monday, 19th October</strong> are announced in this group!
            </p>
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="candy-btn bg-[#25D366] hover:bg-[#20BD5A] text-[#1E293B] font-black w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-pop group"
            >
              <MessageCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Join WhatsApp Group Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReset}
              className="candy-btn bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1E293B] px-6 py-3 text-sm"
            >
              Submit Another Application
            </button>
            <button
              onClick={onNavigateAdmin}
              className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 text-sm flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-16 relative">
      <FloatingGeometry />

      {/* Hero Section: "Stable Grid, Wild Decoration" */}
      <div className="relative mb-10 sm:mb-14 text-center">
        {/* Official KICK TO TECH Logo Badge */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-[#15616D] border-2 sm:border-3 border-[#1E293B] overflow-hidden shadow-pop-lg group-hover:rotate-3 transition-transform flex items-center justify-center p-1 sm:p-1.5">
              <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -top-2 -right-3 sm:-top-3 sm:-right-4">
              <StarBadge text="HIRING" className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
          </div>
        </div>

        {/* Playful pill banner with hard shadow */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full font-heading font-extrabold text-[11px] sm:text-sm shadow-pop mb-4 sm:mb-6 rotate-[-1deg]">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#1E293B] stroke-[2.5]" />
          <span>INTERVIEWS ON MONDAY, 19TH OCT • HIRING DRIVE</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-black text-[#1E293B] tracking-tight leading-tight mb-3 sm:mb-4 px-2">
          Build The Next Big Thing With{' '}
          <span className="relative inline-block text-[#8B5CF6]">
            KICK TO TECH
            <Squiggle className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-4 text-[#F472B6]" />
          </span>
        </h1>

        <p className="font-body text-[#64748B] text-sm sm:text-lg max-w-2xl mx-auto font-medium mt-3 sm:mt-4 px-2">
          We're looking for driven creators, developers, designers, and organizers to join our core startup team. Pick your role below and apply for the interview on Monday, 19th October!
        </p>

        {/* WhatsApp Group Quick Action */}
        <div className="mt-5 flex justify-center">
          <a
            href={WHATSAPP_GROUP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="candy-btn bg-[#25D366] hover:bg-[#20BD5A] text-[#1E293B] px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-pop"
          >
            <MessageCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Join Official WhatsApp Group</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </a>
        </div>
      </div>

      {/* Positions Showcase Grid */}
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Open Positions
              </h2>
              <span className="bg-[#34D399] text-[#1E293B] border-2 border-[#1E293B] text-xs font-black px-2.5 py-0.5 rounded-full shadow-pop-sm">
                {POSITIONS.length} ROLES
              </span>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
              Click any card to select your post and jump to the application form
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {POSITIONS.map((pos) => {
            const isSelected = formData.post === pos.title;
            return (
              <div
                key={pos.id}
                onClick={() => handleSelectPosition(pos.title)}
                className={`sticker-card relative p-6 pt-8 cursor-pointer flex flex-col justify-between transition-all duration-300 ${
                  isSelected 
                    ? 'ring-4 ring-[#8B5CF6] shadow-pop-xl bg-[#FFFDF5] scale-[1.02]' 
                    : 'bg-white hover:bg-[#FFFDF5]'
                }`}
              >
                {/* Floating circle div sitting half-in/half-out of top border */}
                <div 
                  className="absolute -top-6 left-6 w-12 h-12 rounded-full border-2 border-[#1E293B] flex items-center justify-center text-2xl shadow-pop-sm transition-transform duration-300 group-hover:rotate-12"
                  style={{ backgroundColor: pos.color }}
                >
                  {pos.icon}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md border border-[#CBD5E1]">
                      {pos.badge}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-black shadow-pop-sm">
                        ✓
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-black text-lg text-[#1E293B] mb-2">
                    {pos.title}
                  </h3>

                  <p className="font-body text-xs text-[#64748B] leading-relaxed mb-6 font-medium">
                    {pos.description}
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-dashed border-[#E2E8F0] flex items-center justify-between text-xs font-heading font-bold">
                  <span className={isSelected ? 'text-[#8B5CF6]' : 'text-[#1E293B]'}>
                    {isSelected ? 'Selected Role' : 'Tap to Select'}
                  </span>
                  <div className={`w-7 h-7 rounded-full border-2 border-[#1E293B] flex items-center justify-center ${isSelected ? 'bg-[#8B5CF6] text-white' : 'bg-[#FFFDF5] text-[#1E293B]'}`}>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Application Form Section */}
      <div 
        id="application-form-section" 
        className="bg-white border-2 border-[#1E293B] rounded-3xl p-6 sm:p-12 shadow-pop-xl relative"
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="border-b-2 border-[#1E293B] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block bg-[#F472B6] text-white text-xs font-black px-3 py-1 rounded-full border-2 border-[#1E293B] shadow-pop-sm uppercase tracking-wider mb-2">
                CANDIDATE REGISTRATION
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#1E293B]">
                Fill In Your Details
              </h2>
              <p className="font-body text-xs sm:text-sm text-[#64748B] font-medium mt-1">
                All fields are reviewed by our hiring panel for the interview round on Monday, 19th October.
              </p>
            </div>

            <div className="shrink-0 bg-[#FFFDF5] p-3 rounded-2xl border-2 border-[#1E293B] shadow-pop-sm text-center">
              <span className="font-heading font-black text-xs text-[#64748B] block uppercase">Selected Post</span>
              <span className="font-heading font-extrabold text-sm text-[#8B5CF6] block mt-0.5">
                {formData.post || 'None Selected (Pick Below)'}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FEE2E2] border-2 border-[#EF4444] text-[#B91C1C] text-xs sm:text-sm font-semibold flex items-start gap-3 shadow-pop-sm">
              <AlertCircle className="w-5 h-5 shrink-0 stroke-[2.5]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Full Name & Gmail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  Gmail / Email Address <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  name="gmail"
                  required
                  value={formData.gmail}
                  onChange={handleChange}
                  placeholder="e.g. rahul.sharma@gmail.com"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
              </div>
            </div>

            {/* Row 2: Contact Number & College */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  Contact / WhatsApp Number <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="tel"
                  name="contact"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="e.g. 9820123456"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
                <span className="text-[11px] text-[#64748B] font-medium mt-1.5 block">
                  Used by our coordinator to confirm your interview slot on Monday 19th Oct.
                </span>
              </div>

              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  College / Institute (Clg) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  name="college"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g. Somaiya, Mithibai, DJ Sanghvi, VJTI, NMIMS..."
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
              </div>
            </div>

            {/* Row 3: Program & Class/Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  Program / Degree / Branch <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  name="program"
                  required
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Engg / BCA / BAMMC / BMS / B.Des"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                  Class / Year <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  name="yearClass"
                  required
                  value={formData.yearClass}
                  onChange={handleChange}
                  className="geometric-input w-full px-4 py-3 text-sm font-medium"
                >
                  <option value="" disabled>-- Select Your Class / Year --</option>
                  <option value="1st Year (FY)">1st Year (FY)</option>
                  <option value="2nd Year (SY)">2nd Year (SY)</option>
                  <option value="3rd Year (TY)">3rd Year (TY)</option>
                  <option value="4th Year (Final Year)">4th Year (Final Year)</option>
                  <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  <option value="Recent Graduate">Recent Graduate</option>
                </select>
              </div>
            </div>

            {/* Row 4: Position (Post) Selection */}
            <div>
              <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                Position Applying For (Post) <span className="text-[#EF4444]">*</span>
              </label>
              <select
                name="post"
                required
                value={formData.post}
                onChange={handleChange}
                className="geometric-input w-full px-4 py-3 text-sm font-bold text-[#8B5CF6]"
              >
                <option value="" disabled>-- Select a Role --</option>
                {POSITIONS.map(p => (
                  <option key={p.id} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 5: Additional Value Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2 flex items-center justify-between">
                  <span>Portfolio / Drive / GitHub / Behance</span>
                  <span className="text-[#8B5CF6] text-[10px] normal-case font-bold">(Highly Recommended)</span>
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://github.com/... or Behance/Drive link"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
                <span className="text-[11px] text-[#64748B] font-medium mt-1.5 block">
                  Crucial for Web Team, Designers, and Video Editors!
                </span>
              </div>

              <div>
                <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2 flex items-center justify-between">
                  <span>Key Skills / Tools</span>
                  <span className="text-[#8B5CF6] text-[10px] normal-case font-bold">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. Figma, React, Premiere Pro, Canva, Node.js"
                  className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8]"
                />
              </div>
            </div>

            {/* Row 6: Interview Availability on Monday 19th Oct */}
            <div>
              <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                Availability for Interview (Monday, 19th October) <span className="text-[#EF4444]">*</span>
              </label>
              <select
                name="availability"
                required
                value={formData.availability}
                onChange={handleChange}
                className="geometric-input w-full px-4 py-3 text-sm font-medium"
              >
                <option value="" disabled>-- Select Your Availability --</option>
                <option value="Yes, fully available on Monday, 19th October">
                  Yes, fully available on Monday, 19th October
                </option>
                <option value="Available Morning Slot (10:00 AM - 1:00 PM)">
                  Available Morning Slot (10:00 AM - 1:00 PM)
                </option>
                <option value="Available Afternoon Slot (2:00 PM - 5:00 PM)">
                  Available Afternoon Slot (2:00 PM - 5:00 PM)
                </option>
                <option value="Available Evening Slot (After 5:00 PM)">
                  Available Evening Slot (After 5:00 PM)
                </option>
                <option value="Need an alternate timing / online meet">
                  Need an alternate timing / online meet
                </option>
              </select>
            </div>

            {/* Row 7: Reason to Apply */}
            <div>
              <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-2">
                Reason to Apply & Why Should We Choose You? <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                name="reason"
                required
                rows={4}
                value={formData.reason}
                onChange={handleChange}
                placeholder="Tell us what excites you about KICKTOTECH, your previous club/project experience, what value you can add, and your expectations..."
                className="geometric-input w-full px-4 py-3 text-sm font-medium placeholder-[#94A3B8] leading-relaxed resize-y"
              ></textarea>
            </div>

            {/* Candy Button Submit */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={loading}
                className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-full sm:w-auto px-10 py-4 text-base shadow-pop group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting Application...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Submit Application for Oct 19 Interview</span>
                    <div className="w-8 h-8 rounded-full bg-white text-[#1E293B] flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                )}
              </button>
              <p className="font-body text-xs text-[#64748B] mt-3 font-medium">
                🚀 By submitting, you'll be considered for the KICKTOTECH hiring interview on Monday, 19th October.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
