import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  searchTerm?: string;
  modalidade?: string;
  estado?: string;
  valorMin?: number;
  valorMax?: number;
  dataInicial?: string;
  dataFinal?: string;
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

// Mapa de modalidades do PNCP
const MODALIDADES_PNCP: { [key: string]: number } = {
  'PREGAO': 6, // Pregão Eletrônico
  'CONCORRENCIA': 4, // Concorrência Eletrônica
  'DISPENSA': 8, // Dispensa de Licitação
  'INEXIGIBILIDADE': 9,
  'LEILAO': 1,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, modalidade, estado, valorMin, valorMax, dataInicial: dataInicialParam, dataFinal: dataFinalParam }: SearchRequest = await req.json();
    
    console.log('Buscando licitações com:', { searchTerm, modalidade, estado, valorMin, valorMax, dataInicial: dataInicialParam, dataFinal: dataFinalParam });

    // API oficial do PNCP (Portal Nacional de Contratações Públicas)
    const baseUrl = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
    
    // Datas para a busca - usar parâmetros do usuário ou padrão (últimos 30 dias)
    let dataInicialDate: Date;
    let dataFinalDate: Date;
    
    if (dataInicialParam) {
      dataInicialDate = new Date(dataInicialParam);
    } else {
      dataInicialDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    if (dataFinalParam) {
      dataFinalDate = new Date(dataFinalParam);
    } else {
      dataFinalDate = new Date();
    }
    
    const dataInicial = `${dataInicialDate.getFullYear()}${String(dataInicialDate.getMonth() + 1).padStart(2, '0')}${String(dataInicialDate.getDate()).padStart(2, '0')}`;
    const dataFinal = `${dataFinalDate.getFullYear()}${String(dataFinalDate.getMonth() + 1).padStart(2, '0')}${String(dataFinalDate.getDate()).padStart(2, '0')}`;
    
    // Determinar quais modalidades buscar
    const modalidadesBuscar: number[] = modalidade && MODALIDADES_PNCP[modalidade] 
      ? [MODALIDADES_PNCP[modalidade]]
      : [6, 4, 8]; // Pregão, Concorrência e Dispensa (mais comuns)
    
    console.log('Modalidades a buscar:', modalidadesBuscar);
    console.log('Datas:', { dataInicial, dataFinal });
    
    let todasLicitacoes: Licitacao[] = [];
    
    // Buscar em cada modalidade
    for (const codigoModalidade of modalidadesBuscar) {
      const params = new URLSearchParams();
      params.append('dataInicial', dataInicial);
      params.append('dataFinal', dataFinal);
      params.append('codigoModalidadeContratacao', codigoModalidade.toString());
      params.append('pagina', '1');
      
      const url = `${baseUrl}?${params.toString()}`;
      console.log(`Buscando modalidade ${codigoModalidade}:`, url);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });

        console.log(`Modalidade ${codigoModalidade} - Status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na modalidade ${codigoModalidade}:`, response.status, errorText.substring(0, 200));
          continue; // Continua com a próxima modalidade
        }

        const data = await response.json();
        console.log(`Modalidade ${codigoModalidade} - Resposta:`, JSON.stringify(data).substring(0, 200));

        // Processar os dados
        if (data && data.data && Array.isArray(data.data)) {
          const licitacoes = data.data.map((item: any) => ({
            id: item.numeroControlePNCP || item.numeroCompra || `${Math.random()}`,
            titulo: (item.objetoCompra || 'Sem título').substring(0, 150),
            orgao: item.orgaoEntidade?.razaoSocial || item.nomeOrgao || 'Órgão não informado',
            modalidade: item.modalidadeNome || 'Não especificada',
            valor_estimado: parseFloat(item.valorTotalEstimado || item.valorEstimadoTotal || 0),
            data_abertura: item.dataPublicacaoPncp || item.dataAberturaPropostas || new Date().toISOString(),
            situacao: item.situacaoCompraNome || 'EM ANDAMENTO',
            objeto: item.objetoCompra || 'Descrição não disponível',
          }));
          
          todasLicitacoes = [...todasLicitacoes, ...licitacoes];
        }
      } catch (fetchError) {
        console.error(`Erro ao buscar modalidade ${codigoModalidade}:`, fetchError);
      }
    }
    
    console.log(`Total de licitacoes antes dos filtros: ${todasLicitacoes.length}`);
    
    // Aplicar filtros de busca
    let licitacoesFiltradas = todasLicitacoes.filter((item) => {
      // Filtrar por termo de busca (se fornecido)
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        const matchesSearch = 
          item.objeto.toLowerCase().includes(termo) ||
          item.titulo.toLowerCase().includes(termo) ||
          item.orgao.toLowerCase().includes(termo);
        
        if (!matchesSearch) return false;
      }
      
      // Filtrar por estado (se fornecido)
      if (estado) {
        const matchesEstado = item.orgao.toLowerCase().includes(estado.toLowerCase());
        if (!matchesEstado) return false;
      }
      
      return true;
    });
    
    // Aplicar filtros de valor
    if (valorMin && valorMin > 0) {
      licitacoesFiltradas = licitacoesFiltradas.filter(item => item.valor_estimado >= valorMin);
    }
    
    if (valorMax && valorMax > 0) {
      licitacoesFiltradas = licitacoesFiltradas.filter(item => item.valor_estimado <= valorMax);
    }
    
    // Limitar a 50 resultados
    licitacoesFiltradas = licitacoesFiltradas.slice(0, 50);
    
    console.log(`Total de licitações após filtros: ${licitacoesFiltradas.length}`);

    return new Response(
      JSON.stringify({ licitacoes: licitacoesFiltradas }),
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