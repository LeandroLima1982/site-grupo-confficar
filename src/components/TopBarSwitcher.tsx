import React from 'react';
import { AdminSection, UserRole, ViewMode } from '../types';

interface TopBarSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentAdminSection: AdminSection;
  onAdminSectionChange: (section: AdminSection) => void;
}

export const TopBarSwitcher: React.FC<TopBarSwitcherProps> = ({
  currentView,
  onViewChange,
  activeRole,
  onRoleChange,
  currentAdminSection,
  onAdminSectionChange,
}) => {
  return (
    <div className="bg-[#1c1b1b] text-white border-b border-[#313030] text-xs py-2 px-4 sticky top-0 z-[100] shadow-md flex flex-wrap items-center justify-between gap-3">
      {/* App branding & Mode indicator */}
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">directions_car</span>
          Confficar Suite
        </span>
        <span className="hidden sm:inline-block text-[#c1c7d2]">|</span>
        <span className="text-[#c1c7d2] hidden sm:inline-block">Alternar Telas do Aplicativo:</span>
      </div>

      {/* Primary Navigation Buttons for the 3 requested screens */}
      <div className="flex items-center gap-1 bg-[#313030] p-1 rounded-lg">
        <button
          onClick={() => onViewChange('public')}
          className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
            currentView === 'public'
              ? 'bg-[#1A1A1A] text-white shadow'
              : 'text-[#c1c7d2] hover:text-white hover:bg-[#414750]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>1. Site Público (Home)</span>
        </button>

        <button
          onClick={() => onViewChange('login')}
          className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
            currentView === 'login'
              ? 'bg-[#1A1A1A] text-white shadow'
              : 'text-[#c1c7d2] hover:text-white hover:bg-[#414750]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>2. Tela de Login</span>
        </button>

        <button
          onClick={() => onViewChange('admin')}
          className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
            currentView === 'admin'
              ? 'bg-[#1A1A1A] text-white shadow'
              : 'text-[#c1c7d2] hover:text-white hover:bg-[#414750]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
          <span>3. Painel Admin (CMS)</span>
        </button>
      </div>

      {/* Context info depending on active screen */}
      <div className="flex items-center gap-2 text-[#c1c7d2]">
        {currentView === 'login' && (
          <div className="flex items-center gap-1 text-[11px]">
            <span>Perfil:</span>
            <span className="font-semibold capitalize text-[#D4AF37]">{activeRole}</span>
          </div>
        )}
        {currentView === 'admin' && (
          <div className="flex items-center gap-1 text-[11px] bg-[#313030] px-2 py-1 rounded border border-[#727781]/30">
            <span>Seção:</span>
            <span className="font-semibold text-white capitalize">{currentAdminSection}</span>
          </div>
        )}
        {currentView === 'public' && (
          <button
            onClick={() => onViewChange('login')}
            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">computer</span>
            <span>ACESSAR SISTEMA</span>
          </button>
        )}
      </div>
    </div>
  );
};
