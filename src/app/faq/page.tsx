import type { Metadata } from "next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs, policies, STORE, type Faq } from "@/content/store-info";

export const metadata: Metadata = {
  title: "FAQ & policies",
  description: "Shipping, returns, grind options, storage tips and answers to common questions.",
};

const categories: Faq["category"][] = ["Coffee", "Brewing", "Orders"];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-12">
        <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">Help center</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Questions &amp; policies</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Can&apos;t find what you need? Email us at{" "}
          <span className="font-medium text-espresso">{STORE.email}</span> ({STORE.supportHours}).
        </p>
      </header>

      <nav aria-label="On this page" className="mb-12 flex flex-wrap gap-2">
        {[...categories.map((c) => ({ id: c.toLowerCase(), label: c })), ...policies.map((p) => ({ id: p.id, label: p.title }))].map(
          (link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-espresso hover:border-oak"
            >
              {link.label}
            </a>
          ),
        )}
      </nav>

      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category} id={category.toLowerCase()} aria-labelledby={`${category}-heading`} className="scroll-mt-32">
            <h2 id={`${category}-heading`} className="mb-4 text-2xl font-semibold">
              {category}
            </h2>
            <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-5">
              {faqs
                .filter((faq) => faq.category === category)
                .map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="py-4 text-base font-medium text-espresso">{faq.question}</AccordionTrigger>
                    <AccordionContent className="pb-4 leading-relaxed text-espresso/85">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </section>
        ))}

        {policies.map((policy) => (
          <section key={policy.id} id={policy.id} aria-labelledby={`${policy.id}-heading`} className="scroll-mt-32">
            <h2 id={`${policy.id}-heading`} className="mb-4 text-2xl font-semibold">
              {policy.title}
            </h2>
            <ul className="space-y-3 rounded-2xl border border-border bg-card p-6">
              {policy.points.map((point) => (
                <li key={point} className="flex gap-3 leading-relaxed text-espresso/90">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ember" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
