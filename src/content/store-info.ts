import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";

/**
 * Store policies and FAQ — the single source of truth for customer-facing
 * answers. The FAQ page renders this file, and the AI assistant is given the
 * same text, so the website and the chatbot can never disagree.
 *
 * To change a policy, edit it here: both places update automatically.
 */

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export const STORE = {
  name: "Ember & Oak Coffee Roasters",
  city: "Portland, Oregon",
  email: "hello@emberandoak.example",
  supportHours: "Monday to Friday, 9 am – 4 pm Pacific",
};

export type Policy = { id: string; title: string; points: string[] };

export const policies: Policy[] = [
  {
    id: "shipping",
    title: "Shipping",
    points: [
      `We ship within the United States only (all 50 states, including Alaska and Hawaii). We do not ship internationally at this time.`,
      `Flat-rate shipping is ${dollars(FLAT_SHIPPING_CENTS)} per order. Orders of ${dollars(FREE_SHIPPING_THRESHOLD_CENTS)} or more ship free.`,
      `We roast on Mondays and Thursdays. Orders placed before 10 am Pacific on a roast day are roasted that day; others are roasted on the next roast day.`,
      `Orders ship within 1 business day after roasting via USPS Priority Mail. Delivery usually takes 2–5 business days after shipping. These are estimates, not guarantees — carrier delays can happen.`,
      `You receive a tracking number by email as soon as your order ships.`,
    ],
  },
  {
    id: "returns",
    title: "Returns & freshness guarantee",
    points: [
      `Coffee: if you're not happy with a coffee, email us within 14 days of delivery and we'll send a replacement or issue a refund — once per customer per coffee.`,
      `Brewing gear: unused items in the original packaging can be returned within 30 days of delivery for a refund of the item price. Return shipping is paid by the customer unless the item arrived damaged or defective.`,
      `Damaged or lost packages: contact us within 7 days of the expected delivery date and we'll make it right.`,
      `Refunds go back to the original payment method within 5–10 business days after approval. Only the support team can approve refunds.`,
      `Gift bundles follow the same rules as their contents.`,
    ],
  },
  {
    id: "orders",
    title: "Payment & pricing",
    points: [
      `We accept all major credit and debit cards, Apple Pay and Google Pay through our secure payment partner, Stripe.`,
      `Order changes or cancellations are possible until your coffee is roasted. Email us with your order number as soon as possible.`,
      `Prices are in US dollars. Oregon has no sales tax, and we do not currently collect sales tax on orders.`,
      `We don't offer discount codes at the moment. Occasional promotions are announced on our newsletter only.`,
      `Subscriptions are not available yet — they're on our roadmap.`,
    ],
  },
];

export type Faq = { category: "Coffee" | "Brewing" | "Orders"; question: string; answer: string };

export const faqs: Faq[] = [
  {
    category: "Coffee",
    question: "How fresh is your coffee?",
    answer:
      "Every bag is roasted to order on Mondays and Thursdays and printed with its roast date. Most coffees taste best between 5 and 30 days after roasting; espresso often shines after a week of rest.",
  },
  {
    category: "Coffee",
    question: "Which grind options do you offer?",
    answer:
      "Whole bean (our recommendation for the freshest cup), fine for espresso, medium for drip and pour-over, coarse for French press, and extra coarse for cold brew. Pick your grind on the product page. Brewing gear is not ground, of course.",
  },
  {
    category: "Coffee",
    question: "How should I store my coffee?",
    answer:
      "Keep it in the resealable bag it comes in (it has a one-way valve), or in an airtight, opaque container at room temperature, away from heat, light and moisture. Please don't refrigerate it. You can freeze sealed, unopened bags for up to two months — thaw completely before opening.",
  },
  {
    category: "Coffee",
    question: "Do you have decaf?",
    answer: "Not right now. We're sourcing a Swiss Water Process decaf and hope to add it soon.",
  },
  {
    category: "Coffee",
    question: "What does roast level change?",
    answer:
      "Lighter roasts keep more of the origin character: brighter acidity, floral and fruity notes. Darker roasts bring more body, lower acidity and chocolate, caramel or smoky flavors. Medium roasts sit in between and are the most versatile.",
  },
  {
    category: "Brewing",
    question: "Which coffee should I choose for espresso?",
    answer:
      "Ironwood Espresso is built for it: low acidity, thick body and a chocolatey shot that works great with milk. Huila Hearth also makes a sweet, balanced espresso.",
  },
  {
    category: "Brewing",
    question: "What's a good starting recipe for pour-over?",
    answer:
      "Try 20 g of coffee to 320 g of water at about 200 °F (93 °C), medium grind, with a total brew time of around 3 minutes. Adjust finer if it tastes sour, coarser if it tastes bitter.",
  },
  {
    category: "Brewing",
    question: "How do I make cold brew?",
    answer:
      "Use an extra-coarse grind at a 1:8 coffee-to-water ratio and steep in the fridge for 16–18 hours. Filter, then dilute the concentrate 1:1 with water or milk. Night Shift Cold Brew Blend was designed for exactly this.",
  },
  {
    category: "Orders",
    question: "How long does delivery take?",
    answer:
      "We roast on Mondays and Thursdays and ship within 1 business day after roasting. USPS Priority usually delivers in 2–5 business days after that. These are estimates, not guarantees.",
  },
  {
    category: "Orders",
    question: "How can I track my order?",
    answer:
      "Use the \"Track your order\" page with your order number and the email you used at checkout, or ask our assistant in the chat.",
  },
  {
    category: "Orders",
    question: "Can I send a bundle as a gift?",
    answer:
      "Yes. Enter the recipient's shipping address at checkout. Packing slips never show prices, and the Morning Ritual Gift Box includes a handwritten note with your message.",
  },
  {
    category: "Orders",
    question: "Do you sell wholesale?",
    answer: `We supply a handful of cafés and offices in the Portland area. Email ${STORE.email} to talk about wholesale.`,
  },
];
