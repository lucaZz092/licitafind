import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj, ano, sequencial } = await req.json();
    
    console.log('Buscando detalhes:', { cnpj, ano, sequencial });

    // API do PNCP para buscar detalhes de uma licitação específica
    const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/${ano}/${cnpj}/${sequencial}`;
    console.log('URL da API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro ao buscar detalhes: ${response.status}`);
    }

    const data = await response.json();
    console.log('Dados recebidos:', JSON.stringify(data).substring(0, 500));

    // Processar os detalhes
    const detalhes = {
      titulo: data.objetoCompra || 'Sem título',
      orgao: data.orgaoEntidade?.razaoSocial || 'Órgão não informado',
      modalidade: data.modalidadeNome || 'Não especificada',
      valor_estimado: parseFloat(data.valorTotalEstimado || data.valorEstimadoTotal || 0),
      data_abertura: data.dataPublicacaoPncp || data.dataAberturaPropostas || new Date().toISOString(),
      situacao: data.situacaoCompraNome || 'EM ANDAMENTO',
      objeto: data.objetoCompra || 'Descrição não disponível',
      cnpj: cnpj,
      ano_compra: parseInt(ano),
      sequencial_compra: parseInt(sequencial),
      numeroCompra: data.numeroCompra,
      linkSistemaOrigem: data.linkSistemaOrigem,
      dataPublicacaoPncp: data.dataPublicacaoPncp,
      dataAtualizacao: data.dataAtualizacao,
      codigoModalidadeContratacao: data.codigoModalidadeContratacao,
      objetoCompra: data.objetoCompra,
    };

    return new Response(
      JSON.stringify({ detalhes }),
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
        detalhes: null
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
