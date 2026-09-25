import type { ReactNode } from "react";


interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center px-4 py-12 text-center" aria-live="polite">
      {icon && <span className="mb-4 text-muted-foreground">{icon}</span>}
      <h2 className="type-h3">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}

