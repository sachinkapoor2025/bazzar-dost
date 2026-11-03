import "server-only";
import { getCategories, searchCards } from "@/lib/catalog";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import { localHome } from "@/lib/local-catalogue";
import { site } from "@/lib/site";

export const OFF_TOPIC_REPLY =
  "I'm here to help you with BazaarDost-related queries only. Please feel free to ask me anything about our products, orders, or services.";

export type ChatLink = { href: string; label: string };
export type ChatAnswer = { reply: string; links: ChatLink[] };

const STRONG =
  /\b(bazaardost|bazaar\s*dost|products?|categor(?:y|ies)|orders?|shipping|deliver(?:y|ies|ed)?|returns?|refunds?|payments?|\bpay\b|cod|cash on delivery|cart|checkout|coupons?|wishlist|accounts?|track(?:ing)?|wholesale|deals?|offers?|stock|prices?|shop(?:ping)?|catalog(?:ue)?|contact|support|faq|polic(?:y|ies)|cancel(?:lation)?|invoice|discount)\b/i;

const OTHER_BUSINESS =
  /\b(amazon|flipkart|meesho|myntra|ajio|nykaa|ebay|walmart|alibaba|usarakhi|blossom\s*pot|blossompot|spicy\s*cent(?:er|re)|spicycorner|shopify)\b/i;

const GENERAL =
  /\b(capital of|president|prime minister|weather|forecast|who (?:is|was)|who invented|translate|poem|essay|joke|homework|cricket|football|bitcoin|crypto|stock market|python|javascript|programming|write (?:a |me )?(?:code|story)|what is \d|solve|recipe)\b/i;

function offTopic(): ChatAnswer {
  return { reply: OFF_TOPIC_REPLY, links: [] };
}

function supportReply(): ChatAnswer {
  const email = site.supportEmail
    ? ` You can write to BazaarDost customer support at ${site.supportEmail}.`
    : " Use the contact form and the store team will read your message.";
  return {
    reply: `I couldn't find an answer to that on the BazaarDost website. Please contact BazaarDost customer support.${email}`,
    links: [{ href: "/contact", label: "Contact BazaarDost" }],
  };
}

function productQuery(text: string): string {
  return text
    .replace(
      /\b(do you|have you|can i|could you|i want|i need|i'm looking|im looking|looking for|show me|search for|find me|price of|cost of|how much(?: is| are| does)?|is there|are there|please|bazaardost|bazaar dost|sell|selling|available|availability|what|which|where|when|why|how|who|the|a|an|some|your|you|our|any|me|for|of|in|on|at|with|and|or|products?|items?|have|got|buy|get|need|want|does|did|is|are|was|were|this|that|it|there|do)\b/g,
      " ",
    )
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function shippingAnswer(): ChatAnswer {
  return {
    reply: `Shipping on BazaarDost is ${formatINR(SHIPPING_FLAT_RUPEES)} when the product total after discounts is below ${formatINR(FREE_SHIPPING_ABOVE)}. At ${formatINR(FREE_SHIPPING_ABOVE)} and above, shipping is free. Checkout does not add a separate tax line. The website does not promise a delivery date or a courier. After an order is placed, the store can add a tracking note. An address needs a street, city, state, and 6-digit PIN code. It is not checked against a postal database.`,
    links: [{ href: "/shipping-policy", label: "Shipping policy" }],
  };
}

function paymentAnswer(): ChatAnswer {
  return {
    reply: "BazaarDost checkout accepts cash on delivery. The order is saved as unpaid until the store marks it paid after collection. Card numbers are not collected, and the website does not take card, UPI, or other online payments.",
    links: [{ href: "/faq", label: "Payment FAQ" }, { href: "/checkout", label: "Checkout" }],
  };
}

function returnsAnswer(): ChatAnswer {
  return {
    reply: "You can ask to cancel a BazaarDost order while its status is Placed or Confirmed. Use the contact form and include the order number. Orders marked Processing, Shipped, or Delivered are not cancelled automatically. Cash on delivery orders have no online payment to refund. If the store has marked a payment as paid and later agrees a refund, the payment status can be set to refunded. The money movement itself happens outside this website. There is no automatic return window and no prepaid return label.",
    links: [{ href: "/returns", label: "Returns policy" }, { href: "/contact", label: "Contact the store" }],
  };
}

function trackingAnswer(): ChatAnswer {
  return {
    reply: "BazaarDost account pages show only the signed-in customer's orders. Guest tracking needs both the order number and the checkout email. This chat cannot look up a live order. Until the store adds a tracking note, the order page says that no courier note has been added.",
    links: [{ href: "/track", label: "Track an order" }, { href: "/account/orders", label: "Your orders" }],
  };
}

function couponAnswer(): ChatAnswer {
  const remote = Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
  if (remote) {
    return {
      reply: "A BazaarDost coupon changes the checkout total only when it is active and the cart meets its minimum. Active codes are shown on the homepage when the store has published them. I don't have a separate coupon list in this chat.",
      links: [{ href: "/", label: "Homepage deals" }, { href: "/checkout", label: "Checkout" }],
    };
  }
  const coupon = localHome().coupons[0];
  if (!coupon) return supportReply();
  const off = coupon.type === "PERCENT" ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`;
  const minimum = coupon.minSubtotal ? ` on a product total from ${formatINR(coupon.minSubtotal)}` : "";
  return {
    reply: `The coupon published on the BazaarDost homepage is ${coupon.code}: ${off}${minimum}. Checkout applies it only when it is still active and the cart meets that rule.`,
    links: [{ href: "/", label: "See it on the homepage" }, { href: "/checkout", label: "Checkout" }],
  };
}

function aboutAnswer(): ChatAnswer {
  return {
    reply: "BazaarDost is a shop for practical everyday products: home and kitchen, beauty and personal care, phone and electronics accessories, toys, bags, home decor, garden items, and more. Each product page shows the stored selling price, stock, and photos. A discount appears only when that product has a higher compare-at price. Checkout is cash on delivery.",
    links: [{ href: "/about", label: "About BazaarDost" }, { href: "/shop", label: "Shop the catalogue" }],
  };
}

function contactAnswer(): ChatAnswer {
  const email = site.supportEmail
    ? `You can write to ${site.supportEmail}, or use the contact form.`
    : "No public email address or phone number is published on the website. Use the contact form and the store team will read the message.";
  return {
    reply: `BazaarDost customer support is the contact form on this website. ${email} An email notification is sent only when outbound email is configured.`,
    links: [{ href: "/contact", label: "Contact BazaarDost" }],
  };
}

function accountAnswer(): ChatAnswer {
  return {
    reply: "A BazaarDost account keeps your name, email, phone if you add one, and a hashed password. Saved addresses, orders, and the account wishlist belong to that sign-in. A guest cart and wishlist stay in the browser. You can only see your own orders. Guest tracking needs the order number and the checkout email.",
    links: [{ href: "/account", label: "My account" }, { href: "/privacy", label: "Privacy policy" }],
  };
}

function stockAnswer(): ChatAnswer {
  return {
    reply: "A BazaarDost product uses the quantity stored for that item. When the quantity is zero, Add to cart is turned off and the label says out of stock. In-stock products can still be ordered. Ask for a product name if you want the stock stored for that item.",
    links: [{ href: "/shop", label: "Shop" }, { href: "/faq", label: "FAQ" }],
  };
}

function dealsAnswer(): ChatAnswer {
  return {
    reply: "A BazaarDost product is a deal only when the catalogue stores a compare-at price higher than the selling price. The percentage is calculated from those two numbers. Best sellers are products that have been ordered. Cancelled orders are not counted. If nobody has ordered yet, the best-seller list is empty.",
    links: [{ href: "/deals", label: "Deals and offers" }, { href: "/best-sellers", label: "Best sellers" }],
  };
}

function wholesaleAnswer(): ChatAnswer {
  return {
    reply: "A wholesale enquiry on BazaarDost stores a message. It does not place an order or reserve stock. Quantity prices apply in the cart only if you check out at the retail price. Wholesale prices are confirmed by the store. They are not applied as a cart discount unless the store changes the selling price or issues a coupon.",
    links: [{ href: "/wholesale", label: "Wholesale" }, { href: "/contact", label: "Contact the store" }],
  };
}

export async function answerQuestion(message: string): Promise<ChatAnswer> {
  const text = message.trim().replace(/\s+/g, " ").slice(0, 500);
  const lower = text.toLowerCase();
  if (lower.length < 2) {
    return { reply: "Please ask a question about BazaarDost products, orders, or services.", links: [] };
  }
  if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening)[!.\s]*$/.test(lower)) {
    return {
      reply: "Hello. I can help with BazaarDost products, categories, orders, shipping, delivery, returns, refunds, and payments.",
      links: [{ href: "/shop", label: "Browse products" }, { href: "/faq", label: "FAQ" }],
    };
  }
  if (/^(thanks|thank you|thankyou)[!.\s]*$/.test(lower)) {
    return { reply: "You're welcome. Ask me anything about BazaarDost products, orders, or services.", links: [] };
  }
  if (OTHER_BUSINESS.test(lower) && !/bazaardost|bazaar\s*dost/.test(lower)) return offTopic();

  if (/\b(return|refund|cancel)\b/.test(lower)) return returnsAnswer();
  if (/\b(shipping|delivery|deliver|courier|pin\s*code|pincode)\b/.test(lower)) return shippingAnswer();
  if (/\b(payment|payments|\bpay\b|cod|cash on delivery|card|upi|razorpay|stripe)\b/.test(lower)) return paymentAnswer();
  if (/\b(track|tracking|order status|my order|where is my order)\b/.test(lower)) return trackingAnswer();
  if (/\b(coupon|promo|discount code|voucher)\b/.test(lower)) return couponAnswer();
  if (/\bwholesale\b/.test(lower)) return wholesaleAnswer();
  if (/\b(best sellers?|bestsellers?|deals?|offers?|compare-at|compare at)\b/.test(lower)) return dealsAnswer();
  if (/\b(about us|about you|about the store|about your store|about bazaardost|about bazaar dost|who are you|what is bazaardost|what is bazaar dost)\b/.test(lower)) return aboutAnswer();
  if (/\b(contact|customer support|email|phone|help desk)\b/.test(lower)) return contactAnswer();
  if (/\b(account|login|log in|sign in|password|wishlist|privacy)\b/.test(lower)) return accountAnswer();
  if (/\b(out of stock|in stock|stock)\b/.test(lower) && productQuery(lower).length < 2) return stockAnswer();
  if (/\b(terms|policy)\b/.test(lower) && productQuery(lower).length < 2) {
    return {
      reply: "BazaarDost publishes a shipping policy, a return and refund policy, terms for the catalogue and cash-on-delivery checkout, and a privacy policy. I can answer from those pages if you name the topic.",
      links: [
        { href: "/shipping-policy", label: "Shipping" },
        { href: "/returns", label: "Returns" },
        { href: "/terms", label: "Terms" },
        { href: "/privacy", label: "Privacy" },
      ],
    };
  }

  if (/\b(categor(?:y|ies)|departments?|what do you sell|what do you have)\b/.test(lower)) {
    const categories = await getCategories("top");
    if (categories.length === 0) return supportReply();
    const names = categories.map((category) => category.name).join(", ");
    return {
      reply: `BazaarDost departments with products are: ${names}.`,
      links: categories.slice(0, 8).map((category) => ({ href: `/categories/${category.slug}`, label: category.name })),
    };
  }

  const query = productQuery(lower);
  if (query.length >= 2) {
    const [items, categories] = await Promise.all([searchCards(query, 4), getCategories("all")]);
    const matchedCategories = categories.filter((category) => category.name.toLowerCase().includes(query)).slice(0, 3);
    if (items.length === 0 && matchedCategories.length === 0) {
      if (GENERAL.test(lower) && !STRONG.test(lower)) return offTopic();
      return STRONG.test(lower) ? supportReply() : offTopic();
    }
    const lines = items.map((item) => {
      const compare = item.compareAtPrice && item.compareAtPrice > item.price ? ` (compare-at ${formatINR(item.compareAtPrice)})` : "";
      const stock = item.inStock ? "In stock" : "Out of stock";
      return `${item.name} — ${formatINR(item.price)}${compare} — ${item.categoryName} — ${stock}`;
    });
    const categoryLine = matchedCategories.length
      ? ` Matching departments: ${matchedCategories.map((category) => category.name).join(", ")}.`
      : "";
    const productLine = lines.length ? `Matching products on the BazaarDost catalogue: ${lines.join("; ")}.` : "";
    return {
      reply: `${productLine}${categoryLine}`.trim(),
      links: [
        ...items.map((item) => ({ href: `/products/${item.slug}`, label: item.name })),
        ...matchedCategories.map((category) => ({ href: `/categories/${category.slug}`, label: category.name })),
      ],
    };
  }

  if (GENERAL.test(lower) && !STRONG.test(lower)) return offTopic();
  if (STRONG.test(lower)) return supportReply();
  return offTopic();
}
