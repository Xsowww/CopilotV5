import type { PropsWithChildren } from "react";
import { AppSidebar } from "../components/navigation/AppSidebar";
import { TopBar } from "../components/navigation/TopBar";
import { CopilotChatbot } from "../components/chatbot/CopilotChatbot";

export const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-shell">
      <AppSidebar />
      <main className="app-content">
        <TopBar />
        <div className="app-content__inner">{children}</div>
      </main>
      <CopilotChatbot />
    </div>
  );
};
