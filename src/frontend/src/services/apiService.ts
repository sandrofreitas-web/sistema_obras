import { RequisicaoCampo } from '../types';

const API_BASE = '/api/v2';

export const apiService = {
  /**
   * Verifica a conectividade com o backend FastAPI no HomeLab
   */
  async checkHealth(): Promise<{ status: string; service?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Busca requisições enviadas pelo WhatsApp/N8N gravadas no PostgreSQL
   */
  async getRequisicoesCampo(projetoId?: string): Promise<RequisicaoCampo[]> {
    try {
      const url = projetoId
        ? `${API_BASE}/ia/requisicoes?projeto_id=${encodeURIComponent(projetoId)}`
        : `${API_BASE}/ia/requisicoes`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        // Fallback para rota sem prefixo /ia se necessário
        const fallbackUrl = projetoId
          ? `${API_BASE}/requisicoes?projeto_id=${encodeURIComponent(projetoId)}`
          : `${API_BASE}/requisicoes`;
        const resFallback = await fetch(fallbackUrl, { method: 'GET' });
        if (!resFallback.ok) return [];
        return await resFallback.json();
      }
      return await res.json();
    } catch (e) {
      console.warn('Falha ao buscar requisições do campo via API:', e);
      return [];
    }
  },

  /**
   * Atualiza o status de uma requisição de campo (ex: 'Aprovado', 'Pendente', 'Comprado')
   */
  async updateRequisicaoStatus(requisicaoId: string, status: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/ia/requisicoes/${requisicaoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Erro ao atualizar status da requisição:', e);
      return false;
    }
  },

  /**
   * Busca a lista de projetos sincronizados no backend
   */
  async getProjetos(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/projetos`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Busca detalhes completos do projeto (árvore WBS, cenários, etapas, compras)
   */
  async getProjetoDetalhe(projetoId: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/projetos/${projetoId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Busca compras reais registradas no banco de dados
   */
  async getCompras(projetoId?: string): Promise<any[]> {
    try {
      const url = projetoId
        ? `${API_BASE}/financeiro/compras?projeto_id=${encodeURIComponent(projetoId)}`
        : `${API_BASE}/financeiro/compras`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Busca fornecedores cadastrados
   */
  async getFornecedores(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/suprimentos/fornecedores`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Busca catálogo de materiais cadastrados
   */
  async getMateriais(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/suprimentos/materiais`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};
