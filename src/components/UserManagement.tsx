import React, { useState, useEffect } from 'react';
import { CMSUser, AdminSection } from '../types';
import {
  createCMSUserAccount,
  loadCMSUsersFromCloud,
  saveCMSUsers,
  saveCMSUserProfile,
  ALL_ADMIN_SECTIONS,
  getLoggedCMSUser,
  setLoggedCMSUser,
} from '../lib/cmsAuth';

interface UserManagementProps {
  isDark?: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ isDark = false }) => {
  const [users, setUsers] = useState<CMSUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CMSUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CMSUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    email: string;
    password: string;
    isSuperAdmin: boolean;
    active: boolean;
    allowedSections: AdminSection[];
  }>({
    id: '',
    name: '',
    email: '',
    password: '',
    isSuperAdmin: false,
    active: true,
    allowedSections: ['dashboard'],
  });

  useEffect(() => {
    setCurrentUser(getLoggedCMSUser());

    let isMounted = true;
    loadCMSUsersFromCloud().then((loadedUsers) => {
      if (isMounted) setUsers(loadedUsers);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      id: `usr_${Date.now()}`,
      name: '',
      email: '',
      password: '',
      isSuperAdmin: false,
      active: true,
      allowedSections: ['dashboard', 'banners', 'frota'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: CMSUser) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      isSuperAdmin: user.isSuperAdmin,
      active: user.active,
      allowedSections: [...user.allowedSections],
    });
    setIsModalOpen(true);
  };

  const handleToggleSection = (sectionId: AdminSection) => {
    setFormData((prev) => {
      const exists = prev.allowedSections.includes(sectionId);
      let updated: AdminSection[];
      if (exists) {
        updated = prev.allowedSections.filter((s) => s !== sectionId);
      } else {
        updated = [...prev.allowedSections, sectionId];
      }
      return { ...prev, allowedSections: updated };
    });
  };

  const handleSelectAllSections = () => {
    setFormData((prev) => ({
      ...prev,
      allowedSections: ALL_ADMIN_SECTIONS.map((s) => s.id),
    }));
  };

  const handleDeselectAllSections = () => {
    setFormData((prev) => ({
      ...prev,
      allowedSections: ['dashboard'], // Mantém pelo menos o dashboard
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || (!editingUser && !formData.password.trim())) {
      alert(editingUser ? 'Por favor, preencha nome e e-mail.' : 'Por favor, preencha nome, e-mail e senha.');
      return;
    }

    const isDuplicateEmail = users.some(
      (u) => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== formData.id
    );

    if (isDuplicateEmail) {
      alert('Já existe outro usuário cadastrado com este e-mail.');
      return;
    }

    // Se for SuperAdmin, garante todas as permissões
    const finalAllowedSections = formData.isSuperAdmin
      ? ALL_ADMIN_SECTIONS.map((s) => s.id)
      : formData.allowedSections;

    setIsSaving(true);
    try {
      let updatedList: CMSUser[];

      if (editingUser) {
        const updatedUser: CMSUser = {
          ...editingUser,
          name: formData.name.trim(),
          // O e-mail é a identidade da conta no Firebase e não pode ser
          // alterado apenas no perfil do Firestore.
          email: editingUser.email,
          password: '',
          isSuperAdmin: formData.isSuperAdmin,
          active: formData.active,
          allowedSections: finalAllowedSections,
        };
        await saveCMSUserProfile(updatedUser);
        updatedList = users.map((user) => (user.id === editingUser.id ? updatedUser : user));
        showToast('Usuário atualizado com sucesso!');
      } else {
        const newUser: CMSUser = {
          id: formData.id || `usr_${Date.now()}`,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: '',
          isSuperAdmin: formData.isSuperAdmin,
          active: formData.active,
          allowedSections: finalAllowedSections,
          createdAt: new Date().toISOString(),
        };
        const persistedUser = await createCMSUserAccount(newUser, formData.password);
        updatedList = [
          persistedUser,
          ...users.filter((user) => user.email.toLowerCase() !== persistedUser.email.toLowerCase()),
        ];
        showToast('Novo usuário criado no Firebase com sucesso!');
      }

      setUsers(updatedList);
      saveCMSUsers(updatedList);

      // Se o próprio usuário logado foi alterado, atualiza na sessão.
      if (currentUser && currentUser.id === formData.id) {
        const self = updatedList.find((user) => user.id === currentUser.id);
        if (self) {
          setCurrentUser(self);
          setLoggedCMSUser(self);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível salvar o usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.isSuperAdmin) {
      const superAdminCount = users.filter((u) => u.isSuperAdmin && u.active).length;
      if (superAdminCount <= 1) {
        alert('Não é possível excluir o único SuperAdmin ativo do sistema.');
        return;
      }
    }

    if (confirm(`Tem certeza que deseja desativar o usuário "${userToDelete.name}"?`)) {
      const disabledUser = { ...userToDelete, active: false };
      try {
        await saveCMSUserProfile(disabledUser);
        const updated = users.map((user) => (user.id === userId ? disabledUser : user));
        setUsers(updated);
        saveCMSUsers(updated);
        showToast('Usuário desativado com sucesso!');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Não foi possível desativar o usuário.');
      }
    }
  };

  const handleToggleStatus = async (user: CMSUser) => {
    if (user.isSuperAdmin && user.active) {
      const activeSuperAdmins = users.filter((u) => u.isSuperAdmin && u.active).length;
      if (activeSuperAdmins <= 1) {
        alert('Não é possível desativar o único SuperAdmin do sistema.');
        return;
      }
    }

    const updatedUser = { ...user, active: !user.active };
    try {
      await saveCMSUserProfile(updatedUser);
      const updated = users.map((item) => (item.id === user.id ? updatedUser : item));
      setUsers(updated);
      saveCMSUsers(updated);
      showToast(`Usuário ${!user.active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível alterar o status do usuário.');
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const inputBgClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-gold-400'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#0A0A0A]';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm ${cardBgClass} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#0A0A0A] text-[28px]">manage_accounts</span>
              <h2 className="text-xl font-bold tracking-tight">Gestão de Usuários & Permissões (CMS)</h2>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span> Acesso SuperAdmin
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Crie logins de colaboradores e escolha exatamente quais páginas do gerenciador cada usuário tem permissão para visualizar e editar.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Novo Usuário CMS</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[22px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${cardBgClass}`}>
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0A0A0A]">group</span>
            <span>Usuários Cadastrados ({users.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            * Credenciais no Firebase Authentication e permissões no Firestore
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-600'} uppercase font-bold text-[11px]`}>
              <tr>
                <th className="py-3 px-4">Usuário / Nome</th>
                <th className="py-3 px-4">E-mail de Acesso</th>
                <th className="py-3 px-4">Perfil / Cargo</th>
                <th className="py-3 px-4">Páginas Permitidas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const allowedCount = u.isSuperAdmin ? ALL_ADMIN_SECTIONS.length : u.allowedSections.length;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${u.isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-[#0A0A0A] text-white'}`}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-gold-100 text-gold-700 font-bold px-1.5 py-0.2 rounded">
                                Você
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Senha: ••••••••
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                          <span className="material-symbols-outlined text-[14px]">stars</span>
                          SuperAdmin (Total)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gold-100 text-gold-900 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          <span className="material-symbols-outlined text-[14px]">badge</span>
                          Colaborador / Editor
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isSuperAdmin ? (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          Todas as {ALL_ADMIN_SECTIONS.length} Páginas
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {allowedCount} de {ALL_ADMIN_SECTIONS.length} Páginas Liberadas
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.allowedSections.slice(0, 3).map((sec) => {
                              const match = ALL_ADMIN_SECTIONS.find((s) => s.id === sec);
                              return (
                                <span key={sec} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">
                                  {match?.label.split(' ')[0]}
                                </span>
                              );
                            })}
                            {u.allowedSections.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                +{u.allowedSections.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {u.active ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        title="Editar Permissões e Usuário"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#0A0A0A] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        title="Excluir Usuário"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit CMS User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border p-6 ${cardBgClass} space-y-5 animate-scaleUp`}>
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A0A0A]">
                  {editingUser ? 'manage_accounts' : 'person_add'}
                </span>
                <h3 className="font-bold text-base">
                  {editingUser ? `Editar Permissões: ${editingUser.name}` : 'Cadastrar Novo Usuário CMS'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carlos Oliveira"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${inputBgClass}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    E-mail de Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                    disabled={Boolean(editingUser)}
                    placeholder="Ex: carlos@grupoconficar.com.br"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-medium outline-none ${inputBgClass}`}
                  />
                  {editingUser && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      O e-mail é gerenciado pelo Firebase e não pode ser alterado aqui.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Senha de Acesso {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={Boolean(editingUser)}
                    placeholder={editingUser ? 'Gerenciada pelo Firebase' : 'Digite uma senha'}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none ${inputBgClass}`}
                  />
                  {editingUser && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Para trocar a senha, use o Firebase Authentication.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0A0A0A] focus:ring-[#0A0A0A]"
                    />
                    <span>Usuário Ativo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200">
                    <input
                      type="checkbox"
                      checked={formData.isSuperAdmin}
                      onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>SuperAdmin (Acesso Total)</span>
                  </label>
                </div>
              </div>

              {/* Granular Section Permissions */}
              {!formData.isSuperAdmin && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Permissões por Páginas / Seções do CMS:
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Selecione as abas que este usuário poderá ver e alterar no menu lateral:
                      </p>
                    </div>

                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAllSections}
                        className="text-[11px] text-[#0A0A0A] font-bold hover:underline"
                      >
                        Marcar Todas
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllSections}
                        className="text-[11px] text-slate-400 font-bold hover:underline"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/60">
                    {ALL_ADMIN_SECTIONS.filter((s) => s.id !== 'usuarios').map((section) => {
                      const isChecked = formData.allowedSections.includes(section.id);
                      return (
                        <label
                          key={section.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-gold-50/80 dark:bg-slate-700 border-gold-300 text-[#0A0A0A] font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSection(section.id)}
                            className="w-4 h-4 rounded text-[#0A0A0A] focus:ring-[#0A0A0A]"
                          />
                          <span className="material-symbols-outlined text-[18px]">
                            {section.icon}
                          </span>
                          <span>{section.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.isSuperAdmin && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">stars</span>
                  <span>SuperAdmin tem acesso irrestrito a todas as páginas e à gestão de usuários.</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] disabled:opacity-60 disabled:cursor-wait text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSaving ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
