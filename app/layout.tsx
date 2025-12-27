import "./globals.css";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { SiteNav } from "@/components/layout/SiteNav";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  title: "V0 Membership Gamified",
  description: "V0-friendly membership platform (Demo + Real Firebase ready)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <DemoBanner />
        <div className="container">
          <SiteNav />
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
