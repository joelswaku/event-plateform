export default function GalleryPublic({ section }) {
    const media = section.config?.media_ids || [];
  
    return (
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold">{section.title}</h2>
  
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {media.length === 0
            ? [1,2,3,4].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-lg" />
              ))
            : media.map((url, i) => (
                <img key={i} src={url} className="rounded-lg" />
              ))}
        </div>
      </section>
    );
  }