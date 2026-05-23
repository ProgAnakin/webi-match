import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PrivacyNotice } from "@/components/PrivacyNotice";

// Standalone /privacy page — the same notice shown in the welcome-screen
// consent modal, reachable via a direct link (e.g. from the email footer).
const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </button>
        <PrivacyNotice />
      </div>
    </div>
  );
};

export default Privacy;
