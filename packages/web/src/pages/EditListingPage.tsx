import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupabase, ListingService, UpdateListingInput } from '@classified/shared';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function EditListingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('used');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    if (!id) return;

    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);
      const { listing, error } = await listingService.getListingById(id);

      if (error || !listing) {
        alert('Failed to load listing');
        navigate('/my-listings');
        return;
      }

      // Populate form
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(listing.price.toString());
      setCategoryId(listing.categoryId);
      setLocation(listing.location);
      setCondition(listing.condition);
      setContactPhone(listing.contactPhone || '');
      setContactEmail(listing.contactEmail || '');
      setExistingImages(listing.images);
    } catch (error) {
      alert('An unexpected error occurred');
      navigate('/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newFiles.length + files.length;

    if (totalImages > 10) {
      setErrors({ ...errors, images: 'Maximum 10 images allowed' });
      return;
    }

    setNewFiles([...newFiles, ...files]);

    // Create preview URLs
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setNewPreviewUrls([...newPreviewUrls, ...newUrls]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newPreviewUrls[index]);
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviewUrls(newPreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);

      // Upload new images if any
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const { urls, error: uploadError } = await listingService.uploadImages(newFiles);

        if (uploadError) {
          setErrors({ submit: 'Failed to upload images: ' + uploadError.message });
          setSaving(false);
          return;
        }

        uploadedUrls = urls;
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls];

      // Update listing
      const updateData: UpdateListingInput = {
        title,
        description,
        price: parseFloat(price),
        categoryId,
        location,
        condition,
        images: allImages,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
      };

      const { error } = await listingService.updateListing(id, updateData);

      if (error) {
        setErrors({ submit: 'Failed to update listing: ' + error.message });
        setSaving(false);
        return;
      }

      alert('Listing updated successfully!');
      navigate('/my-listings');
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., iPhone 13 Pro Max"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail..."
                maxLength={5000}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="price">Price (UGX) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kampala, Uganda"
              />
            </div>

            <div>
              <Label>Condition *</Label>
              <div className="flex gap-3 mt-2">
                {(['new', 'used', 'refurbished'] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`flex-1 py-2 px-4 border rounded-md transition-colors ${
                      condition === cond
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="images">Images * (Max 10)</Label>
              <div className="mt-2">
                <label
                  htmlFor="images"
                  className="block w-full p-6 border-2 border-dashed border-blue-500 rounded-lg text-center cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <span className="text-blue-500 font-medium">+ Add More Images</span>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {(existingImages.length > 0 || newPreviewUrls.length > 0) && (
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img src={url} alt={`Existing ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {newPreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img src={url} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+256 XXX XXX XXX"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/my-listings')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
