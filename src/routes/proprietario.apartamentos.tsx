import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApartmentFormDialog, type ApartmentRow } from "@/components/apartment-form-dialog";
import { SignedImage } from "@/components/signed-image";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/proprietario/apartamentos")({
  component: HostApartmentsPage,
});

function HostApartmentsPage() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApartmentRow | null>(null);

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ["host", "apartments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApartmentRow[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["host", "apartments"] });

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este apartamento?")) return;
    const { error } = await supabase.from("apartments").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir", { description: error.message });
    toast.success("Apartamento excluído");
    refresh();
  };

  return (
    <DashboardShell
      title="Apartamentos"
      subtitle="Cadastre e gerencie seus imóveis."
      role="Proprietário"
      userName={profile?.full_name ?? "Proprietário"}
      nav={ownerNav}
      logoutTo="/"
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo apartamento
        </Button>
      </div>

      <Card className="border-border/60 shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Endereço</TableHead>
              <TableHead className="hidden sm:table-cell">Capacidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : apartments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Você ainda não cadastrou apartamentos. Clique em "Novo apartamento" para começar.</TableCell></TableRow>
            ) : (
              apartments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="h-10 w-14 overflow-hidden rounded bg-muted">
                      {a.cover_url && <SignedImage path={a.cover_url} className="h-full w-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{a.address}, {a.city}{a.state ? `/${a.state}` : ""}</TableCell>
                  <TableCell className="hidden sm:table-cell">{a.max_guests}</TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? "default" : "outline"}>
                      {a.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ApartmentFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={refresh}
      />
    </DashboardShell>
  );
}
