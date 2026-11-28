const samples = [
  { name: "Aditi Sharma", rating: 5, comment: "Great shopping experience! The website is easy to navigate, and finding products is very simple." },
  { name: "Rahul Verma", rating: 5, comment: "Loved the clean website design and smooth shopping experience. Looking forward to shopping again." },
  { name: "Priya Singh", rating: 4, comment: "A nice platform with a good variety of products. The overall experience was smooth." },
  { name: "Arjun Mehta", rating: 5, comment: "Very easy to browse different categories. The website feels modern and user-friendly." },
  { name: "Neha Kapoor", rating: 5, comment: "I really like the simple interface and organized product categories. Great shopping platform." },
  { name: "Karan Malhotra", rating: 4, comment: "Good website experience with an attractive layout and easy navigation." },
  { name: "Simran Kaur", rating: 5, comment: "The website is well organized, and browsing products is convenient. Really nice experience." },
  { name: "Rohan Gupta", rating: 5, comment: "A promising shopping platform with a clean design and smooth user experience." },
] as const;

export function SampleReviews() {
  return (
    <section aria-labelledby="sample-reviews">
      <h2 id="sample-reviews" className="font-display text-3xl text-forest-900">Sample reviews</h2>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">These samples preview the review cards. Customers did not submit them, and they are not testimonials or verified purchases.</p>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {samples.map((review) => (
          <li key={review.name} className="rounded-2xl border border-cream-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">Sample</p>
            <p className="mt-2 text-sm font-semibold tracking-wide text-forest-700" aria-label={`${review.rating} out of 5 stars`}>
              <span aria-hidden="true">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            </p>
            <p className="mt-2 text-sm leading-6">{review.comment}</p>
            <p className="mt-3 text-sm font-semibold text-forest-900">{review.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
