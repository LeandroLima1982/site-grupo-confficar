import React, { useState, useEffect } from 'react';
import { CloudinaryConfig, getCloudinaryConfig, saveCloudinaryConfig, uploadImageToCloudinary } from '../lib/cloudinary';

interface CloudinarySettingsProps {
  isDark?: boolean;
  config?: CloudinaryConfig;
  onConfigSaved?: (config: CloudinaryConfig) => void;
}

export const CloudinarySettings: React.FC<CloudinarySettingsProps> = ({
  isDark = false,
  config: externalConfig,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<CloudinaryConfig>(() => ({
    ...getCloudinaryConfig(),
    ...(externalConfig || {}),
  }));
  const [testFile, setTestFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    setConfig((prev) => ({ ...prev, ...(externalConfig || {}) }));
  }, [externalConfig]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = { cloudName: config.cloudName.trim(), uploadPreset: config.uploadPreset.trim() };
    saveCloudinaryConfig(trimmed);
    onConfigSaved?.(trimmed);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3500);
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTestResult(null);

    try {
      const res = await uploadImageToCloudinary(file, config);
      if (res.isCloudinary) {
        setTestResult({
          success: true,
          message: ' Upload realizado com sucesso no Cloudinary CDN!',
          url: res.url,
        });
      } else {
        setTestResult({
          success: false,
          message: ' Cloudinary não configurado. A imagem foi gerada como base64 local.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro ao realizar o teste de upload.',
      });
    } finally {
      setUploading(false);
    }
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
              <span className="material-symbols-outlined text-[#0A0A0A] text-[28px]">cloud_upload</span>
              <h2 className="text-xl font-bold tracking-tight">Integração Cloudinary (Imagens na Nuvem)</h2>
              <span className="bg-gold-100 text-gold-700 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span> 25 GB Grátis
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Conecte sua conta do Cloudinary para salvar fotos de frota, logos e banners com links ultrarrápidos e permanentes, ideais para o site na Vercel.
            </p>
          </div>
        </div>
      </div>

      {showSaveToast && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[22px]">check_circle</span>
          <span>Configurações do Cloudinary salvas na nuvem. Todos os usuários do painel agora usam o Cloudinary nos uploads!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Credentials Form */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSave} className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} space-y-5`}>
            <h3 className="font-bold text-base border-b pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0A0A0A]">key</span>
              <span>Credenciais da Conta Cloudinary</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                Cloud Name (Nome da sua Nuvem) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.cloudName}
                onChange={(e) => setConfig({ ...config, cloudName: e.target.value.trim() })}
                placeholder="Ex: dxy123abc"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-all ${inputBgClass}`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Encontrado no Dashboard inicial do seu Cloudinary.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                Upload Preset (Unsigned / Sem assinatura) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={config.uploadPreset}
                onChange={(e) => setConfig({ ...config, uploadPreset: e.target.value.trim() })}
                placeholder="Ex: confficar_preset"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-medium transition-all ${inputBgClass}`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Crie em: Settings › Upload › Upload presets › Add upload preset (mode: Unsigned).
              </span>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {config.cloudName && config.uploadPreset
                  ? ' Cloudinary Ativado para Novos Uploads'
                  : '⚠️ Aguardando credenciais'}
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Salvar Credenciais</span>
              </button>
            </div>
          </form>

          {/* Upload Tester Widget */}
          <div className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} space-y-4`}>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-500">upload_file</span>
              <span>Testar Upload de Imagem</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Selecione uma foto do seu computador para verificar se o envio ao Cloudinary está funcionando:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleTestUpload}
                disabled={uploading}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0A0A0A] file:text-white hover:file:bg-[#1A1A1A] cursor-pointer"
              />
            </div>

            {uploading && (
              <div className="p-3 rounded-xl bg-gold-50 dark:bg-gold-950/50 text-gold-600 dark:text-gold-300 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Enviando imagem para o Cloudinary...</span>
              </div>
            )}

            {testResult && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold space-y-2 border ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[18px]">
                    {testResult.success ? 'check_circle' : 'error'}
                  </span>
                  <span>{testResult.message}</span>
                </div>

                {testResult.url && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/50 space-y-2">
                    <p className="font-mono text-[11px] break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-200">
                      {testResult.url}
                    </p>
                    <img
                      src={testResult.url}
                      alt="Teste Cloudinary"
                      className="max-h-36 object-contain rounded-lg border border-emerald-300 shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Step-by-Step Instructions */}
        <div className="lg:col-span-5 space-y-5">
          <div className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} space-y-4`}>
            <div className="flex items-center gap-2 border-b pb-3">
              <span className="material-symbols-outlined text-amber-500 text-[22px]">help</span>
              <h3 className="font-bold text-sm uppercase tracking-wider">Como criar sua conta Grátis em 2 min:</h3>
            </div>

            <ol className="space-y-3.5 text-xs leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="block text-slate-900 dark:text-white">Acesse o Cloudinary</strong>
                  Acesse <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 underline font-bold">cloudinary.com</a> e clique em <strong>Sign Up For Free</strong> (Não pede cartão de crédito).
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="block text-slate-900 dark:text-white">Copie o Cloud Name</strong>
                  No painel inicial (Dashboard), copie o texto exibido em <strong>Cloud Name</strong> e cole no campo ao lado.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="block text-slate-900 dark:text-white">Crie o Upload Preset (Unsigned)</strong>
                  No menu lateral, vá em <strong>Settings ⚙️ › Upload</strong>.<br />
                  Role até a seção <strong>Upload presets</strong>, clique em <strong>Add upload preset</strong>, mude o <i>Signing Mode</i> para <strong>Unsigned</strong> e salve. Copie o nome gerado e cole no campo ao lado.
                </div>
              </li>
            </ol>

            <div className="p-3.5 rounded-xl bg-gold-50 dark:bg-slate-800 border border-gold-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs space-y-1">
              <div className="font-bold text-[#0A0A0A] dark:text-gold-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">stars</span>
                <span>Vantagens para o site na Vercel:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Imagens não somem após deploys na Vercel.</li>
                <li>Carregamento ultrarrápido via rede de entrega global (CDN).</li>
                <li>Otimização automática de tamanho e formato.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
