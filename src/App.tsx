import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';
import { CommandPalette } from './components/common/CommandPalette';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { DashboardView } from './components/dashboard/DashboardView';
import { ClientListView } from './components/clients/ClientListView';
import { ProjectListView } from './components/projects/ProjectListView';
import { TasksView } from './components/tasks/TasksView';
import { TimeTrackerView } from './components/timer/TimeTrackerView';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab, user, isAuthenticated } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If user is not authenticated, show the dedicated Full Auth Page
  if (!isAuthenticated || !user) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'clients':
        return <ClientListView />;
      case 'projects':
        return <ProjectListView />;
      case 'tasks':
        return <TasksView />;
      case 'time':
        return <TimeTrackerView />;
      case 'invoices':
        return <InvoiceListView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar - Fixed / Sticky at Top */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main App Layout: Fixed Left Sidebar + Scrollable Content Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Fixed Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace Content Viewport (Scrolls independently) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Interactive Overlays & Modals */}
      <ToastContainer />
      <ConfirmModal />
      <CommandPalette />
      <AiAssistantModal />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <MainContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
