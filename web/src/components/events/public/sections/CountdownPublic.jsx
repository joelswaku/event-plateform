export default function CountdownPublic({ section, timeLeft }) {
    return (
      <section className="bg-gray-900 text-white py-16 text-center">
        <h2 className="text-3xl font-bold">{section.title}</h2>
        <p className="mt-4 text-xl">{timeLeft}</p>
      </section>
    );
  }