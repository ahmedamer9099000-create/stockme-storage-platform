import { ContentPage } from "@/components/site/content-page";
import { LeadForm } from "./lead-form";

export default function ContactPage() {
  return (
    <ContentPage title="تواصل معنا" description="اطلب عرض سعر أو احجز مساحتك — هنتواصل معاك في أقرب وقت">
      <LeadForm />
    </ContentPage>
  );
}
