import { useRef } from 'react';
import { useReviewImages, useUploadReviewImage, useDeleteReviewImage } from '@/hooks/useSupabaseData';
import { Upload, Trash2, Loader2, Image } from 'lucide-react';

const ReviewsPage = () => {
  const { data: reviewImages, isLoading } = useReviewImages();
  const uploadReviewImage = useUploadReviewImage();
  const deleteReviewImage = useDeleteReviewImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file, i) => {
      uploadReviewImage.mutate({ file, sort_order: (reviewImages?.length || 0) + i });
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h2 className="text-lg font-semibold">রিভিউ গ্যালারি</h2>
        <p className="text-[11px] text-muted-foreground">গ্রাহকদের রিভিউ স্ক্রিনশট আপলোড ও ম্যানেজ করুন</p>
      </div>

      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadReviewImage.isPending}
          className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors cursor-pointer"
        >
          {uploadReviewImage.isPending ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <div className="text-center">
            <span className="text-sm font-semibold block">
              {uploadReviewImage.isPending ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
            </span>
            <span className="text-xs text-muted-foreground">একাধিক ছবি একসাথে সিলেক্ট করা যাবে</span>
          </div>
        </button>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {reviewImages && reviewImages.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">মোট {reviewImages.length}টি ছবি</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {reviewImages.map((img) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[9/16] bg-muted">
                  <img src={img.image_url} alt="রিভিউ" className="w-full h-full object-cover" />
                  <button
                    onClick={() => deleteReviewImage.mutate(img.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (!reviewImages || reviewImages.length === 0) && (
          <div className="text-center py-10 text-muted-foreground">
            <Image className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">কোনো রিভিউ ছবি নেই</p>
            <p className="text-xs mt-1">উপরে ক্লিক করে আপলোড শুরু করুন</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
