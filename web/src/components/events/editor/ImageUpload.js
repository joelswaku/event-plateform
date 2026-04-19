export default function ImageUpload({ value, onChange }) {
    const preview = value;
  
    const handleUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      const url = URL.createObjectURL(file);
      onChange(url);
    };
  
    return (
      <div className="space-y-2">
        {preview && (
          <img
            src={preview}
            alt="event cover"
            className="w-full h-40 object-cover rounded"
          />
        )}
  
        <input type="file" accept="image/*" onChange={handleUpload} />
      </div>
    );
  }