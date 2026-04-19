export default function AboutPublic({ section }) {
    return (
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold">{section.title}</h2>
        <p className="mt-4 text-gray-600">{section.body}</p>
      </section>
    );
  }