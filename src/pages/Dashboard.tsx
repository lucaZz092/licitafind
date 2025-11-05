import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, LogOut, Filter, Calendar, DollarSign, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [userName, setUserName] = useState("");
  const [modalidadeFilter, setModalidadeFilter] = useState("all");
  const [valorFilter, setValorFilter] = useState("all");

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
    if (!searchTerm.trim()) {
      toast({
        title: "Digite algo para buscar",
        description: "Informe palavras-chave para a pesquisa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-licitacoes", {
        body: { 
          searchTerm,
          modalidade: modalidadeFilter === "all" ? undefined : modalidadeFilter,
          valorMin: valorFilter === "all" ? undefined : getValorMin(valorFilter),
        },
      });

      if (error) throw error;

      setLicitacoes(data?.licitacoes || []);
      
      if (!data?.licitacoes || data.licitacoes.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Tente outros termos de busca",
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

  const getValorMin = (filter: string): number | undefined => {
    switch (filter) {
      case "low": return 0;
      case "medium": return 100000;
      case "high": return 1000000;
      default: return undefined;
    }
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Licitações
            </CardTitle>
            <CardDescription>
              Pesquise licitações em todo o Brasil usando dados oficiais do PNCP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite palavras-chave (ex: equipamentos hospitalares, construção)"
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

            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
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

              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Select value={valorFilter} onValueChange={setValorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valor estimado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os valores</SelectItem>
                    <SelectItem value="low">Até R$ 100 mil</SelectItem>
                    <SelectItem value="medium">R$ 100 mil - R$ 1 milhão</SelectItem>
                    <SelectItem value="high">Acima de R$ 1 milhão</SelectItem>
                  </SelectContent>
                </Select>
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