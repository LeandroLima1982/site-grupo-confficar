import React, { useState, useEffect } from 'react';
import { SEOSettings } from '../types';

interface SEOManagerProps {
  seo: SEOSettings;
  onUpdateSEO: (newSeo: SEOSettings) => void;
  isDark?: boolean;
}

const DEFAULT_KEYWORD_SUGGESTIONS = [
  'transporte executivo sp',
  'transfer aeroporto guarulhos',
  'aluguel de van com motorista',
  'carro blindado corporativo',
  'motorista bilingue',
  'transfer congonhas',
  'mobilidade corporativa',
  'transporte para eventos sp',
  'transfer viracopos executivo',
  'frota blindada nivel 3a',
  'fretamento executivo',
  'carro com motorista particular',
];

export const SEOManager: React.FC<SEOManagerProps> = ({ seo, onUpdateSEO, isDark = false }) => {
  const [form, setForm] = useState<SEOSettings>(seo);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'basico' | 'keywords' | 'social' | 'schema'>('basico');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setForm(seo);
  }, [seo]);

  // Calculate days since last title change
  const daysSinceTitleChange = () => {
    if (!form.lastTitleChangeDate) return 180;
    const lastDate = new Date(form.lastTitleChangeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = Math.max(0, 180 - daysSinceTitleChange());
  const isTitleWarningActive = daysLeft > 0;

  // SEO Health Score calculation
  const calculateSeoScore = () => {
    let score = 0;
    const titleLen = form.metaTitle.length;
    if (titleLen >= 30 && titleLen <= 65) score += 20;
    else if (titleLen > 0) score += 10;

    const descLen = form.metaDescription.length;
    if (descLen >= 110 && descLen <= 165) score += 20;
    else if (descLen > 0) score += 10;

    if (form.keywords && form.keywords.length >= 5) score += 20;
    else if (form.keywords && form.keywords.length > 0) score += 10;

    if (form.ogImage && form.ogImage.trim() !== '') score += 15;
    if (form.canonicalUrl && form.canonicalUrl.startsWith('http')) score += 15;

    try {
      if (form.structuredDataJson) {
        JSON.parse(form.structuredDataJson);
        score += 10;
      }
    } catch {
      // invalid json
    }

    return Math.min(100, score);
  };

  const seoScore = calculateSeoScore();

  // Handlers
  const handleAddKeyword = (kw: string) => {
    const cleaned = kw.trim().toLowerCase();
    if (!cleaned) return;
    if (!form.keywords.includes(cleaned)) {
      setForm((prev) => ({
        ...prev,
        keywords: [...prev.keywords, cleaned],
      }));
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kwToRemove),
    }));
  };

  const handleJsonChange = (val: string) => {
    setForm((prev) => ({ ...prev, structuredDataJson: val }));
    try {
      if (val.trim()) {
        JSON.parse(val);
      }
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'JSON inválido');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const titleHasChanged = form.metaTitle !== seo.metaTitle;
    const nowIso = new Date().toISOString();

    const updatedData: SEOSettings = {
      ...form,
      lastUpdatedDate: nowIso,
      lastTitleChangeDate: titleHasChanged ? nowIso : form.lastTitleChangeDate || nowIso,
    };

    onUpdateSEO(updatedData);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 4000);
  };

  const cardBgClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const inputBgClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-gold-400'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#0A0A0A]';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#0A0A0A] text-[26px]">travel_explore</span>
              <h2 className="text-xl font-bold tracking-tight">Painel de Otimização SEO Google</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">bolt</span> Live Sync
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Gerencie títulos meta, palavras-chave e pré-visualizações nos buscadores para maximizar o ranqueamento orgânico do seu site.
            </p>
          </div>

          {/* Health Score Pill */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-4 shrink-0 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className={isDark ? 'text-slate-700' : 'text-slate-200'}
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={seoScore >= 80 ? 'text-emerald-500' : seoScore >= 60 ? 'text-amber-500' : 'text-rose-500'}
                  strokeDasharray={`${seoScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-extrabold text-xs">{seoScore}%</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pontuação SEO</div>
              <div className={`text-sm font-extrabold ${
                seoScore >= 80 ? 'text-emerald-500' : seoScore >= 60 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {seoScore >= 80 ? 'Excelente Otimização' : seoScore >= 60 ? 'Boa Otimização' : 'Necessita Ajustes'}
              </div>
            </div>
          </div>
        </div>

        {/* Google Re-indexing Recommendation Warning Banner */}
        <div className={`mt-5 p-4 rounded-xl border text-xs leading-relaxed ${
          isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-500 shrink-0 mt-0.5">info</span>
            <div className="space-y-1">
              <p className="font-bold">
                💡 Diretrizes de Indexação e Atualização SEO no Google:
              </p>
              <p>
                Os algoritmos do Google necessitam de <strong>alguns meses (até 6 meses)</strong> para analisar, indexar e consolidar a autoridade do seu <strong>Título Principal (Meta Title)</strong>. Recomenda-se evitar alterar o Título Principal repetidamente em prazos inferiores a 6 meses para preservar o ranqueamento orgânico.
              </p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 pt-0.5">
                ✨ <strong>Entretanto, as Palavras-Chave (Keywords) e Meta Tags podem ser atualizadas e enriquecidas a qualquer momento</strong> para capturar novas buscas e impulsionar suas campanhas corporativas sem qualquer restrição!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Toast Notification */}
      {showSaveAlert && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
            <span>Configurações de SEO salvas com sucesso! O site público foi atualizado com as novas tags.</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left / Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Area */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section Navigation Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('basico')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'basico'
                  ? 'bg-[#0A0A0A] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Google & Meta Tags</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'keywords'
                  ? 'bg-[#0A0A0A] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>Palavras-Chave ({form.keywords?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-[#0A0A0A] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>Redes / WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-[#0A0A0A] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
              <span>Schema JSON-LD</span>
            </button>
          </div>

          <form onSubmit={handleSave} className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} space-y-5`}>
            {/* Tab 1: Google & Basic Meta Tags */}
            {activeTab === 'basico' && (
              <div className="space-y-4">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Meta Tags de Busca Principal</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Campos exibidos diretamente nos resultados de pesquisa do Google.
                    </p>
                  </div>
                </div>

                {/* Meta Title Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">
                      Título SEO (Meta Title) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[11px] font-mono font-semibold ${
                      form.metaTitle.length > 60 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {form.metaTitle.length} / 60 caracteres (Ideal: 50-60)
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    placeholder="Ex: Confficar | Transporte Executivo VIP"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                  {isTitleWarningActive && (
                    <div className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      <span>
                        Aviso: O título principal foi alterado recentemente. Recomendação: manter estabilidade por 6 meses para fortalecer indexação.
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta Description Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">
                      Meta Description (Resumo para Busca) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[11px] font-mono font-semibold ${
                      form.metaDescription.length > 160 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {form.metaDescription.length} / 160 caracteres (Ideal: 120-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={220}
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Ex: Serviço especializado de transporte executivo, transfer em aeroportos e vans de luxo com motoristas bilíngues..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                </div>

                {/* Canonical URL & Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                      URL Canônica Oficial
                    </label>
                    <input
                      type="url"
                      value={form.canonicalUrl}
                      onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                      placeholder="https://grupoconficar.com.br/"
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${inputBgClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Robots (Indexação)
                    </label>
                    <select
                      value={form.robots}
                      onChange={(e) => setForm({ ...form, robots: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${inputBgClass}`}
                    >
                      <option value="index, follow">Index, Follow (Permitir total no Google - Recomendado)</option>
                      <option value="noindex, follow">NoIndex, Follow (Ocultar da busca, seguir links)</option>
                      <option value="index, nofollow">Index, NoFollow (Exibir na busca, ignorar links)</option>
                      <option value="noindex, nofollow">NoIndex, NoFollow (Bloqueio total)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Autor da Página / Marca
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${inputBgClass}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                      Nome do Site (siteName)
                    </label>
                    <input
                      type="text"
                      value={form.siteName}
                      onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${inputBgClass}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Keywords Management Suite */}
            {activeTab === 'keywords' && (
              <div className="space-y-4">
                <div className="border-b pb-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Palavras-Chave Estratégicas (Keywords)</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Adicione novos termos e frases de busca a qualquer momento para capturar mais clientes.
                      </p>
                    </div>
                    <span className="bg-gold-100 text-[#0A0A0A] text-xs px-2.5 py-1 rounded-lg font-extrabold">
                      {form.keywords?.length || 0} Cadastradas
                    </span>
                  </div>
                </div>

                {/* Input Add Keyword */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword(newKeywordInput);
                      }
                    }}
                    placeholder="Digite uma nova palavra-chave e pressione Enter..."
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddKeyword(newKeywordInput)}
                    className="px-4 py-2.5 bg-[#0A0A0A] text-white font-bold text-xs rounded-xl hover:bg-[#1A1A1A] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Active Keyword Chips */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Palavras-Chave Ativas no Site
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                    {form.keywords?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhuma palavra-chave cadastrada. Adicione abaixo.</p>
                    ) : (
                      form.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0A0A0A] text-white shadow-2xs"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick 1-Click Suggestions */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#0A0A0A] dark:text-gold-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>Sugestões Prontas de Alta Relevância (Clique para adicionar):</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_KEYWORD_SUGGESTIONS.filter((sug) => !form.keywords.includes(sug)).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddKeyword(sug)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-gold-50 hover:text-[#0A0A0A] hover:border-gold-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">add_circle</span>
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Open Graph / Social Media */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="border-b pb-3 mb-2">
                  <h3 className="font-bold text-base">Compartilhamento Redes Sociais & WhatsApp (Open Graph)</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure como o link do seu site será exibido no WhatsApp, LinkedIn e redes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Título de Compartilhamento (og:title)
                  </label>
                  <input
                    type="text"
                    value={form.ogTitle}
                    onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                    placeholder="Confficar | Transporte Executivo"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Descrição de Compartilhamento (og:description)
                  </label>
                  <textarea
                    rows={2}
                    value={form.ogDescription}
                    onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                    placeholder="Descrição para ser exibida nos cards de redes sociais e grupos..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    URL da Imagem do Card (og:image)
                  </label>
                  <input
                    type="url"
                    value={form.ogImage}
                    onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                    placeholder="https://sua-imagem.com/banner-og.jpg"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${inputBgClass}`}
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Schema.org JSON-LD */}
            {activeTab === 'schema' && (
              <div className="space-y-4">
                <div className="border-b pb-3 mb-2">
                  <h3 className="font-bold text-base">Dados Estruturados Schema.org (JSON-LD)</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Permite ao Google exibir rich snippets (endereço, preços e serviços) diretamente na busca.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider">
                      Código JSON-LD
                    </label>
                    {jsonError && (
                      <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {jsonError}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    value={form.structuredDataJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className={`w-full p-3 rounded-xl border font-mono text-xs leading-relaxed transition-all ${
                      jsonError
                        ? 'border-rose-400 bg-rose-50/20'
                        : inputBgClass
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t flex items-center justify-between">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {form.lastUpdatedDate
                  ? `Última atualização em: ${new Date(form.lastUpdatedDate).toLocaleDateString('pt-BR')} às ${new Date(form.lastUpdatedDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Nenhuma edição salva.'}
              </span>

              <button
                type="submit"
                className="px-6 py-3 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Salvar Configurações de SEO</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Preview Area */}
        <div className="lg:col-span-5 space-y-5">
          {/* Google SERP Live Mockup */}
          <div className={`p-5 rounded-2xl border shadow-sm ${cardBgClass} space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-500 text-[20px]">preview</span>
                <h3 className="font-bold text-sm uppercase tracking-wider">Pré-visualização Google (SERP)</h3>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">
                Google Search
              </span>
            </div>

            {/* Mock Google Card */}
            <div className="p-4 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-xs font-sans space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                <div className="w-4 h-4 rounded-full bg-[#0A0A0A] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                  A
                </div>
                <span className="truncate text-slate-800 font-medium">
                  {form.siteName || 'Confficar Mobilidade'}
                </span>
                <span className="text-slate-400 text-[10px]">›</span>
                <span className="truncate text-slate-500 text-[11px]">
                  {form.canonicalUrl || 'https://grupoconficar.com.br'}
                </span>
              </div>

              <h4 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-tight truncate">
                {form.metaTitle || 'Título da sua página em construção...'}
              </h4>

              <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {form.metaDescription || 'Descrição para busca do Google em construção...'}
              </p>
            </div>

            {/* Length Health Checkers */}
            <div className="space-y-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span>Tamanho do Título</span>
                  <span className={form.metaTitle.length > 60 ? 'text-amber-500' : 'text-emerald-600'}>
                    {form.metaTitle.length}/60 chars
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      form.metaTitle.length > 65
                        ? 'bg-rose-500'
                        : form.metaTitle.length >= 45
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (form.metaTitle.length / 60) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span>Tamanho da Meta Description</span>
                  <span className={form.metaDescription.length > 160 ? 'text-amber-500' : 'text-emerald-600'}>
                    {form.metaDescription.length}/160 chars
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      form.metaDescription.length > 165
                        ? 'bg-rose-500'
                        : form.metaDescription.length >= 120
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (form.metaDescription.length / 160) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Share WhatsApp Mockup */}
          <div className={`p-5 rounded-2xl border shadow-sm ${cardBgClass} space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">chat</span>
                <h3 className="font-bold text-sm uppercase tracking-wider">Card de Compartilhamento WhatsApp</h3>
              </div>
            </div>

            <div className="max-w-xs mx-auto p-2.5 rounded-xl bg-[#075e54] text-white text-xs space-y-2 shadow-md">
              <div className="p-2 rounded-lg bg-[#efeae2] text-slate-800 space-y-1">
                {form.ogImage ? (
                  <img
                    src={form.ogImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-28 bg-slate-300 rounded-md flex items-center justify-center text-slate-500 font-bold">
                    Sem Imagem OG
                  </div>
                )}
                <div className="pt-1">
                  <div className="font-bold text-xs truncate text-[#0A0A0A]">
                    {form.ogTitle || form.metaTitle}
                  </div>
                  <div className="text-[10px] text-slate-600 line-clamp-2 leading-tight">
                    {form.ogDescription || form.metaDescription}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    {form.siteName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
