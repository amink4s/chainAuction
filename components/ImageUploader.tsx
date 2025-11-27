import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelect: (file: File | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onImageSelect(file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        onImageSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {preview ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-700 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-slate-800/50 transition-all group"
                >
                    <div className="p-4 rounded-full bg-slate-800 group-hover:bg-purple-500/20 transition-colors mb-4">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-400" />
                    </div>
                    <p className="text-slate-400 font-medium group-hover:text-slate-200">Click to upload auction image</p>
                    <p className="text-slate-600 text-sm mt-2">Supports JPG, PNG, WEBP</p>
                </div>
            )}
        </div>
    );
};
