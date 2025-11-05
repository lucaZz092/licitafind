import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface SavedFilter {
  id: string;
  name: string;
  search_term: string | null;
  modalidade: string | null;
  estado: string | null;
  valor_min: number | null;
  valor_max: number | null;
  data_inicial: string | null;
  data_final: string | null;
}

interface SavedFiltersProps {
  onLoadFilter: (filter: SavedFilter) => void;
  currentFilters: {
    searchTerm: string;
    modalidade: string;
    estado: string;
    valorMin: string;
    valorMax: string;
    dataInicial: string;
    dataFinal: string;
  };
}

export const SavedFilters = ({ onLoadFilter, currentFilters }: SavedFiltersProps) => {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const { data, error } = await (supabase as any)
      .from("saved_filters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar filtros",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFilters(data || []);
  };

  const saveFilter = async () => {
    if (!filterName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o filtro",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any).from("saved_filters").insert({
      user_id: user.id,
      name: filterName,
      search_term: currentFilters.searchTerm || null,
      modalidade: currentFilters.modalidade === "all" ? null : currentFilters.modalidade,
      estado: currentFilters.estado === "all" ? null : currentFilters.estado,
      valor_min: currentFilters.valorMin ? parseFloat(currentFilters.valorMin) : null,
      valor_max: currentFilters.valorMax ? parseFloat(currentFilters.valorMax) : null,
      data_inicial: currentFilters.dataInicial || null,
      data_final: currentFilters.dataFinal || null,
    });

    if (error) {
      toast({
        title: "Erro ao salvar filtro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Filtro salvo",
      description: `"${filterName}" foi salvo com sucesso`,
    });

    setFilterName("");
    setIsOpen(false);
    loadFilters();
  };

  const deleteFilter = async (id: string) => {
    const { error } = await (supabase as any).from("saved_filters").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir filtro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Filtro excluído",
      description: "O filtro foi removido com sucesso",
    });

    loadFilters();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Filtros Salvos</CardTitle>
            <CardDescription>Salve e reutilize suas buscas frequentes</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Salvar Atual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Filtro</DialogTitle>
                <DialogDescription>
                  Dê um nome para este conjunto de filtros
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Nome do Filtro</Label>
                  <Input
                    id="filter-name"
                    placeholder="Ex: Licitações de TI - SP"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveFilter()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveFilter}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum filtro salvo ainda
          </p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{filter.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      filter.search_term && `"${filter.search_term}"`,
                      filter.modalidade,
                      filter.estado,
                      filter.valor_min && `Min: R$ ${filter.valor_min.toLocaleString()}`,
                      filter.valor_max && `Max: R$ ${filter.valor_max.toLocaleString()}`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadFilter(filter)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
