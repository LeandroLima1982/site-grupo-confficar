import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import {
  BannerItem,
  FleetItem,
  InstitutionalContent,
  ServiceItem,
  SiteLogos,
  TestimonialItem,
  SEOSettings,
} from '../types';
import { CloudinaryConfig } from './cloudinary';

export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Handle named database ID if specified in config
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export interface FirestoreCMSBundle {
  logos?: SiteLogos;
  institutional?: InstitutionalContent;
  banners?: BannerItem[];
  services?: ServiceItem[];
  fleet?: FleetItem[];
  testimonials?: TestimonialItem[];
  seo?: SEOSettings;
  cloudinaryConfig?: CloudinaryConfig;
  updatedAt?: string;
}

const SETTINGS_COLLECTION_NAME = 'cms_settings';

const SECTION_DOC_IDS = ['logos', 'institutional', 'banners', 'services', 'fleet', 'testimonials', 'seo', 'cloudinaryConfig'] as const;

/**
 * Filtra apenas os documentos de seção oficiais. Ignora documentos legados
 * (ex: 'global_data', antigo schema de documento único) que contêm cópias
 * antigas e sobrescreveriam os dados salvos nas seções individuais.
 */
function isSectionDocId(docId: string): boolean {
  return (SECTION_DOC_IDS as readonly string[]).includes(docId);
}

/**
 * Salva seções do CMS em documentos separados na coleção 'cms_settings' no Firestore.
 * Evita o estouro do limite estrito de 1MB por documento do Firestore.
 */
export async function saveCMSDataToCloud(
  data: FirestoreCMSBundle
): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = Object.keys(data) as (keyof FirestoreCMSBundle)[];
    const now = new Date().toISOString();

    for (const key of keys) {
      if (key === 'updatedAt' || data[key] === undefined) continue;

      const sectionPayload = {
        [key]: data[key],
        updatedAt: now,
      };

      // Strip out undefined values to satisfy Firestore setDoc requirements
      const cleanData = JSON.parse(JSON.stringify(sectionPayload));

      // Salva no documento específico da seção (ex: cms_settings/institutional, cms_settings/fleet)
      const docRef = doc(db, SETTINGS_COLLECTION_NAME, key);
      await setDoc(docRef, cleanData, { merge: true });
    }

    console.log('[Firestore] Seções do CMS salvas com sucesso no Firestore!');
    return { success: true };
  } catch (error) {
    console.error('[Firestore Error] Erro ao salvar seções no Firestore Cloud:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Escuta atualizações em tempo real da coleção 'cms_settings' no Firestore
 */
export function subscribeCMSDataFromCloud(callback: (data: FirestoreCMSBundle) => void) {
  try {
    const colRef = collection(db, SETTINGS_COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const bundle: FirestoreCMSBundle = {};
        snapshot.docs.forEach((docSnap) => {
          if (docSnap.exists() && isSectionDocId(docSnap.id)) {
            const data = docSnap.data() as FirestoreCMSBundle;
            if (data.logos) bundle.logos = data.logos;
            if (data.institutional) bundle.institutional = data.institutional;
            if (data.banners) bundle.banners = data.banners;
            if (data.services) bundle.services = data.services;
            if (data.fleet) bundle.fleet = data.fleet;
            if (data.testimonials) bundle.testimonials = data.testimonials;
            if (data.seo) bundle.seo = data.seo;
            if (data.cloudinaryConfig) bundle.cloudinaryConfig = data.cloudinaryConfig;
          }
        });
        callback(bundle);
      },
      (error) => {
        console.warn('Erro na escuta Firestore:', error);
      }
    );
  } catch (error) {
    console.warn('Falha ao iniciar listener Firestore:', error);
    return () => {};
  }
}

/**
 * Carrega todas as seções do CMS da coleção 'cms_settings' no Firestore
 */
export async function loadCMSDataFromCloud(): Promise<FirestoreCMSBundle | null> {
  try {
    const colRef = collection(db, SETTINGS_COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const bundle: FirestoreCMSBundle = {};
      snapshot.docs.forEach((docSnap) => {
        if (docSnap.exists() && isSectionDocId(docSnap.id)) {
          const data = docSnap.data() as FirestoreCMSBundle;
          if (data.logos) bundle.logos = data.logos;
          if (data.institutional) bundle.institutional = data.institutional;
          if (data.banners) bundle.banners = data.banners;
          if (data.services) bundle.services = data.services;
          if (data.fleet) bundle.fleet = data.fleet;
          if (data.testimonials) bundle.testimonials = data.testimonials;
          if (data.seo) bundle.seo = data.seo;
          if (data.cloudinaryConfig) bundle.cloudinaryConfig = data.cloudinaryConfig;
        }
      });
      return bundle;
    }
  } catch (error) {
    console.warn('Erro ao buscar dados do Firestore:', error);
  }
  return null;
}
