import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
    phone: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { authService } = useAuth();

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSignUp = async () => {
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { user, error: signUpError } = await authService.signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      username: formData.username,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (user) {
      router.replace('/login');
    }
    setLoading(false);
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);

    const { error: providerError } = await authService.signInWithProvider(provider);

    if (providerError) {
      setError(providerError.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign up to start posting listings
          </Text>

          {error ? (
            <HelperText type="error" visible={true} style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <TextInput
            label="Full Name *"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Username *"
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

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

          <TextInput
            label="Password *"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            secureTextEntry
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            secureTextEntry
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>
              Or continue with
            </Text>
            <Divider style={styles.divider} />
          </View>

          <View style={styles.socialButtons}>
            <Button
              mode="outlined"
              onPress={() => handleSocialSignUp('google')}
              disabled={loading}
              style={styles.socialButton}
            >
              Google
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleSocialSignUp('apple')}
              disabled={loading}
              style={styles.socialButton}
            >
              Apple
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <Button mode="text" onPress={() => router.push('/login')} compact>
              Sign in
            </Button>
          </View>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  error: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#666',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
