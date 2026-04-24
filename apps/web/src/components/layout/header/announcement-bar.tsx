import { Phone } from "lucide-react";

import { LanguageSwitcher } from "./language-switcher";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          <span>+251911223344</span>
        </div>

        <LanguageSwitcher className="text-xs text-primary-foreground hover:bg-gray-100 hover:text-primary" />
      </div>
    </div>
  );
}
