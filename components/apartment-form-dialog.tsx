import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Upload, Loader2 } from "lucide-react";
import { SignedImage } from "./signed-image";

export type ApartmentRow = {
  id: string;
  host_id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  cover_url: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  daily_rate: number;
  is_active: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: ApartmentRow | null;
  onSaved: () => void;
  hostIdOverride?: string; // admin creating for a host — default to current user
}

export function ApartmentFormDialog({ open, onOpenChange, editing, onSaved, hostIdOverride }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPath, setCoverPath] = useState<string | null>(null);

  useEffect(() => {
    setCoverPath(editing?.cover_url ?? null);
  }, [editing, open]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("apartment-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
    setUploading(false);
    if (error) {
      toast.error("Falha ao enviar foto", { description: error.message });
      return;
    }
    setCoverPath(path);
    toast.success("Foto enviada");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const payload = {
      host_id: hostIdOverride ?? editing?.host_id ?? user.id,
      name: String(f.get("name") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
      address: String(f.get("address") ?? "").trim(),
      city: String(f.get("city") ?? "").trim(),
      state: String(f.get("state") ?? "").trim() || null,
      cover_url: coverPath,
      bedrooms: Number(f.get("bedrooms") ?? 1),
      bathrooms: Number(f.get("bathrooms") ?? 1),
      max_guests: Number(f.get("max_guests") ?? 2),
      daily_rate: Number(f.get("daily_rate") ?? 0),
      is_active: f.get("is_active") === "on",
    };

    if (!payload.name || !payload.address || !payload.city) {
      toast.error("Preencha nome, endereço e cidade");
      return;
    }

    setBusy(true);
    const { error } = editing
      ? await supabase.from("apartments").update(payload).eq("id", editing.id)
      : await supabase.from("apartments").insert(payload);
    setBusy(false);

    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    toast.success(editing ? "Apartamento atualizado" : "Apartamento cadastrado");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar apartamento" : "Novo apartamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Foto de capa</Label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-32 overflow-hidden rounded-md border bg-muted">
                {coverPath ? (
                  <SignedImage path={coverPath} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Sem foto
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Escolher foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required defaultValue={editing?.name ?? ""} placeholder="Studio Central" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_rate">Diária (R$)</Label>
              <Input id="daily_rate" name="daily_rate" type="number" step="0.01" min="0" defaultValue={editing?.daily_rate ?? 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" required defaultValue={editing?.address ?? ""} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" required defaultValue={editing?.city ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">UF</Label>
              <Input id="state" name="state" maxLength={2} defaultValue={editing?.state ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bedrooms">Quartos</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={editing?.bedrooms ?? 1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">Banheiros</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="0" defaultValue={editing?.bathrooms ?? 1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_guests">Capacidade</Label>
              <Input id="max_guests" name="max_guests" type="number" min="1" defaultValue={editing?.max_guests ?? 2} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={editing?.description ?? ""} />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="is_active" name="is_active" defaultChecked={editing?.is_active ?? true} />
            <Label htmlFor="is_active" className="cursor-pointer">Ativo (visível para hóspedes)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
