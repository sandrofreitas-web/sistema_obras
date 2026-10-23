import React, { useState, useEffect } from 'react';
import { Material, Loja, Projeto, TaxonomiaClasse, ItemFilaOffline, CompraReal } from './types';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { CatalogScreen } from './components/CatalogScreen';
import { BudgetScreen } from './components/BudgetScreen';
import { ExecutionScreen } from './components/ExecutionScreen';
import { PhysicalTrackingScreen } from './components/PhysicalTrackingScreen';
import { TaxonomyModal } from './components/TaxonomyModal';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { AddItemToProjectModal } from './components/AddItemToProjectModal';
import { RegisterPurchaseModal } from './components/RegisterPurchaseModal';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { PrintBudgetModal } from './components/PrintBudgetModal';
import { ExecutiveDashboardScreen } from './components/ExecutiveDashboardScreen';
import { BlueprintsScreen } from './components/BlueprintsScreen';
import { InvoiceIngestionModal } from './components/InvoiceIngestionModal';
import { ProjectsScreen } from './components/ProjectsScreen';
import { SuppliersScreen } from './components/SuppliersScreen';
import { NewProjectModal } from './components/NewProjectModal';
import { MobileCanteiroScreen } from './components/MobileCanteiroScreen';

export default function App() {
  // Global State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [taxonomia, setTaxonomia] = useState<TaxonomiaClasse[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [activeProject, setActiveProject] = useState<Projeto | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<ItemFilaOffline[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Active navigation tab (Canteiro no Mobile, Cockpit Executivo no Desktop)
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'canteiro';
    }
    return 'dashboard';
  });

  // Modo de Edição habilitado / bloqueado
  const [editModeEnabled, setEditModeEnabled] = useState<boolean>(true);

  // Modal controls
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<Material | null>(null);
  const [materialForAddToProject, setMaterialForAddToProject] = useState<Material | null>(null);
  const [isAddToProjectModalOpen, setIsAddToProjectModalOpen] = useState(false);
  const [isRegisterPurchaseModalOpen, setIsRegisterPurchaseModalOpen] = useState(false);
  const [isInvoiceIngestionModalOpen, setIsInvoiceIngestionModalOpen] = useState(false);
  const [isOfflineQueueModalOpen, setIsOfflineQueueModalOpen] = useState(false);
  const [isPrintBudgetModalOpen, setIsPrintBudgetModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);


  // Initialize and load data on mount
  useEffect(() => {
    loadAllData();

    // Online / offline event listeners
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const syncComprasFromBackend = async (projId: string) => {
    try {
      const apiCompras = await apiService.getCompras(projId);
      if (!apiCompras || apiCompras.length === 0) return;

      const projs = storageService.getProjects();
      const targetProj = projs.find((p) => p.id === projId);
      if (!targetProj) return;

      let compras = targetProj.compras || [];
      let hasChanges = false;

      for (const ac of apiCompras) {
        const exists = compras.some(
          (c) => c.id === ac.id || (ac.numero_nf && c.numeroNotaFiscal === ac.numero_nf)
        );
        if (!exists) {
          const formaPag: CompraReal['formaPagamento'] =
            ac.forma_pagamento?.toLowerCase().includes('debito') ? 'cartao_debito' :
            ac.forma_pagamento?.toLowerCase().includes('credito') ? 'cartao_credito' :
            ac.forma_pagamento?.toLowerCase().includes('pix') ? 'pix' :
            ac.forma_pagamento?.toLowerCase().includes('boleto') ? 'boleto' : 'dinheiro';

          const nova: CompraReal = {
            id: ac.id,
            projetoId: ac.projeto_id,
            descricao: `NF ${ac.numero_nf || 'S/N'} • ${ac.fornecedor_nome}`,
            categoria: 'Hidráulica',
            fornecedorLoja: ac.fornecedor_nome,
            data: ac.data_compra,
            quantidade: 1,
            unidade: 'un',
            valorUnitario: Number(ac.valor_total),
            valorTotal: Number(ac.valor_total),
            valorPlanejado: Number(ac.valor_total),
            numeroNotaFiscal: ac.numero_nf || undefined,
            formaPagamento: formaPag,
            status: 'pago',
            observacoes: ac.observacoes || '',
          };
          compras = [nova, ...compras];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        storageService.saveProject({ ...targetProj, compras });
        setProjects(storageService.getProjects());
        setActiveProject(storageService.getActiveProject());
      }
    } catch (err) {
      console.warn('Sincronização em background de compras offline/API:', err);
    }
  };

  const loadAllData = () => {
    const mats = storageService.getMaterials();
    const tax = storageService.getTaxonomia();
    const lj = storageService.getLojas();
    const projs = storageService.getProjects();
    const active = storageService.getActiveProject();
    const queue = storageService.getOfflineQueue();

    setMaterials(mats);
    setTaxonomia(tax);
    setLojas(lj);
    setProjects(projs);
    setActiveProject(active);
    setOfflineQueue(queue);

    if (active?.id) {
      syncComprasFromBackend(active.id);
    }
  };

  const handleSelectProject = (projectId: string) => {
    storageService.setActiveProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId) || null;
    setActiveProject(proj);
    syncComprasFromBackend(projectId);
  };

  const handleProjectUpdated = (updated: Projeto) => {
    setActiveProject(updated);
    setProjects(storageService.getProjects());
  };

  const handleSaveMaterial = (newMaterial: Material) => {
    setMaterials(storageService.getMaterials());
    setSelectedMaterialForDetail(newMaterial);
  };

  const handlePriceUpdated = (updatedMaterial: Material) => {
    setMaterials(storageService.getMaterials());
    setSelectedMaterialForDetail(updatedMaterial);
  };

  const handleDeleteMaterial = (id: string) => {
    storageService.deleteMaterial(id);
    setMaterials(storageService.getMaterials());
  };

  const handleOpenAddMaterialToRoom = (ambienteId: string) => {
    setCurrentTab('catalogo');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#060911] text-slate-100 flex flex-row font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Menu Lateral Esquerdo Compacto Sistêmico (Desktop) */}
      <div className="hidden md:flex h-full">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOnline={isOnline}
          offlineQueue={offlineQueue}
          onOpenOfflineQueue={() => setIsOfflineQueueModalOpen(true)}
        />
      </div>

      {/* 2. Coluna Principal do Workbench de Engenharia (100% Full-Width) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header Superior de Contexto da Obra */}
        <Header
          activeProject={activeProject}
          projects={projects}
          onSelectProject={handleSelectProject}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          isOnline={isOnline}
          offlineQueue={offlineQueue}
          onOpenOfflineQueue={() => setIsOfflineQueueModalOpen(true)}
          onOpenPrintBudget={() => setIsPrintBudgetModalOpen(true)}
          editModeEnabled={editModeEnabled}
          onToggleEditMode={setEditModeEnabled}
        />

        {/* Área de Trabalho Central 100% Fluida */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'canteiro' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 w-full">
              <MobileCanteiroScreen
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}

          {currentTab === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <ExecutiveDashboardScreen
                project={activeProject}
                onOpenPrintBudget={() => setIsPrintBudgetModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}

          {currentTab === 'plantas' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <BlueprintsScreen
                projetoNome={activeProject?.nome || 'Reforma ICENV 2026'}
              />
            </div>
          )}

          {currentTab === 'orcamento' && (
            <BudgetScreen
              project={activeProject}
              projects={projects}
              onSelectProject={handleSelectProject}
              materials={materials}
              taxonomia={taxonomia}
              onProjectUpdated={handleProjectUpdated}
              onOpenCatalog={() => setCurrentTab('catalogo')}
              onOpenPrintBudget={() => setIsPrintBudgetModalOpen(true)}
              onOpenAddMaterialToRoom={handleOpenAddMaterialToRoom}
              editModeEnabled={editModeEnabled}
            />
          )}

          {currentTab === 'catalogo' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <CatalogScreen
                materials={materials}
                taxonomia={taxonomia}
                onSelectMaterial={(mat) => setSelectedMaterialForDetail(mat)}
                onOpenAddToProject={(mat) => {
                  setMaterialForAddToProject(mat);
                  setIsAddToProjectModalOpen(true);
                }}
              />
            </div>
          )}

          {currentTab === 'execucao' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <ExecutionScreen
                project={activeProject}
                onOpenRegisterPurchase={() => setIsRegisterPurchaseModalOpen(true)}
                onOpenIngestNF={() => setIsInvoiceIngestionModalOpen(true)}
                onProjectUpdated={handleProjectUpdated}
              />
            </div>
          )}

          {currentTab === 'etapas' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <PhysicalTrackingScreen
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            </div>
          )}

          {currentTab === 'projetos' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <ProjectsScreen
                projects={projects}
                activeProject={activeProject}
                onSelectProject={handleSelectProject}
                onOpenNewProject={() => setIsNewProjectModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}

          {currentTab === 'fornecedores' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <SuppliersScreen
                lojas={lojas}
                project={activeProject}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}

          {currentTab === 'taxonomia' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
              <TaxonomyModal
                taxonomia={taxonomia}
                onTaxonomiaUpdated={(newTax) => setTaxonomia(newTax)}
              />
            </div>
          )}
        </main>

        {/* Navegação Mobile Inferior Fixa */}
        <div className="md:hidden">
          <Navigation
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
          />
        </div>
      </div>

      {/* Material Detail & Price History Modal */}
      <MaterialDetailModal
        material={selectedMaterialForDetail}
        onClose={() => setSelectedMaterialForDetail(null)}
        onDeleteMaterial={handleDeleteMaterial}
        onOpenAddToProject={(mat) => {
          setSelectedMaterialForDetail(null);
          setMaterialForAddToProject(mat);
          setIsAddToProjectModalOpen(true);
        }}
        onPriceUpdated={handlePriceUpdated}
        lojas={lojas}
      />

      {/* Add Item to Room / Project Budget Modal */}
      <AddItemToProjectModal
        isOpen={isAddToProjectModalOpen}
        onClose={() => {
          setIsAddToProjectModalOpen(false);
          setMaterialForAddToProject(null);
        }}
        material={materialForAddToProject}
        activeProject={activeProject}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Register Purchase Modal */}
      <RegisterPurchaseModal
        isOpen={isRegisterPurchaseModalOpen}
        onClose={() => setIsRegisterPurchaseModalOpen(false)}
        activeProject={activeProject}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={isOfflineQueueModalOpen}
        onClose={() => setIsOfflineQueueModalOpen(false)}
        queue={offlineQueue}
        onQueueUpdated={() => setOfflineQueue(storageService.getOfflineQueue())}
        onMaterialsRefreshed={() => setMaterials(storageService.getMaterials())}
      />

      {/* Print / Export Executive Budget Modal */}
      <PrintBudgetModal
        isOpen={isPrintBudgetModalOpen}
        onClose={() => setIsPrintBudgetModalOpen(false)}
        project={activeProject}
      />

      {/* Ingestão Agêntica de NF / Cupom Fiscal com IA */}
      <InvoiceIngestionModal
        isOpen={isInvoiceIngestionModalOpen}
        onClose={() => setIsInvoiceIngestionModalOpen(false)}
        activeProject={activeProject}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* New Project Creation Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects(storageService.getProjects());
          setActiveProject(newProj);
        }}
      />
    </div>
  );
}
