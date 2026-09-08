import { PageHeader } from "@/components/dashboard/shell";
import { ReportsViewer } from "./viewer";

export default function AdminReportsPage() {
  return (
    <div>
      <PageHeader title="التقارير" description="تقارير المخزون، الإشغال، الإيرادات، المرتجعات، والتالف — مع تصدير CSV" />
      <ReportsViewer />
    </div>
  );
}
