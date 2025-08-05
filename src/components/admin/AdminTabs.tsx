'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductManager } from './ProductManager';
import { CategoryManager } from './CategoryManager';
import { ReportsManager } from "./ReportsManager";
import { CustomerManager } from "./CustomerManager";
import { SiteSettingsManager } from "./SiteSettingsManager";
import { Package, Tags, LineChart, FileDown, Users, Settings, CheckCircle } from "lucide-react";
import { DashboardView } from "./DashboardView";
import { useAuth } from "@/context/AuthContext";
import { ApprovalsManager } from "./ApprovalsManager";

export function AdminTabs() {
  const { userRole } = useAuth();
  
  const isAdmin = userRole === 'admin';

  // Define as abas visíveis para cada perfil
  const adminTabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LineChart },
    { value: 'approvals', label: 'Aprovações', icon: CheckCircle },
    { value: 'products', label: 'Produtos', icon: Package },
    { value: 'categories', label: 'Categorias', icon: Tags },
    { value: 'customers', label: 'Clientes', icon: Users },
    { value: 'reports', label: 'Relatórios', icon: FileDown },
    { value: 'settings', label: 'Configurações', icon: Settings },
  ];
  
  const socialMediaTabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LineChart },
    { value: 'products', label: 'Produtos', icon: Package },
    { value: 'categories', label: 'Categorias', icon: Tags },
    { value: 'settings', label: 'Configurações', icon: Settings },
  ];

  const visibleTabs = isAdmin ? adminTabs : socialMediaTabs;

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className={`grid w-full mb-6`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))`}}>
        {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
            </TabsTrigger>
        ))}
      </TabsList>

      {/* Conteúdo das abas */}
      <TabsContent value="dashboard">
        <DashboardView />
      </TabsContent>
      <TabsContent value="products">
        <ProductManager />
      </TabsContent>
      <TabsContent value="categories">
        <CategoryManager />
      </TabsContent>
       <TabsContent value="settings">
        <SiteSettingsManager />
      </TabsContent>

      {/* Conteúdo exclusivo do Admin */}
      {isAdmin && (
        <>
          <TabsContent value="approvals">
            <ApprovalsManager />
          </TabsContent>
          <TabsContent value="customers">
            <CustomerManager />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsManager />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
