import React, { useState } from 'react';
import { ASSET_IMAGES } from '../data/initialData';
import { SiteLogos, ViewMode } from '../types';
import {
  authenticateCMSUser,
  resetSuperAdminCredentials,
  IS_FIREBASE_CONFIGURED,
  LOCAL_DEV_PASSWORD,
  SUPERADMIN_EMAILS,
} from '../lib/cmsAuth';

interface CMSLoginScreenProps {
  logos?: SiteLogos;
  onLoginSuccess: () => void;
  onViewChange: (view: ViewMode) => void;
}

export const CMSLoginScreen: React.FC<CMSLoginScreenProps> = ({
  logos,
  onLoginSuccess,
  onViewChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const result = await authenticateCMSUser(email, password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setErrorMessage(result.message || 'Erro ao realizar login.');
    }
  };

  const handleResetSuperAdmin = () => {
    resetSuperAdminCredentials();
    setErrorMessage(null);
    setInfoMessage('Sua conta SuperAdmin foi restaurada com sucesso! Tente fazer login com suas credenciais.');
  };

  return (
    <div className="bg-[#101828] text-slate-100 min-h-screen relative font-sans overflow-hidden flex flex-col justify-between">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full opacity-20"
        style={{ backgroundImage: `url(${ASSET_IMAGES.heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a111e] via-[#151515] to-[#0a111e]"></div>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[90vh] p-4 md:p-10">
        <div className="w-full max-w-[440px] rounded-2xl p-8 bg-slate-900/90 border border-slate-700/80 shadow-2xl relative backdrop-blur-md">
          
          {/* Back to Public Site link */}
          <button
            type="button"
            onClick={() => onViewChange('public')}
            className="absolute top-4 left-4 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Voltar ao Site</span>
          </button>

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mt-2 mb-5">
            <div
              className="bg-white rounded-2xl p-2 shadow-md mb-3 flex items-center justify-center transition-all"
              style={{
                height: logos?.logoLoginHeightPx ? `${Math.max(48, (logos.logoLoginHeightPx || 56) + 24)}px` : undefined,
                minWidth: logos?.logoLoginHeightPx ? `${Math.max(48, (logos.logoLoginHeightPx || 56) + 24)}px` : undefined,
              }}
            >
              <img
                src={ASSET_IMAGES.logoFull}
                alt="Confficar Logo"
                style={{
                  height: logos?.logoLoginHeightPx ? `${logos.logoLoginHeightPx}px` : undefined
                }}
                className="w-auto max-w-full object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              <span>Acesso Restrito - Gestão do Site</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Login do Painel CMS</h1>
            <p className="text-xs text-slate-400">
              Digite seu e-mail e senha de administrador para gerenciar o conteúdo.
            </p>
          </div>

          {!IS_FIREBASE_CONFIGURED && (
            <div className="mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/40 text-sky-200 text-xs font-semibold flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Modo local: Firebase ainda não configurado.</span>
              </div>
              <span className="font-mono text-[11px] text-sky-100">E-mail: {SUPERADMIN_EMAILS[0]}</span>
              <span className="font-mono text-[11px] text-sky-100">Senha: {LOCAL_DEV_PASSWORD}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-bold flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleResetSuperAdmin}
                className="self-start text-[11px] text-amber-300 underline font-semibold hover:text-amber-200 cursor-pointer"
              >
                Restaurar Acesso Padrão do SuperAdmin
              </button>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cms-email" className="block text-xs font-bold text-slate-300 mb-1">
                E-mail de Administrador
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                  mail
                </span>
                <input
                  id="cms-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="digite seu e-mail"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cms-password" className="block text-xs font-bold text-slate-300 mb-1">
                Senha do CMS
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                  lock
                </span>
                <input
                  id="cms-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Acessar Painel CMS</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center flex items-center justify-between text-[11px] text-slate-400">
            <span>Precisa entrar no Sistema Operacional?</span>
            <button
              type="button"
              onClick={() => onViewChange('login')}
              className="text-gold-400 hover:underline font-bold cursor-pointer"
            >
              Painel de Sistemas →
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
