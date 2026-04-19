export default function VenuePublic({ section }) {
    return (
      <section className="bg-gray-100 py-16 text-center">
        <h2 className="text-3xl font-bold">{section.title}</h2>
        <p className="mt-4 text-gray-600">{section.body}</p>
      </section>
    );
  }