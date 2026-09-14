/**
 * TwinHands-AI: Creator Profile & Contact Modal
 * Author: Badal Kumar Sahu (Data Analyst & Generative AI Specialist)
 * Features:
 * - Glassmorphism card with subtle 3D / holographic glow
 * - Spider-Man inspired dual red/blue glowing accents
 * - Verified LinkedIn, GitHub, and mailto actions
 * - Full keyboard accessibility (Tab, Enter, Space, Escape)
 * - Safe target="_blank" rel="noopener noreferrer" external links
 */

import React, { useEffect, useRef } from 'react';
import { Linkedin, Github, Mail, ExternalLink, X, Sparkles, Award, Terminal } from 'lucide-react';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus close button on open for keyboard users
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-profile-name"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* 3D Holographic Card Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2),0_0_50px_rgba(37,99,235,0.2)] backdrop-blur-2xl p-6 sm:p-7 overflow-hidden text-slate-100 transition-all transform scale-100"
      >
        {/* Subtle Spider-Man Red & Blue Ambient Glow Orbs */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-2xl" />

        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Creator Identity • Lead Architect
            </span>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close creator profile dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Center Content */}
        <div className="py-6 flex flex-col items-center text-center relative z-10 space-y-4">
          {/* Holographic Avatar Emblem */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 via-purple-600 to-blue-600 p-[2px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-blue-500/10" />
                <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-blue-400 font-mono">
                  BKS
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 rounded-full p-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <h2
              id="creator-profile-name"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2"
            >
              <span>Badal Kumar Sahu</span>
            </h2>
            <p className="mt-1 text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300">
              Data Analyst & Generative AI Specialist
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              Architect of the TwinHands-AI Multimodal Physical AI system, dual SO-101 bimanual coordination, and real-time MuJoCo kinematics.
            </p>
          </div>

          {/* Specialization Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-red-400" /> Physical AI
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-400" /> Bimanual Robotics
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Generative AI
            </span>
          </div>
        </div>

        {/* Three Clearly Visible Contact Actions */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-4">
          
          {/* 1. LinkedIn */}
          <a
            href="https://www.linkedin.com/in/badalsahu200ns/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Badal Kumar Sahu on LinkedIn (opens in a new tab)"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-900/90 hover:bg-[#0077b5]/15 border border-slate-800 hover:border-[#0077b5]/50 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-[#0077b5]/20 focus:outline-none focus:ring-2 focus:ring-[#0077b5]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0a66c2] group-hover:scale-110 transition-transform">
              <Linkedin className="w-5 h-5 fill-current" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1">
              LinkedIn
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
              Professional Network
            </span>
          </a>

          {/* 2. GitHub */}
          <a
            href="https://github.com/badalsahu200ns-png"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Badal Kumar Sahu on GitHub (opens in a new tab)"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-slate-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-100 group-hover:scale-110 transition-transform">
              <Github className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1">
              GitHub
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
              Code & Repositories
            </span>
          </a>

          {/* 3. Email */}
          <a
            href="mailto:badalsahu200ns@gmail.com"
            aria-label="Send email to Badal Kumar Sahu (opens mail client)"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1">
              Email
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
              Direct Contact
            </span>
          </a>

        </div>

        {/* Modal Bottom / Close Action */}
        <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[9px]">ESC</kbd> to exit
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            [ CLOSE ]
          </button>
        </div>

      </div>
    </div>
  );
};
