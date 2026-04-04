import * as React from "react";

import { AuthDialog } from "./auth-dialog";

type AuthDialogContextValue = {
  openAuth: () => void;
};

const AuthDialogContext = React.createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({
      openAuth: () => setOpen(true),
    }),
    [],
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog open={open} onOpenChange={setOpen} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const ctx = React.useContext(AuthDialogContext);
  if (!ctx) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider");
  }
  return ctx;
}
