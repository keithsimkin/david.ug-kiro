import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@classified-marketplace/shared';
import { supabase } from '@/lib/supabase';

export const ProfilePage: React.FC = () => {
  const { user, authService, refreshUser } = useAuth();
  const profileService = new ProfileService(supabase);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    location: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        phone: user.phone || '',
        location: user.location || '',
      });
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!user) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      // Validate profile data
      const profileData = {
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
      };

      const validation = profileService.validateProfileData(profileData, user.id);
      if (!validation.isValid) {
        setError(validation.errors.map(e => e.message).join(', '));
        setLoading(false);
        return;
      }

      // Check username availability if changed
      if (formData.username !== user.username) {
        const isAvailable = await profileService.isUsernameAvailable(formData.username, user.id);
        if (!isAvailable) {
          setError('Username is already taken');
          setLoading(false);
          return;
        }
      }

      let avatarUrl = user.avatarUrl;

      // Upload avatar if changed
      if (avatarFile) {
        // Validate avatar file
        const avatarValidation = profileService.validateAvatarFile(avatarFile, avatarFile.name);
        if (!avatarValidation.isValid) {
          setError(avatarValidation.errors.map(e => e.message).join(', '));
          setLoading(false);
          return;
        }

        const { url, error: uploadError } = await profileService.uploadAvatar(
          user.id,
          avatarFile,
          avatarFile.name
        );

        if (uploadError) {
          setError('Failed to upload avatar: ' + uploadError.message);
          setLoading(false);
          return;
        }

        avatarUrl = url || undefined;
      }

      // Update profile
      const { error: updateError } = await profileService.updateProfile(user.id, {
        ...profileData,
        avatarUrl,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      
      // Refresh user data
      await refreshUser();
      
      setLoading(false);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
