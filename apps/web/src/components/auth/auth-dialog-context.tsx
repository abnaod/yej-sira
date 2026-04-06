import * as React from "react";

import { AuthDialog } from "./auth-dialog";

export type OpenAuthOptions = {
  /** After sign-in from `/sell`, send the user to the seller dashboard shell. */
  redirectToSellerPortal?: boolean;
};

type AuthDialogContextValue = {
  openAuth: (options?: OpenAuthOptions) => void;
};

const AuthDialogContext = React.createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [redirectToSellerPortal, setRedirectToSellerPortal] = React.useState(false);

  const value = React.useMemo(
    () => ({
      openAuth: (options?: OpenAuthOptions) => {
        setRedirectToSellerPortal(!!options?.redirectToSellerPortal);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog
        open={open}
        redirectToSellerPortal={redirectToSellerPortal}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setRedirectToSellerPortal(false);
        }}
      />
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
