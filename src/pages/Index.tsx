import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, Zap, Bell, CheckCircle2, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Licita Find</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Entrar
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            Dados oficiais do PNCP em tempo real
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Encontre as melhores <span className="text-primary">licitações</span> para seu negócio
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Busque entre milhares de licitações públicas em todo o Brasil. 
            Sistema de assinatura com acesso completo a dados oficiais e atualizados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[200px]">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]">
              Ver Demonstração
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Por que escolher o Licita Find?</h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas poderosas para otimizar sua busca por licitações
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 hover:shadow-lg transition-all">
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Busca Avançada</CardTitle>
                <CardDescription>
                  Encontre licitações com filtros por modalidade, valor, órgão e data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dados Oficiais</CardTitle>
                <CardDescription>
                  Integração direta com o Portal Nacional de Contratações Públicas (PNCP)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Resultados Rápidos</CardTitle>
                <CardDescription>
                  Sistema otimizado para buscas rápidas e precisas em tempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all">
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Sempre Atualizado</CardTitle>
                <CardDescription>
                  Dados sincronizados automaticamente com as fontes oficiais
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Acesso completo a licitações de todo o Brasil
              </h2>
              <p className="text-muted-foreground text-lg">
                Com o Licita Find, você tem acesso a uma plataforma completa para 
                monitorar e buscar licitações públicas de forma eficiente e segura.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Busca por palavras-chave em milhares de licitações",
                  "Filtros avançados por modalidade e valor",
                  "Dados oficiais e sempre atualizados",
                  "Interface intuitiva e fácil de usar",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" onClick={() => navigate("/auth")} className="mt-6">
                Criar Conta Gratuita
              </Button>
            </div>

            <Card className="p-8 shadow-xl border-border/50">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Plano Assinante</CardTitle>
                <CardDescription>Acesso completo a todas as funcionalidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  {[
                    "Buscas ilimitadas",
                    "Todos os filtros disponíveis",
                    "Dados atualizados em tempo real",
                    "Suporte prioritário",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6" size="lg" onClick={() => navigate("/auth")}>
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-12 text-center shadow-2xl">
            <div className="space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para começar?
              </h2>
              <p className="text-lg opacity-90">
                Crie sua conta agora e tenha acesso a milhares de licitações em todo o Brasil
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="min-w-[200px]"
              >
                Criar Conta Gratuita
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <span className="font-semibold">Licita Find</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Licita Find. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
