import React from 'react';

export interface ImageUploadProps {
  label?: string;
  onSelectImage: (file: File) => void;
  previewUrl?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, onSelectImage, previewUrl }) => {
  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <div className="flex items-center space-x-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Upload preview"
            className="h-16 w-16 object-cover rounded-lg border"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
        <label className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600">
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onSelectImage(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};
