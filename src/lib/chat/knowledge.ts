import { faqs, policies } from "@/content/store-info";

export const knowledge = [
  ...policies.map((policy) => ({ id: `policy-${policy.id}`, question: policy.title, answer: policy.points.join("\n\n") })),
  ...faqs.map((faq, index) => ({ id: `faq-${index}`, question: faq.question, answer: faq.answer })),
];

export const safeReplies = {
  greeting: "Hello! I'm the Ember & Oak coffee guide. Tell me how you brew and what flavors you enjoy, or ask about shipping, returns or an order.",
  clarify: "Let's find your next favorite cup. Do you brew espresso, pour-over, French press or cold brew? Do you prefer bright and fruity or rich and chocolatey?",
  off_topic: "I can help with Ember & Oak products, coffee, store policies and orders. For anything else, please use a different service. What would you like to know about coffee?",
  handoff: "I don't have a verified answer for that. Choose Talk to a human and leave your name, email and question for the store team. This demo saves your request but does not send a real support response.",
  order_details: "Please send your order number (EO- followed by 16 letters or numbers) and checkout email together in one message. You can also use our Track your order page.",
};

export function redactChatText(text: string) {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]");
}

export function obviousInstructionAttack(text: string) {
  return /ignore.{0,30}(previous|instructions|rules)|reveal.{0,30}(prompt|secret|key)|system\s*prompt|developer\s*message|\b(jailbreak|DAN mode)\b/i.test(text);
}
