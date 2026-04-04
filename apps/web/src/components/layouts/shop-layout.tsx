import { AuthDialogProvider } from "@/components/auth";
import { ContentContainer } from "@/components/layout/content-container";
import { Footer } from "@/components/layout/footer/footer";
import { Header } from "@/components/layout/header/header";

export function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthDialogProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <ContentContainer>{children}</ContentContainer>
        <Footer />
      </div>
    </AuthDialogProvider>
  );
}
