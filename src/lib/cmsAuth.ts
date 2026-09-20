import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { CMSUser, AdminSection } from '../types';
import { auth, db, firebaseConfig } from './firebase';

export const ALL_ADMIN_SECTIONS: { id: AdminSection; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Painel Geral (Métricas)', icon: 'dashboard' },
  { id: 'logos', label: 'Logos do Site & Identidade', icon: 'image' },
  { id: 'banners', label: 'Banners do Carrossel', icon: 'view_carousel' },
  { id: 'servicos', label: 'Serviços Prestados', icon: 'airport_shuttle' },
  { id: 'frota', label: 'Frota de Veículos', icon: 'directions_car' },
  { id: 'depoimentos', label: 'Depoimentos de Clientes', icon: 'format_quote' },
  { id: 'conteudo', label: 'Conteúdo Institucional (Quem Somos)', icon: 'article' },
  { id: 'seo', label: 'SEO & Otimização do Google', icon: 'search' },
  { id: 'cloudinary', label: 'Integração Cloudinary (Imagens CDN)', icon: 'cloud_upload' },
  { id: 'painel_externo', label: 'Atalhos do Painel Operacional', icon: 'open_in_new' },
  { id: 'configuracoes', label: 'Configurações de Layout & Cores', icon: 'settings' },
  { id: 'usuarios', label: 'Gestão de Usuários & Permissões (SuperAdmin)', icon: 'manage_accounts' },
];

export const SUPERADMIN_EMAILS = [
  'transporteapp.com.br@gmail.com',
  'admin',
];

export const DEFAULT_SUPERADMIN: CMSUser = {
  id: 'usr_superadmin_01',
  name: 'SuperAdmin Principal',
  email: 'transporteapp.com.br@gmail.com',
  password: '',
  isSuperAdmin: true,
  active: true,
  allowedSections: ALL_ADMIN_SECTIONS.map((section) => section.id),
  createdAt: new Date().toISOString(),
};

const STORAGE_USERS_KEY = 'confficar_cms_users_v1';
const STORAGE_LOGGED_USER_KEY = 'confficar_logged_cms_user_v1';
const CMS_USERS_COLLECTION_NAME = 'cms_users';
const PROVISIONING_APP_NAME = 'confficar-cms-user-provisioning';

export const LOCAL_DEV_PASSWORD = 'confficar123';
export const IS_FIREBASE_CONFIGURED =
  typeof firebaseConfig.apiKey === 'string' &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.startsWith('PLACEHOLDER');

type AuthResult = {
  success: boolean;
  user?: CMSUser;
  message?: string;
};

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAdminSection(value: unknown): value is AdminSection {
  return ALL_ADMIN_SECTIONS.some((section) => section.id === value);
}

function normalizeCMSUser(
  data: Partial<CMSUser>,
  id: string,
  options: { keepPassword?: boolean } = {}
): CMSUser {
  const allowedSections = Array.isArray(data.allowedSections)
    ? data.allowedSections.filter(isAdminSection)
    : (['dashboard'] as AdminSection[]);

  return {
    id,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Usuário CMS',
    email: cleanEmail(typeof data.email === 'string' ? data.email : ''),
    password: options.keepPassword && typeof data.password === 'string' ? data.password : '',
    isSuperAdmin: Boolean(data.isSuperAdmin),
    active: data.active !== false,
    allowedSections: allowedSections.length > 0 ? allowedSections : ['dashboard'],
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    lastLogin: typeof data.lastLogin === 'string' ? data.lastLogin : undefined,
  };
}

function withoutPassword(user: CMSUser): CMSUser {
  const safeUser = { ...user, password: '' };
  if (safeUser.lastLogin === undefined) {
    delete safeUser.lastLogin;
  }
  return safeUser;
}

function getAuthErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return '';
}

function getProvisioningAuth() {
  const existingApp = getApps().find((app) => app.name === PROVISIONING_APP_NAME);
  const provisioningApp = existingApp || initializeApp(firebaseConfig, PROVISIONING_APP_NAME);
  return getAuth(provisioningApp);
}

export function getCMSUsers(): CMSUser[] {
  if (typeof window === 'undefined') return [DEFAULT_SUPERADMIN];

  try {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const users = parsed.map((user, index) =>
          normalizeCMSUser(user, typeof user?.id === 'string' ? user.id : `legacy_${index}`, {
            keepPassword: true,
          })
        );
        const hasSuperAdmin = users.some(
          (user) => user.isSuperAdmin || SUPERADMIN_EMAILS.includes(cleanEmail(user.email))
        );

        if (!hasSuperAdmin) {
          users.unshift(DEFAULT_SUPERADMIN);
          saveCMSUsers(users);
        }
        return users;
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar usuários do CMS do localStorage:', error);
  }

  saveCMSUsers([DEFAULT_SUPERADMIN]);
  return [DEFAULT_SUPERADMIN];
}

export function saveCMSUsers(users: CMSUser[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users.map(withoutPassword)));
  } catch (error) {
    console.warn('Erro ao salvar usuários do CMS:', error);
  }
}

export function getLoggedCMSUser(): CMSUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_LOGGED_USER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.email) {
        return normalizeCMSUser(parsed, typeof parsed.id === 'string' ? parsed.id : 'logged_user');
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar usuário CMS logado:', error);
  }
  return null;
}

export function setLoggedCMSUser(user: CMSUser | null) {
  if (typeof window === 'undefined') return;

  try {
    if (user) {
      localStorage.setItem(STORAGE_LOGGED_USER_KEY, JSON.stringify(withoutPassword(user)));
    } else {
      localStorage.removeItem(STORAGE_LOGGED_USER_KEY);
    }
  } catch (error) {
    console.warn('Erro ao atualizar sessão de usuário CMS:', error);
  }
}

export async function logoutCMSUser() {
  setLoggedCMSUser(null);
  await signOut(auth).catch(() => undefined);
}

export async function getCMSUserProfile(uid: string): Promise<CMSUser | null> {
  try {
    const snapshot = await getDoc(doc(db, CMS_USERS_COLLECTION_NAME, uid));
    if (!snapshot.exists()) return null;
    return normalizeCMSUser(snapshot.data() as Partial<CMSUser>, uid);
  } catch (error) {
    console.warn('Erro ao carregar perfil do usuário CMS no Firestore:', error);
    return null;
  }
}

export async function loadCMSUsersFromCloud(): Promise<CMSUser[]> {
  const localUsers = getCMSUsers();

  try {
    const snapshot = await getDocs(collection(db, CMS_USERS_COLLECTION_NAME));
    const cloudUsers = snapshot.docs.map((userSnapshot) =>
      normalizeCMSUser(userSnapshot.data() as Partial<CMSUser>, userSnapshot.id)
    );
    const knownEmails = new Set(cloudUsers.map((user) => cleanEmail(user.email)));
    const mergedUsers = [
      ...cloudUsers,
      ...localUsers.filter((user) => !knownEmails.has(cleanEmail(user.email))),
    ];

    const users = mergedUsers.length > 0 ? mergedUsers : [DEFAULT_SUPERADMIN];
    saveCMSUsers(users);
    return users;
  } catch (error) {
    console.warn('Erro ao carregar usuários do CMS no Firestore:', error);
    return localUsers;
  }
}

export async function saveCMSUserProfile(user: CMSUser) {
  const safeUser = withoutPassword(user);
  await setDoc(doc(db, CMS_USERS_COLLECTION_NAME, safeUser.id), safeUser, { merge: true });
}

export async function createCMSUserAccount(user: CMSUser, password: string): Promise<CMSUser> {
  const email = cleanEmail(user.email);
  const cleanPassword = password.trim();

  if (cleanPassword.length < 6) {
    throw new Error('A senha do Firebase precisa ter pelo menos 6 caracteres.');
  }

  const provisioningAuth = getProvisioningAuth();
  let uid: string;

  try {
    try {
      const credential = await createUserWithEmailAndPassword(provisioningAuth, email, cleanPassword);
      uid = credential.user.uid;
    } catch (error) {
      if (getAuthErrorCode(error) !== 'auth/email-already-in-use') throw error;

      // Permite associar no painel uma conta que já foi criada no Console do Firebase.
      const credential = await signInWithEmailAndPassword(provisioningAuth, email, cleanPassword);
      uid = credential.user.uid;
    }
  } catch (error) {
    const code = getAuthErrorCode(error);
    if (code === 'auth/invalid-email') {
      throw new Error('O e-mail informado não é válido.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('A senha do Firebase precisa ter pelo menos 6 caracteres.');
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      throw new Error('Este e-mail já existe no Firebase, mas a senha informada está incorreta.');
    }
    throw new Error('Não foi possível criar ou localizar a conta no Firebase. Verifique o console.');
  } finally {
    await signOut(provisioningAuth).catch(() => undefined);
  }

  const persistedUser = normalizeCMSUser(
    {
      ...user,
      id: uid,
      email,
      password: '',
    },
    uid
  );
  await saveCMSUserProfile(persistedUser);
  return persistedUser;
}

export function resetSuperAdminCredentials(): CMSUser {
  const users = getCMSUsers();
  const existingSuperAdmin = users.find(
    (user) => user.isSuperAdmin || SUPERADMIN_EMAILS.includes(cleanEmail(user.email))
  );
  const updatedSuperAdmin = normalizeCMSUser(
    {
      id: existingSuperAdmin?.id || 'usr_superadmin_01',
      name: 'SuperAdmin Principal',
      email: 'transporteapp.com.br@gmail.com',
      isSuperAdmin: true,
      active: true,
      allowedSections: ALL_ADMIN_SECTIONS.map((section) => section.id),
      createdAt: existingSuperAdmin?.createdAt || new Date().toISOString(),
    },
    existingSuperAdmin?.id || 'usr_superadmin_01'
  );
  const otherUsers = users.filter(
    (user) => !user.isSuperAdmin && !SUPERADMIN_EMAILS.includes(cleanEmail(user.email))
  );

  saveCMSUsers([updatedSuperAdmin, ...otherUsers]);
  return updatedSuperAdmin;
}

export async function authenticateCMSUser(
  emailInput: string,
  passwordInput: string
): Promise<AuthResult> {
  const email = cleanEmail(emailInput);
  const password = passwordInput.trim();

  if (!email) {
    return { success: false, message: 'Por favor, informe seu e-mail de acesso.' };
  }
  if (!password) {
    return { success: false, message: 'Por favor, informe sua senha.' };
  }

  const localUsers = getCMSUsers();

  if (!IS_FIREBASE_CONFIGURED) {
    const localUser = localUsers.find((user) => cleanEmail(user.email) === email);
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);

    if (!localUser && !isSuperAdminEmail) {
      return {
        success: false,
        message:
          'Firebase ainda não configurado (modo local). Entre com o e-mail SuperAdmin e a senha local de desenvolvimento.',
      };
    }
    if (password !== LOCAL_DEV_PASSWORD) {
      return {
        success: false,
        message: 'Senha local incorreta. Consulte a senha de desenvolvimento exibida nesta tela.',
      };
    }

    const fallbackUser = localUser || DEFAULT_SUPERADMIN;
    const loggedUser = normalizeCMSUser(
      {
        ...fallbackUser,
        email,
        isSuperAdmin: isSuperAdminEmail || Boolean(fallbackUser.isSuperAdmin),
        active: true,
        allowedSections: isSuperAdminEmail
          ? ALL_ADMIN_SECTIONS.map((section) => section.id)
          : fallbackUser.allowedSections,
        lastLogin: new Date().toISOString(),
      },
      fallbackUser.id
    );

    saveCMSUsers([loggedUser, ...localUsers.filter((user) => cleanEmail(user.email) !== email)]);
    setLoggedCMSUser(loggedUser);
    return { success: true, user: loggedUser };
  }

  let firebaseUser;
  try {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    firebaseUser = credential.user;
  } catch (error) {
    const code = getAuthErrorCode(error);
    const legacyUser = localUsers.find(
      (user) => cleanEmail(user.email) === email && user.password === password
    );

    if (code === 'auth/user-not-found' && legacyUser) {
      try {
        const provisioningAuth = getProvisioningAuth();
        try {
          await createUserWithEmailAndPassword(provisioningAuth, email, password);
        } finally {
          await signOut(provisioningAuth).catch(() => undefined);
        }
        const credential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = credential.user;
      } catch (migrationError) {
        const migrationCode = getAuthErrorCode(migrationError);
        if (migrationCode === 'auth/weak-password') {
          return { success: false, message: 'A senha do Firebase precisa ter pelo menos 6 caracteres.' };
        }
        return { success: false, message: 'Não foi possível migrar este usuário para o Firebase.' };
      }
    }

    if (!firebaseUser && code === 'auth/user-not-found') {
      return { success: false, message: 'Usuário não encontrado no Firebase Authentication.' };
    }
    if (!firebaseUser && (code === 'auth/invalid-credential' || code === 'auth/wrong-password')) {
      return { success: false, message: 'E-mail ou senha inválidos.' };
    }
    if (!firebaseUser && code === 'auth/too-many-requests') {
      return { success: false, message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
    }
    if (!firebaseUser) {
      return { success: false, message: 'Não foi possível autenticar no Firebase. Verifique sua conexão.' };
    }
  }

  const localUser = localUsers.find((user) => cleanEmail(user.email) === email);
  const profile = await getCMSUserProfile(firebaseUser.uid);
  const isSuperAdmin = SUPERADMIN_EMAILS.includes(email) || Boolean(profile?.isSuperAdmin);

  if (profile?.active === false || (!profile && localUser?.active === false)) {
    await signOut(auth).catch(() => undefined);
    return { success: false, message: 'Este usuário foi desativado pelo SuperAdmin.' };
  }

  const loggedUser = normalizeCMSUser(
    {
      ...(localUser || {}),
      ...(profile || {}),
      id: firebaseUser.uid,
      email,
      isSuperAdmin,
      active: true,
      allowedSections: isSuperAdmin
        ? ALL_ADMIN_SECTIONS.map((section) => section.id)
        : profile?.allowedSections || localUser?.allowedSections || ['dashboard'],
      lastLogin: new Date().toISOString(),
    },
    firebaseUser.uid
  );

  const updatedLocalUsers = [
    loggedUser,
    ...localUsers.filter((user) => user.id !== firebaseUser.uid && cleanEmail(user.email) !== email),
  ];
  saveCMSUsers(updatedLocalUsers);
  setLoggedCMSUser(loggedUser);

  // A SuperAdmin can always have its profile synchronized in the cloud. For a
  // regular user, the Firestore rules intentionally keep profile writes restricted.
  if (isSuperAdmin && !profile) {
    await saveCMSUserProfile(loggedUser).catch(() => undefined);
  }

  return { success: true, user: loggedUser };
}
