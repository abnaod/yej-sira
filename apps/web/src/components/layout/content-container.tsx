export function ContentContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-14">{children}</div>
  );
}
