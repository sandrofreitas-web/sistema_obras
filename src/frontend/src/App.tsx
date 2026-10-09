import React, { useState, useEffect } from 'react';
import { Material, Loja, Projeto, TaxonomiaClasse, ItemFilaOffline } from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { CatalogScreen } from './components/CatalogScreen';
import { BudgetScreen } from './components/BudgetScreen';
import { ExecutionScreen } from './components/ExecutionScreen';
import { PhysicalTrackingScreen } from './components/PhysicalTrackingScreen';
import { TaxonomyModal } from './components/TaxonomyModal';
import { CaptureModal } from './components/CaptureModal';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { AddItemToProjectModal } from './components/AddItemToProjectModal';
import { RegisterPurchaseModal } from './components/RegisterPurchaseModal';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { PrintBudgetModal } from './components/PrintBudgetModal';
import { NewProjectModal } from './components/NewProjectModal';

export default function App() {
  // Global State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [taxonomia, setTaxonomia] = useState<TaxonomiaClasse[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [activeProject, setActiveProject] = useState<Projeto | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<ItemFilaOffline[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Active navigation tab (Orçamento WBS como visão padrão)
  const [currentTab, setCurrentTab] = useState<TabType>('orcamento');

  // Modo de Edição habilitado / bloqueado
  const [editModeEnabled, setEditModeEnabled] = useState<boolean>(true);

  // Modal controls
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<Material | null>(null);
  const [materialForAddToProject, setMaterialForAddToProject] = useState<Material | null>(null);
  const [isAddToProjectModalOpen, setIsAddToProjectModalOpen] = useState(false);
  const [isRegisterPurchaseModalOpen, setIsRegisterPurchaseModalOpen] = useState(false);
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
  };

  const handleSelectProject = (projectId: string) => {
    storageService.setActiveProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId) || null;
    setActiveProject(proj);
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

  const handleResetToPilot = () => {
    if (
      window.confirm(
        'Deseja recarregar as informações oficiais do Projeto Piloto ICENV 2026? As 28 especificações da Lista Mestra e o cronograma de 5 semanas serão recarregados com dados limpos.'
      )
    ) {
      storageService.resetToPilotData();
      loadAllData();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#060911] text-slate-100 flex flex-row font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Menu Lateral Esquerdo Compacto Sistêmico (Desktop) */}
      <div className="hidden md:flex h-full">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCapture={() => setIsCaptureModalOpen(true)}
          isOnline={isOnline}
          offlineQueue={offlineQueue}
          onOpenOfflineQueue={() => setIsOfflineQueueModalOpen(true)}
          onResetToPilot={handleResetToPilot}
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
                onOpenCapture={() => setIsCaptureModalOpen(true)}
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
            onOpenCapture={() => setIsCaptureModalOpen(true)}
          />
        </div>
      </div>

      {/* Capture and OCR Modal */}
      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        taxonomia={taxonomia}
        lojas={lojas}
        onSaveMaterial={handleSaveMaterial}
        onPriceUpdated={handlePriceUpdated}
      />

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
