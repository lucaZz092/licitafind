import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, LogOut, Filter, Calendar, DollarSign, Building2, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedFilters } from "@/components/SavedFilters";

interface Licitacao {
  id: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  valor_estimado: number;
  data_abertura: string;
  situacao: string;
  objeto: string;
  link_pncp?: string;
  cnpj?: string;
  ano_compra?: number;
  sequencial_compra?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [userName, setUserName] = useState("");
  const [modalidadeFilter, setModalidadeFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  useEffect(() => {
    checkUser();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile?.full_name) {
      setUserName(profile.full_name);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-licitacoes", {
        body: { 
          searchTerm: searchTerm || undefined,
          modalidade: modalidadeFilter === "all" ? undefined : modalidadeFilter,
          estado: estadoFilter === "all" ? undefined : estadoFilter,
          valorMin: valorMin ? parseFloat(valorMin) : undefined,
          valorMax: valorMax ? parseFloat(valorMax) : undefined,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
      });

      if (error) throw error;

      setLicitacoes(data?.licitacoes || []);
      
      if (!data?.licitacoes || data.licitacoes.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Tente ajustar os filtros",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFilter = (filter: any) => {
    setSearchTerm(filter.search_term || "");
    setModalidadeFilter(filter.modalidade || "all");
    setEstadoFilter(filter.estado || "all");
    setValorMin(filter.valor_min?.toString() || "");
    setValorMax(filter.valor_max?.toString() || "");
    setDataInicial(filter.data_inicial || "");
    setDataFinal(filter.data_final || "");
    
    toast({
      title: "Filtro carregado",
      description: `"${filter.name}" foi aplicado`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LicitaBusca</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Olá, {userName}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <SavedFilters 
          onLoadFilter={handleLoadFilter}
          currentFilters={{
            searchTerm,
            modalidade: modalidadeFilter,
            estado: estadoFilter,
            valorMin,
            valorMax,
            dataInicial,
            dataFinal,
          }}
        />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Licitações
            </CardTitle>
            <CardDescription>
              Pesquise licitações em todo o Brasil usando dados oficiais do PNCP (palavra-chave opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Palavras-chave (opcional)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas modalidades</SelectItem>
                    <SelectItem value="PREGAO">Pregão</SelectItem>
                    <SelectItem value="CONCORRENCIA">Concorrência</SelectItem>
                    <SelectItem value="TOMADA_PRECO">Tomada de Preço</SelectItem>
                    <SelectItem value="DISPENSA">Dispensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="AC">Acre</SelectItem>
                    <SelectItem value="AL">Alagoas</SelectItem>
                    <SelectItem value="AP">Amapá</SelectItem>
                    <SelectItem value="AM">Amazonas</SelectItem>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="CE">Ceará</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="MA">Maranhão</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="PA">Pará</SelectItem>
                    <SelectItem value="PB">Paraíba</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="PE">Pernambuco</SelectItem>
                    <SelectItem value="PI">Piauí</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="RO">Rondônia</SelectItem>
                    <SelectItem value="RR">Roraima</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="SE">Sergipe</SelectItem>
                    <SelectItem value="TO">Tocantins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Valor mínimo"
                  value={valorMin}
                  onChange={(e) => setValorMin(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Valor máximo"
                  value={valorMax}
                  onChange={(e) => setValorMax(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Data inicial"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Data final"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {licitacoes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {licitacoes.length} {licitacoes.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            </h2>
            {licitacoes.map((licitacao) => (
              <Card key={licitacao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{licitacao.titulo}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4" />
                        {licitacao.orgao}
                      </CardDescription>
                    </div>
                    <Badge variant={licitacao.situacao === "ABERTA" ? "default" : "secondary"}>
                      {licitacao.situacao}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{licitacao.objeto}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="font-medium">Modalidade:</span>
                      <span>{licitacao.modalidade}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="font-medium">Valor:</span>
                      <span>{formatCurrency(licitacao.valor_estimado)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span className="font-medium">Abertura:</span>
                      <span>{formatDate(licitacao.data_abertura)}</span>
                    </div>
                  </div>
                  {licitacao.link_pncp && (
                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(licitacao.link_pncp, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver detalhes no PNCP
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;