export default function CTAPublic({ section }) {
  return (
    <section className="bg-black text-white py-20 text-center">
      <h2 className="text-4xl font-bold">{section.title}</h2>
      <p className="mt-4 text-gray-300">{section.body}</p>
      <button className="mt-6 bg-white text-black px-6 py-3 rounded-lg">
        Get Started
      </button>
    </section>
  );
}
