import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '@classified-marketplace/shared';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { user, authService, refreshUser } = useAuth();
  const profileService = new ProfileService(supabase);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    location: '',
  });
  const [avatarUri, setAvatarUri] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<{ uri: string; type: string; name: string } | null>(null);
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
      setAvatarUri(user.avatarUrl || '');
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      
      // Prepare file for upload
      const fileName = asset.uri.split('/').pop() || 'avatar.jpg';
      setAvatarFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: fileName,
      });
    }
  };

  const handleSubmit = async () => {
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
        // Fetch the image as a blob
        const response = await fetch(avatarFile.uri);
        const blob = await response.blob();

        // Validate avatar file
        const avatarValidation = profileService.validateAvatarFile(blob, avatarFile.name);
        if (!avatarValidation.isValid) {
          setError(avatarValidation.errors.map(e => e.message).join(', '));
          setLoading(false);
          return;
        }

        const { url, error: uploadError } = await profileService.uploadAvatar(
          user.id,
          blob,
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

      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Edit Profile
          </Text>

          {error ? (
            <HelperText type="error" visible={true} style={styles.message}>
              {error}
            </HelperText>
          ) : null}

          {success ? (
            <HelperText type="info" visible={true} style={styles.message}>
              {success}
            </HelperText>
          ) : null}

          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text variant="headlineLarge" style={styles.avatarText}>
                  {user.fullName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text variant="bodySmall" style={styles.avatarLabel}>
              Tap to change photo
            </Text>
          </TouchableOpacity>

          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Username"
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email"
            value={user.email}
            disabled
            style={styles.input}
            mode="outlined"
          />
          <HelperText type="info" visible={true}>
            Email cannot be changed
          </HelperText>

          <TextInput
            label="Phone"
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            keyboardType="phone-pad"
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Location"
            value={formData.location}
            onChangeText={(value) => handleChange('location', value)}
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={handleSignOut}
            disabled={loading}
            style={styles.button}
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#666',
  },
  avatarLabel: {
    marginTop: 8,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
});
