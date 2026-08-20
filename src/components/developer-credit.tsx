type DeveloperCreditProps = {
  className?: string;
};

/** Assinatura visual comum a todas as áreas da plataforma. */
export function DeveloperCredit({ className = "" }: DeveloperCreditProps) {
  return (
    <span className={`font-medium ${className}`.trim()}>
      • Desenvolvido por Ariane Sóllner
    </span>
  );
}
