// Genuine-looking placeholder reviews shown when a product has no real
// customer reviews yet. They get replaced automatically once real reviews
// are submitted.

const CATEGORY_FLAVOR = {
  Skincare: {
    results: "My skin feels softer and looks visibly more glowing",
    effect: "no breakouts or irritation at all",
    usage: "on my face every morning and night",
  },
  Makeup: {
    results: "the finish looks absolutely stunning in real life",
    effect: "it stays put the whole day without any patchiness",
    usage: "for my daily routine",
  },
  Haircare: {
    results: "my hair feels softer and looks shinier",
    effect: "less hair fall and no dryness",
    usage: "twice a week",
  },
  Fragrance: {
    results: "the scent is so elegant and long lasting",
    effect: "I get compliments everywhere I go",
    usage: "every morning",
  },
  "Bath & Body": {
    results: "my skin feels smooth and deeply moisturised",
    effect: "a lovely fresh feel that lasts all day",
    usage: "after my bath",
  },
};

const DEFAULT_FLAVOR = {
  results: "the quality is far better than what I expected",
  effect: "it works exactly as described",
  usage: "regularly since I received it",
};

const REVIEWERS = [
  { name: "Priya Sharma", rating: 5, days: 12, helpful: 34 },
  { name: "Anjali Verma", rating: 5, days: 8, helpful: 27 },
  { name: "Rahul Kapoor", rating: 4, days: 15, helpful: 19 },
  { name: "Sneha Patel", rating: 5, days: 5, helpful: 41 },
  { name: "Meera Iyer", rating: 4, days: 21, helpful: 15 },
  { name: "Kavita Singh", rating: 5, days: 3, helpful: 52 },
];

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getDefaultReviews(product) {
  const flavor = CATEGORY_FLAVOR[product?.category] || DEFAULT_FLAVOR;
  const name = product?.name || "this product";
  const shortName = name.length > 42 ? `${name.slice(0, 42)}...` : name;

  const cap = (text) => text[0].toUpperCase() + text.slice(1);
  const resultsCap = cap(flavor.results);
  const effectCap = cap(flavor.effect);

  // Keep the default ratings close to the product's own rating so the
  // summary and the rating badge agree with each other.
  const base = Math.min(
    5,
    Math.max(3, Math.round(Number(product?.rating || 4.5)))
  );
  const ratings = [
    base,
    base,
    Math.max(1, base - 1),
    base,
    Math.max(1, base - 1),
    base,
  ];

  const texts = [
    `Absolutely love ${shortName}! ${resultsCap} — honestly didn't expect this quality at this price. Packaging was neat and delivery was super quick. Will definitely buy again.`,
    `This is my second order from DealRoot and I'm impressed once again. The product feels 100% original — I compared it with one from a big store and it's identical. Highly recommended!`,
    `Been using it ${flavor.usage} for a couple of weeks now and I can already see a difference. ${resultsCap}. No side effects, mild smell, very easy to use. Great value for money.`,
    `Ordered it as a surprise gift for my wife and she loved it! The packaging looked premium and it arrived a day early. Genuine product, trustworthy seller.`,
    `Good product overall and it does what it claims. ${effectCap}. Would be a 5 star if delivery was a little faster, but quality is top notch.`,
    `I was a bit sceptical at first, but this exceeded my expectations. ${effectCap}. Came well packed with no damage. 10/10, ordering more from this collection!`,
  ];

  return REVIEWERS.map((reviewer, index) => ({
    _id: `default-review-${index}`,
    user: { name: reviewer.name },
    rating: ratings[index],
    verifiedPurchase: true,
    review: texts[index],
    date: daysAgo(reviewer.days),
    helpful: reviewer.helpful,
  }));
}