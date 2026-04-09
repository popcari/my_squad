'use client';

import { usersService } from '@/services';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AvatarPickerModalProps {
  userId: string;
  onSelect: (avatarUrl: string) => void;
  onClose: () => void;
}

export function AvatarPickerModal({
  userId,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  const [images, setImages] = useState<
    { url: string; publicId: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = () => {
    return usersService.listAvatars().then((data) => {
      setImages(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      setUploadProgress(0);
      try {
        const result = await usersService.uploadAvatar(
          userId,
          file,
          (p) => setUploadProgress(p),
        );
        onSelect(result.avatar);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [userId, onSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSelectExisting = async (url: string) => {
    await usersService.update(userId, { avatar: url });
    onSelect(url);
  };

  const handleDeleteImage = async (
    e: React.MouseEvent,
    publicId: string,
  ) => {
    e.stopPropagation();
    setDeletingId(publicId);
    try {
      await usersService.deleteAvatar(publicId);
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Choose Avatar</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Upload zone */}
        <div className="p-4 border-b border-border">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              uploading
                ? 'cursor-default border-primary/50'
                : 'cursor-pointer hover:border-primary/50'
            } ${dragOver ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            {uploading ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">Uploading... {uploadProgress}%</p>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">Drag & drop an image here</p>
                <p className="text-xs text-muted mt-1">
                  or click to select from your computer
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Gallery */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">
            Previously uploaded
          </p>
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : images.length === 0 ? (
            <p className="text-sm text-muted">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.publicId} className="relative group aspect-square">
                  <button
                    onClick={() => handleSelectExisting(img.url)}
                    className="w-full h-full rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteImage(e, img.publicId)}
                    disabled={deletingId === img.publicId}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger transition-all"
                    title="Delete image"
                  >
                    {deletingId === img.publicId ? (
                      <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                    ) : (
                      '×'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
