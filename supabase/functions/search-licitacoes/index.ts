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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, modalidade, valorMin }: SearchRequest = await req.json();
    
    console.log('Buscando licitações com:', { searchTerm, modalidade, valorMin });

    // API oficial do PNCP (Portal Nacional de Contratações Públicas)
    const baseUrl = 'https://pncp.gov.br/api/consulta/v1/contratacoes';
    
    // Construir parâmetros da query
    const params = new URLSearchParams();
    
    // Buscar por termo (objeto da licitação)
    if (searchTerm) {
      params.append('codigoModalidadeContratacao', '1,2,3,4,5,6,7,8'); // Todas modalidades
      params.append('dataInicial', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      params.append('dataFinal', new Date().toISOString().split('T')[0]);
      params.append('pagina', '1');
      params.append('tamanhoPagina', '20');
    }

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
    let licitacoes = [];
    
    if (data.data && Array.isArray(data.data)) {
      licitacoes = data.data
        .filter((item: any) => {
          // Filtrar por termo de busca no objeto da licitação
          const matchesSearch = !searchTerm || 
            (item.objetoCompra && item.objetoCompra.toLowerCase().includes(searchTerm.toLowerCase()));
          
          // Filtrar por modalidade se especificado
          const matchesModalidade = !modalidade || 
            item.modalidadeContratacao === modalidade;
          
          // Filtrar por valor mínimo se especificado
          const matchesValor = !valorMin || 
            (item.valorTotalEstimado && item.valorTotalEstimado >= valorMin);
          
          return matchesSearch && matchesModalidade && matchesValor;
        })
        .map((item: any) => ({
          id: item.numeroCompra || Math.random().toString(),
          titulo: item.objetoCompra || 'Sem título',
          orgao: item.nomeOrgao || 'Órgão não informado',
          modalidade: item.modalidadeContratacao || 'Não especificada',
          valor_estimado: item.valorTotalEstimado || 0,
          data_abertura: item.dataAberturaProposta || new Date().toISOString(),
          situacao: item.situacaoContratacao || 'EM ANDAMENTO',
          objeto: item.objetoCompra || 'Descrição não disponível',
        }))
        .slice(0, 20); // Limitar a 20 resultados
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