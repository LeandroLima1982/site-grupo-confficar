import React, { useState } from 'react';
import { ASSET_IMAGES } from '../data/initialData';
import { SiteLogos, UserRole, ViewMode } from '../types';
import { DEFAULT_SUPERADMIN, getLoggedCMSUser, setLoggedCMSUser } from '../lib/cmsAuth';

interface LoginScreenProps {
  logos?: SiteLogos;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLoginSuccess: () => void;
  onViewChange: (view: ViewMode) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  logos,
  activeRole,
  onRoleChange,
  onLoginSuccess,
  onViewChange,
}) => {
  const [username, setUsername] = useState('admin@grupoconficar.com.br');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getLoggedCMSUser()) {
      setLoggedCMSUser(DEFAULT_SUPERADMIN);
    }
    onLoginSuccess();
  };

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    if (role === 'empresa') {
      setUsername('empresa.diretoria@grupoconficar.com.br');
    } else if (role === 'motorista') {
      setUsername('motorista.bilingue@grupoconficar.com.br');
    } else {
      setUsername('equipe.operacoes@grupoconficar.com.br');
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen relative font-body-md overflow-hidden flex flex-col justify-between">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{ backgroundImage: `url(${ASSET_IMAGES.loginBg})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#1c1b1b]/55"></div>

      {/* Main Content Container */}
      <main className="relative z-10 flex items-center justify-center min-h-[90vh] p-4 md:p-10">
        <div className="glass-panel w-full max-w-[480px] rounded-2xl p-8 md:p-10 flex flex-col items-center border border-[#c1c7d2]/40 shadow-2xl relative">
          
          {/* Back to Public Site link */}
          <button
            onClick={() => onViewChange('public')}
            className="absolute top-4 left-4 text-xs font-semibold text-[#414750] hover:text-[#0A0A0A] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Voltar ao Site</span>
          </button>

          {/* Logo */}
          <div
            className="my-4 bg-white rounded-full overflow-hidden shadow-sm border border-[#c1c7d2]/40 flex items-center justify-center p-2.5 transition-all"
            style={{
              height: logos?.logoLoginHeightPx ? `${Math.max(56, (logos.logoLoginHeightPx || 56) + 28)}px` : undefined,
              width: logos?.logoLoginHeightPx ? `${Math.max(56, (logos.logoLoginHeightPx || 56) + 28)}px` : undefined,
            }}
          >
            <img
              src={logos?.logoLogin || ASSET_IMAGES.logoLogin}
              alt="Confficar Logo Login"
              style={{
                height: logos?.logoLoginHeightPx ? `${logos.logoLoginHeightPx}px` : undefined
              }}
              className="w-auto max-w-full object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6 w-full">
            <h1 className="text-2xl font-bold text-[#1c1b1b] mb-1">Acesso ao Sistema</h1>
            <p className="text-xs text-[#414750]">Selecione seu perfil para continuar</p>
          </div>

          {/* Profile Tabs (Segmented Control) */}
          <div className="w-full bg-[#f0eded] rounded-lg p-1 flex mb-6 border border-[#c1c7d2]/50" role="tablist">
            <button
              type="button"
              onClick={() => handleRoleSelect('empresa')}
              className={`flex-1 text-xs font-semibold py-2.5 rounded transition-all duration-200 cursor-pointer ${
                activeRole === 'empresa'
                  ? 'bg-white shadow-sm text-[#0A0A0A]'
                  : 'text-[#414750] hover:text-[#1c1b1b]'
              }`}
            >
              Empresa
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('motorista')}
              className={`flex-1 text-xs font-semibold py-2.5 rounded transition-all duration-200 cursor-pointer ${
                activeRole === 'motorista'
                  ? 'bg-white shadow-sm text-[#0A0A0A]'
                  : 'text-[#414750] hover:text-[#1c1b1b]'
              }`}
            >
              Motorista
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('equipe')}
              className={`flex-1 text-xs font-semibold py-2.5 rounded transition-all duration-200 cursor-pointer ${
                activeRole === 'equipe'
                  ? 'bg-white shadow-sm text-[#0A0A0A]'
                  : 'text-[#414750] hover:text-[#1c1b1b]'
              }`}
            >
              Equipe
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Input: Email/Usuário */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-[#414750]">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#727781] text-[20px]">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu acesso"
                  className="w-full bg-white border border-[#c1c7d2] rounded-lg pl-10 pr-4 py-3 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors placeholder:text-[#727781]"
                  required
                />
              </div>
            </div>

            {/* Input: Senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-[#414750]">
                Senha
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#727781] text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#c1c7d2] rounded-lg pl-10 pr-10 py-3 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-colors placeholder:text-[#727781]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727781] hover:text-[#1c1b1b] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Options */}
            <div className="flex items-center justify-between mt-1 text-xs">
              <label className="flex items-center gap-1.5 text-[#414750] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#0A0A0A] focus:ring-[#0A0A0A]"
                />
                <span>Lembrar meu acesso</span>
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Instruções de recuperação de senha enviadas para o seu e-mail corporativo cadastrado.'); }} className="text-[#0A0A0A] font-semibold hover:underline">
                Esqueci minha senha
              </a>
            </div>

            {/* CTA */}
            <button
              type="submit"
              className="w-full bg-[#0A0A0A] text-white text-xs font-semibold py-3.5 rounded-lg mt-2 hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <span>Entrar no Sistema</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-4 border-t border-[#c1c7d2]/40 w-full text-center">
            <p className="text-[11px] text-[#414750] mb-2 font-semibold">
              Acesso aos Painéis & Subdomínio Operacional:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href="https://app.grupoconficar.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                <span>Subdomínio app.grupoconficar.com.br</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  if (!getLoggedCMSUser()) {
                    setLoggedCMSUser(DEFAULT_SUPERADMIN);
                  }
                  onLoginSuccess();
                }}
                className="bg-[#0A0A0A]/10 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
              >
                Simulador Operacional Integrado
              </button>
              <button
                type="button"
                onClick={() => onViewChange('cms-login')}
                className="bg-amber-500/15 text-amber-900 border border-amber-300 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">shield_person</span>
                <span>Painel CMS do Site</span>
              </button>
            </div>
          </div>

          {/* Footer minimal */}
          <div className="mt-4 text-center space-y-1">
            <p className="text-[11px] text-[#414750]/70">
              © 2026 Confficar.
            </p>
            <p className="text-[11px] text-[#414750]/80">
              Desenvolvido por:{' '}
              <a
                href="https://transporteapp.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0A0A0A] hover:underline"
              >
                Transporteapp
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
