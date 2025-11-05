import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Building2, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DetalhesLicitacao {
  titulo: string;
  orgao: string;
  modalidade: string;
  valor_estimado: number;
  data_abertura: string;
  situacao: string;
  objeto: string;
  cnpj?: string;
  ano_compra?: number;
  sequencial_compra?: number;
}

const LicitacaoDetalhes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const detalhes = location.state as DetalhesLicitacao | null;

  useEffect(() => {
    if (!detalhes) {
      toast({
        title: "Dados não disponíveis",
        description: "Retorne à busca e selecione uma licitação",
        variant: "destructive",
      });
    }
  }, [detalhes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!detalhes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Licitação não encontrada</CardTitle>
            <CardDescription>Retorne à busca e selecione uma licitação</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para busca
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para busca
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{detalhes.titulo}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5" />
                  {detalhes.orgao}
                </CardDescription>
              </div>
              <Badge variant={detalhes.situacao === "ABERTA" ? "default" : "secondary"} className="text-sm">
                {detalhes.situacao}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Objeto da Licitação
              </h3>
              <p className="text-muted-foreground">{detalhes.objeto}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Modalidade</p>
                  <p className="font-medium">{detalhes.modalidade}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Estimado
                  </p>
                  <p className="font-bold text-lg text-success">{formatCurrency(detalhes.valor_estimado)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Abertura
                  </p>
                  <p className="font-medium">{formatDate(detalhes.data_abertura)}</p>
                </div>
              </div>

              <div className="space-y-4">
                {detalhes.cnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CNPJ do Órgão</p>
                    <p className="font-mono text-sm">{detalhes.cnpj}</p>
                  </div>
                )}

                {detalhes.sequencial_compra && detalhes.ano_compra && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Número da Compra</p>
                    <p className="font-medium">{detalhes.sequencial_compra}/{detalhes.ano_compra}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => {
                  const termo = `${detalhes.orgao} ${detalhes.sequencial_compra}`;
                  const searchUrl = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(termo)}`;
                  window.open(searchUrl, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buscar no Portal PNCP
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const info = `${detalhes.titulo}\n\nÓrgão: ${detalhes.orgao}\nCNPJ: ${detalhes.cnpj}\nNúmero: ${detalhes.sequencial_compra}/${detalhes.ano_compra}\nValor: ${formatCurrency(detalhes.valor_estimado)}\nModalidade: ${detalhes.modalidade}\n\nObjeto:\n${detalhes.objeto}`;
                  navigator.clipboard.writeText(info);
                  toast({
                    title: "Copiado!",
                    description: "Informações copiadas para a área de transferência",
                  });
                }}
              >
                Copiar informações
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Use o botão acima para buscar esta licitação no Portal Nacional de Contratações Públicas (PNCP). 
                O portal oficial requer verificação de segurança para acesso direto aos editais.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LicitacaoDetalhes;
