type DeveloperCreditProps = {
  className?: string;
};

/** Assinatura visual comum a todas as áreas da plataforma. */
export function DeveloperCredit({ className = "" }: DeveloperCreditProps) {
  return (
    <span className={`font-medium ${className}`.trim()}>
      Criação e desenvolvimento: Ariane Sóllner
    </span>
  );
}
