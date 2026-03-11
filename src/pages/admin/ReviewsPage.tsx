import { useRef, useState } from 'react';
import { useReviewImages, useUploadReviewImage, useDeleteReviewImage, useProductsLite } from '@/hooks/useSupabaseData';
import { Upload, Trash2, Loader2, Image, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ReviewsPage = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [uploadProductId, setUploadProductId] = useState<string>('');
  const { data: products } = useProductsLite();
  const { data: reviewImages, isLoading } = useReviewImages(selectedProductId === 'all' ? null : selectedProductId);
  const uploadReviewImage = useUploadReviewImage();
  const deleteReviewImage = useDeleteReviewImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (!uploadProductId) {
      alert('অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট সিলেক্ট করুন');
      e.target.value = '';
      return;
    }
    Array.from(files).forEach((file, i) => {
      uploadReviewImage.mutate({
        file,
        sort_order: (reviewImages?.length || 0) + i,
        product_id: uploadProductId,
      });
    });
    e.target.value = '';
  };

  const productName = (productId: string | null) => {
    if (!productId) return 'সব প্রোডাক্ট';
    return products?.find(p => p.id === productId)?.name || 'অজানা';
  };

  return (
    <div className="space-y-5 w-full">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <h2 className="text-lg font-bold text-foreground">রিভিউ গ্যালারি</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">প্রোডাক্ট ভিত্তিক রিভিউ স্ক্রিনশট আপলোড ও ম্যানেজ করুন</p>
      </div>

      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-5">
        {/* Upload Section with Product Selector */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">আপলোডের জন্য প্রোডাক্ট সিলেক্ট করুন</label>
              <Select value={uploadProductId} onValueChange={setUploadProductId}>
                <SelectTrigger className="rounded-sm border-border/40 h-10">
                  <SelectValue placeholder="প্রোডাক্ট বাছাই করুন..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => {
              if (!uploadProductId) {
                alert('অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট সিলেক্ট করুন');
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={uploadReviewImage.isPending}
            className="w-full border-2 border-dashed border-border/40 rounded-sm py-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-gold/50 hover:text-gold transition-colors cursor-pointer"
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
              <span className="text-xs text-muted-foreground">
                {uploadProductId
                  ? `"${productName(uploadProductId)}" এর জন্য আপলোড হবে`
                  : 'প্রথমে উপরে থেকে প্রোডাক্ট সিলেক্ট করুন'}
              </span>
            </div>
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/20">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <label className="text-xs font-medium text-muted-foreground">ফিল্টার:</label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-[220px] rounded-sm border-border/40 h-9 text-xs">
              <SelectValue placeholder="সব প্রোডাক্ট" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব প্রোডাক্ট</SelectItem>
              {products?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {reviewImages && reviewImages.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              মোট {reviewImages.length}টি ছবি
              {selectedProductId !== 'all' && ` — ${productName(selectedProductId)}`}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {reviewImages.map((img) => (
                <div key={img.id} className="relative group rounded-sm overflow-hidden aspect-[9/16] bg-muted border border-border/30">
                  <img src={img.image_url} alt="রিভিউ" className="w-full h-full object-cover" />
                  {/* Product badge */}
                  {img.product_id && selectedProductId === 'all' && (
                    <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-sm bg-ink/70 backdrop-blur-sm">
                      <p className="text-[9px] text-white truncate">{productName(img.product_id)}</p>
                    </div>
                  )}
                  <button
                    onClick={() => deleteReviewImage.mutate(img.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-sm bg-destructive/90 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
            <p className="text-xs mt-1">উপরে প্রোডাক্ট সিলেক্ট করে আপলোড শুরু করুন</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
