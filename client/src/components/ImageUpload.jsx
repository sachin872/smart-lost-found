import React, { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUpload({ files, setFiles, previews, setPreviews, maxFiles = 4 }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const remainingSlots = maxFiles - files.length;
    const filesToAdd = selected.slice(0, remainingSlots);

    const newFiles = [...files, ...filesToAdd];
    setFiles(newFiles);

    // Generate previews
    const newPreviews = [...previews];
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Item Images <span className="text-xs font-normal text-slate-500">(Max {maxFiles} images, JPG/PNG/WebP up to 5MB each)</span>
      </label>

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 shadow-sm">
              <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {files.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer transition-colors duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-700">
              <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-slate-500">
              Clear photos help the AI engine and campus security verify ownership faster.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
