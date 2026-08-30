export type PropertyType = "S" | "D" | "T";

export const propertyTypeLabels: Record<PropertyType, string> = {
  S: "Estúdio",
  D: "Apartamento 2 quartos",
  T: "Apartamento 3 quartos",
};

export const propertyTypes: PropertyType[] = ["S", "D", "T"];

/** O tipo do imóvel é definido pela primeira letra do código (S, D ou T). */
export function propertyTypeFromCode(code?: string | null): PropertyType | null {
  const first = (code ?? "").trim().charAt(0).toUpperCase();
  return first === "S" || first === "D" || first === "T" ? first : null;
}

export function propertyTypeLabelFromCode(code?: string | null): string {
  const t = propertyTypeFromCode(code);
  return t ? propertyTypeLabels[t] : "Tipo não identificado";
}
