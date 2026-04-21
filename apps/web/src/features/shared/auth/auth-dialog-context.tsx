import * as React from "react";

import { AuthDialog } from "./auth-dialog";

export type OpenAuthOptions = {
  /** After sign-in from `/sell`, send the user to the seller dashboard shell. */
  redirectToSellerPortal?: boolean;
  /**
   * "checkout" renders the Etsy-style modal with "Continue as a guest" as the
   * primary CTA. Use `onContinueAsGuest` to react to the guest choice.
   */
  mode?: "default" | "checkout";
  onContinueAsGuest?: () => void;
  onSignInSuccess?: () => void;
};

type AuthDialogContextValue = {
  openAuth: (options?: OpenAuthOptions) => void;
};

const AuthDialogContext = React.createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [redirectToSellerPortal, setRedirectToSellerPortal] = React.useState(false);
  const [mode, setMode] = React.useState<"default" | "checkout">("default");
  /**
   * Callbacks live in a ref so they don't trigger re-renders. We intentionally
   * do NOT clear them on close: a dialog handler may invoke the callback and
   * then close the dialog (or vice-versa), and a synchronous reset would race
   * with the callback. We overwrite the ref on the next `openAuth` instead.
   */
  const callbacksRef = React.useRef<{
    onContinueAsGuest?: () => void;
    onSignInSuccess?: () => void;
  }>({});

  const value = React.useMemo(
    () => ({
      openAuth: (options?: OpenAuthOptions) => {
        setRedirectToSellerPortal(!!options?.redirectToSellerPortal);
        setMode(options?.mode ?? "default");
        callbacksRef.current = {
          onContinueAsGuest: options?.onContinueAsGuest,
          onSignInSuccess: options?.onSignInSuccess,
        };
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
        mode={mode}
        onContinueAsGuest={() => callbacksRef.current.onContinueAsGuest?.()}
        onSignInSuccess={() => callbacksRef.current.onSignInSuccess?.()}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setRedirectToSellerPortal(false);
            setMode("default");
          }
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
