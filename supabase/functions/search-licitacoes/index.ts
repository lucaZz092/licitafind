import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  searchTerm: string;
  modalidade?: string;
  valorMin?: number;
}

interface Licitacao {
  id: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  valor_estimado: number;
  data_abertura: string;
  situacao: string;
  objeto: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, modalidade, valorMin }: SearchRequest = await req.json();
    
    console.log('Buscando licitações com:', { searchTerm, modalidade, valorMin });

    // API oficial do PNCP (Portal Nacional de Contratações Públicas)
    // Endpoint: /v1/contratacoes/publicacao - Consultar por Data de Publicação
    const baseUrl = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
    
    // Construir parâmetros da query
    const params = new URLSearchParams();
    
    // Data inicial (últimos 30 dias) - formato YYYYMMDD (sem hífens)
    const dataInicialDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dataFinalDate = new Date();
    
    const dataInicial = `${dataInicialDate.getFullYear()}${String(dataInicialDate.getMonth() + 1).padStart(2, '0')}${String(dataInicialDate.getDate()).padStart(2, '0')}`;
    const dataFinal = `${dataFinalDate.getFullYear()}${String(dataFinalDate.getMonth() + 1).padStart(2, '0')}${String(dataFinalDate.getDate()).padStart(2, '0')}`;
    
    params.append('dataInicial', dataInicial);
    params.append('dataFinal', dataFinal);
    params.append('pagina', '1');
    params.append('tamanhoPagina', '100');

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('URL da API PNCP:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro na API PNCP:', response.status, response.statusText);
      throw new Error(`Erro ao buscar licitações: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta da API PNCP:', JSON.stringify(data).substring(0, 200));

    // Processar os dados da API do PNCP
    let licitacoes: Licitacao[] = [];
    
    if (data && Array.isArray(data)) {
      licitacoes = data
        .filter((item: any) => {
          // Filtrar por termo de busca no objeto da licitação
          const objetoCompra = item.objetoCompra || '';
          const matchesSearch = !searchTerm || 
            objetoCompra.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Filtrar por modalidade se especificado
          const matchesModalidade = !modalidade || 
            item.modalidadeCompra === modalidade;
          
          // Filtrar por valor mínimo se especificado
          const matchesValor = !valorMin || 
            (item.valorTotalEstimado && parseFloat(item.valorTotalEstimado) >= valorMin);
          
          return matchesSearch && matchesModalidade && matchesValor;
        })
        .map((item: any) => ({
          id: item.numeroCompra || `${item.numeroControlePNCP || Math.random()}`,
          titulo: (item.objetoCompra || 'Sem título').substring(0, 150),
          orgao: item.orgaoEntidade?.razaoSocial || item.nomeOrgao || 'Órgão não informado',
          modalidade: item.modalidadeNome || item.modalidadeCompra || 'Não especificada',
          valor_estimado: parseFloat(item.valorTotalEstimado || item.valorEstimadoTotal || 0),
          data_abertura: item.dataAberturaPropostas || item.dataInicioPropostas || new Date().toISOString(),
          situacao: item.situacaoCompra || 'EM ANDAMENTO',
          objeto: item.objetoCompra || 'Descrição não disponível',
        }))
        .slice(0, 50); // Limitar a 50 resultados
    }

    console.log(`${licitacoes.length} licitações encontradas`);

    return new Response(
      JSON.stringify({ licitacoes }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        licitacoes: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});