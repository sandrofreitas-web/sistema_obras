import { Material, Loja, Projeto, TaxonomiaClasse, ItemFilaOffline, PrecoCaptura, CompraReal } from '../types';
import {
  DEFAULT_TAXONOMIA,
  INITIAL_LOJAS,
  INITIAL_MATERIALS,
  INITIAL_PROJECT,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_PASTORAL,
  INITIAL_PROJECT_MASCULINO,
} from '../data/initialData';

const STORAGE_KEYS = {
  MATERIALS: 'obracerta_materials_icenv_2026',
  TAXONOMIA: 'obracerta_taxonomia_icenv_2026',
  LOJAS: 'obracerta_lojas_icenv_2026',
  PROJECTS: 'obracerta_projects_icenv_2026',
  ACTIVE_PROJECT_ID: 'obracerta_active_project_id_icenv_2026',
  OFFLINE_QUEUE: 'obracerta_offline_queue_icenv_2026',
};

// Safe JSON parser
function safeParse<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse storage key ${key}:`, e);
    return defaultValue;
  }
}

function safeSave<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write to storage key ${key}:`, e);
  }
}

export const storageService = {
  /**
   * Reseta o banco local para os dados oficiais do Projeto Piloto ICENV 2026
   * Separado em duas fases sequenciais: 1ª Fase Casa Pastoral e 2ª Fase Banheiro Masculino
   */
  resetToPilotData(): void {
    safeSave(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    safeSave(STORAGE_KEYS.TAXONOMIA, DEFAULT_TAXONOMIA);
    safeSave(STORAGE_KEYS.LOJAS, INITIAL_LOJAS);
    safeSave(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    safeSave(STORAGE_KEYS.ACTIVE_PROJECT_ID, INITIAL_PROJECT_PASTORAL.id);
    safeSave(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  // === Materiais ===
  getMaterials(): Material[] {
    const materials = safeParse<Material[]>(STORAGE_KEYS.MATERIALS, []);
    if (materials.length === 0) {
      safeSave(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
      return INITIAL_MATERIALS;
    }
    return materials;
  },

  saveMaterial(material: Material): Material {
    const list = this.getMaterials();
    const index = list.findIndex((m) => m.id === material.id);
    if (index >= 0) {
      list[index] = { ...material, atualizadoEm: new Date().toISOString() };
    } else {
      list.unshift(material);
    }
    safeSave(STORAGE_KEYS.MATERIALS, list);
    return material;
  },

  deleteMaterial(id: string): void {
    const list = this.getMaterials().filter((m) => m.id !== id);
    safeSave(STORAGE_KEYS.MATERIALS, list);
  },

  findMaterialById(id: string): Material | undefined {
    return this.getMaterials().find((m) => m.id === id);
  },

  /**
   * Deduplicação (Seção 3.3):
   * Verifica se o produto já existe na base por código de barras ou por semelhança de modelo/fabricante
   */
  checkDuplicateMaterial(params: {
    codigoBarras?: string;
    fabricante: string;
    modelo: string;
  }): Material | null {
    const list = this.getMaterials();
    
    // 1. Match exato por código de barras / EAN
    if (params.codigoBarras && params.codigoBarras.trim().length >= 5) {
      const matchEan = list.find(
        (m) => m.codigoBarras && m.codigoBarras.trim() === params.codigoBarras?.trim()
      );
      if (matchEan) return matchEan;
    }

    // 2. Match por fabricante + similaridade de modelo
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFab = norm(params.fabricante);
    const cleanMod = norm(params.modelo);

    const matchModel = list.find((m) => {
      const mFab = norm(m.fabricante);
      const mMod = norm(m.modelo);
      if (mFab === cleanFab && mMod === cleanMod) return true;
      if (mFab === cleanFab && (mMod.includes(cleanMod) || cleanMod.includes(mMod))) {
        // overlap significativo
        return Math.abs(mMod.length - cleanMod.length) < 8;
      }
      return false;
    });

    return matchModel || null;
  },

  /**
   * Adiciona um registro no histórico de preços do material
   */
  addPricePoint(materialId: string, pricePoint: Omit<PrecoCaptura, 'id' | 'materialId'>): Material | null {
    const list = this.getMaterials();
    const index = list.findIndex((m) => m.id === materialId);
    if (index === -1) return null;

    const target = list[index];
    const newPrice: PrecoCaptura = {
      id: `preco-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      materialId,
      ...pricePoint,
    };

    const updatedHistory = [newPrice, ...(target.historicoPrecos || [])];
    const updated: Material = {
      ...target,
      precoAtual: pricePoint.preco,
      lojaAtual: pricePoint.loja || target.lojaAtual,
      precoPorEmbalagem: pricePoint.precoPorEmbalagem ?? target.precoPorEmbalagem,
      coberturaPorEmbalagem: pricePoint.coberturaPorEmbalagem ?? target.coberturaPorEmbalagem,
      historicoPrecos: updatedHistory,
      atualizadoEm: new Date().toISOString(),
    };

    list[index] = updated;
    safeSave(STORAGE_KEYS.MATERIALS, list);
    return updated;
  },

  // === Taxonomia ===
  getTaxonomia(): TaxonomiaClasse[] {
    const tax = safeParse<TaxonomiaClasse[]>(STORAGE_KEYS.TAXONOMIA, []);
    if (tax.length === 0) {
      safeSave(STORAGE_KEYS.TAXONOMIA, DEFAULT_TAXONOMIA);
      return DEFAULT_TAXONOMIA;
    }
    return tax;
  },

  saveTaxonomia(taxonomia: TaxonomiaClasse[]): void {
    safeSave(STORAGE_KEYS.TAXONOMIA, taxonomia);
  },

  // === Lojas ===
  getLojas(): Loja[] {
    const lojas = safeParse<Loja[]>(STORAGE_KEYS.LOJAS, []);
    if (lojas.length === 0) {
      safeSave(STORAGE_KEYS.LOJAS, INITIAL_LOJAS);
      return INITIAL_LOJAS;
    }
    return lojas;
  },

  saveLoja(loja: Loja): Loja {
    const list = this.getLojas();
    const idx = list.findIndex((l) => l.id === loja.id);
    if (idx >= 0) {
      list[idx] = loja;
    } else {
      list.push(loja);
    }
    safeSave(STORAGE_KEYS.LOJAS, list);
    return loja;
  },

  // === Projetos & Orçamentos ===
  getProjects(): Projeto[] {
    const list = safeParse<Projeto[]>(STORAGE_KEYS.PROJECTS, []);
    
    // Auto-migração: se a lista estiver vazia ou contiver apenas o projeto legado unificado
    const hasLegacyUnified = list.some((p) => p.id === 'proj-icenv-2026');
    if (list.length === 0 || hasLegacyUnified) {
      safeSave(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
      safeSave(STORAGE_KEYS.ACTIVE_PROJECT_ID, INITIAL_PROJECT_PASTORAL.id);
      return INITIAL_PROJECTS;
    }
    return list;
  },

  saveProject(project: Projeto): Projeto {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project, atualizadoEm: new Date().toISOString() };
    } else {
      list.unshift(project);
    }
    safeSave(STORAGE_KEYS.PROJECTS, list);
    return project;
  },

  deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    safeSave(STORAGE_KEYS.PROJECTS, list);
  },

  getActiveProjectId(): string {
    const current = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (current && current !== 'proj-icenv-2026') return current;
    const projects = this.getProjects();
    const fallbackId = projects[0]?.id || INITIAL_PROJECT_PASTORAL.id;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, fallbackId);
    return fallbackId;
  },

  setActiveProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  },

  getActiveProject(): Projeto | null {
    const id = this.getActiveProjectId();
    const projects = this.getProjects();
    return projects.find((p) => p.id === id) || projects[0] || null;
  },

  addRealPurchase(projectId: string, compra: Omit<CompraReal, 'id'>): Projeto | null {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return null;

    const project = projects[idx];
    const newCompra: CompraReal = {
      id: `compra-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...compra,
    };

    const updatedCompras = [newCompra, ...(project.compras || [])];
    const updatedProject: Projeto = {
      ...project,
      compras: updatedCompras,
      atualizadoEm: new Date().toISOString(),
    };

    projects[idx] = updatedProject;
    safeSave(STORAGE_KEYS.PROJECTS, projects);
    return updatedProject;
  },

  // === Fila Offline (Seção 3.3) ===
  getOfflineQueue(): ItemFilaOffline[] {
    return safeParse<ItemFilaOffline[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  addToOfflineQueue(item: Omit<ItemFilaOffline, 'id' | 'dataCaptura' | 'status'>): ItemFilaOffline {
    const queue = this.getOfflineQueue();
    const newItem: ItemFilaOffline = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataCaptura: new Date().toISOString(),
      status: 'pendente',
      ...item,
    };
    queue.push(newItem);
    safeSave(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    return newItem;
  },

  updateOfflineQueueItem(id: string, updates: Partial<ItemFilaOffline>): void {
    const queue = this.getOfflineQueue();
    const idx = queue.findIndex((q) => q.id === id);
    if (idx >= 0) {
      queue[idx] = { ...queue[idx], ...updates };
      safeSave(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    }
  },

  removeFromOfflineQueue(id: string): void {
    const queue = this.getOfflineQueue().filter((q) => q.id !== id);
    safeSave(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  clearOfflineQueue(): void {
    safeSave(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  // === Reset / Backup ===
  resetAllData(): void {
    safeSave(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    safeSave(STORAGE_KEYS.TAXONOMIA, DEFAULT_TAXONOMIA);
    safeSave(STORAGE_KEYS.LOJAS, INITIAL_LOJAS);
    safeSave(STORAGE_KEYS.PROJECTS, [INITIAL_PROJECT]);
    safeSave(STORAGE_KEYS.ACTIVE_PROJECT_ID, INITIAL_PROJECT.id);
    safeSave(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  exportBackup(): string {
    return JSON.stringify({
      materials: this.getMaterials(),
      taxonomia: this.getTaxonomia(),
      lojas: this.getLojas(),
      projects: this.getProjects(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.materials)) safeSave(STORAGE_KEYS.MATERIALS, data.materials);
      if (Array.isArray(data.taxonomia)) safeSave(STORAGE_KEYS.TAXONOMIA, data.taxonomia);
      if (Array.isArray(data.lojas)) safeSave(STORAGE_KEYS.LOJAS, data.lojas);
      if (Array.isArray(data.projects)) safeSave(STORAGE_KEYS.PROJECTS, data.projects);
      return true;
    } catch (e) {
      console.error('Import backup failed:', e);
      return false;
    }
  },
};
