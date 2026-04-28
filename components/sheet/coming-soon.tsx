export function ComingSoon({ phase, tab }: { phase: string; tab: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {phase}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{tab} lands soon</h2>
      <p className="mt-2 text-sm text-zinc-500">
        See <code className="font-mono">docs/frontend-plan.md</code> §9.
      </p>
    </div>
  );
}
