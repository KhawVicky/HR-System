import { BarChart3, ShieldCheck } from "lucide-react";
import { HREfficiencyDashboard } from "./HREfficiencyDashboard";
import { UserManagementPage } from "./admin";
import { PageLayout } from "./PageLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

export function HRManagement() {
  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "HR Management" },
      ]}
      title="HR Management"
      subtitle="Monitor HR processing performance and manage internal user accounts."
      useCard={false}
    >
      <Tabs defaultValue="efficiency" className="space-y-6">
        <TabsList>
          <TabsTrigger value="efficiency">
            <BarChart3 className="mr-2 h-4 w-4" />
            HR Efficiency
          </TabsTrigger>
          <TabsTrigger value="users">
            <ShieldCheck className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-6">
          <HREfficiencyDashboard embedded />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagementPage embedded />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
