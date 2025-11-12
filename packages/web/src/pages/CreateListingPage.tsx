import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, ListingService, CreateListingInput } from '@classified/shared';
import { useCategories } from '../hooks/useCategories';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('used');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = selectedFiles.length + files.length;

    if (totalImages > 10) {
      setErrors({ ...errors, images: 'Maximum 10 images allowed' });
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!title.trim()) newErrors.title = 'Title is required';
      else if (title.length < 5) newErrors.title = 'Title must be at least 5 characters';

      if (!description.trim()) newErrors.description = 'Description is required';
      else if (description.length < 20) newErrors.description = 'Description must be at least 20 characters';

      if (!categoryId) newErrors.categoryId = 'Category is required';
    }

    if (currentStep === 2) {
      if (!price || parseFloat(price) <= 0) newErrors.price = 'Valid price is required';
      if (!location.trim()) newErrors.location = 'Location is required';
      if (selectedFiles.length === 0) newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);

      // Upload images
      const { urls, error: uploadError } = await listingService.uploadImages(selectedFiles);

      if (uploadError) {
        setErrors({ submit: 'Failed to upload images: ' + uploadError.message });
        setLoading(false);
        return;
      }

      // Create listing
      const listingData: CreateListingInput = {
        title,
        description,
        price: parseFloat(price),
        categoryId,
        location,
        condition,
        images: urls,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
      };

      const { error } = await listingService.createListing(listingData);

      if (error) {
        setErrors({ submit: 'Failed to create listing: ' + error.message });
        setLoading(false);
        return;
      }

      alert('Listing created successfully!');
      navigate('/');
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., iPhone 13 Pro Max"
          maxLength={100}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
          className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <Label>Category *</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`p-4 border rounded-lg text-center transition-colors ${
                categoryId === cat.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">{cat.icon || '📦'}</div>
              <div className="text-sm">{cat.name}</div>
            </button>
          ))}
        </div>
        {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
      </div>

      <Button type="button" onClick={handleNext} className="w-full">
        Next
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="price">Price (UGX) *</Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          className={errors.price ? 'border-red-500' : ''}
        />
        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
      </div>

      <div>
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Kampala, Uganda"
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
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
            <span className="text-blue-500 font-medium">+ Add Images</span>
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
        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-5 gap-3 mt-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Back
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
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
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
          {loading ? 'Creating...' : 'Create Listing'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Listing</CardTitle>
          <p className="text-sm text-gray-500">Step {step} of 3</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
