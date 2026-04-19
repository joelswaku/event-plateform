export default function DonationsPublic({ section }) {
    return (
      <section className="bg-black text-white py-16 text-center">
        <h2 className="text-3xl font-bold">{section.title}</h2>
        <p className="mt-4 text-gray-300">{section.body}</p>
      </section>
    );
  }