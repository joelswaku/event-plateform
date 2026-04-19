export default function FAQPublic({ section }) {
    const items = section.config?.items || [];
  
    return (
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center">{section.title}</h2>
  
        <div className="mt-8 max-w-3xl mx-auto space-y-4">
          {items.map((item, i) => (
            <div key={i} className="border p-4 rounded-lg">
              <h4 className="font-semibold">{item.question}</h4>
              <p className="text-gray-600 mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }