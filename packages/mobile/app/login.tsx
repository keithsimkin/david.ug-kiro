import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { authService } = useAuth();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const { session, error: signInError } = await authService.signIn({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (session) {
      router.replace('/');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
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
            Sign In
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to your account to continue
          </Text>

          {error ? (
            <HelperText type="error" visible={true} style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            disabled={loading}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="text"
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotButton}
          >
            Forgot password?
          </Button>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign In
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
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
              style={styles.socialButton}
            >
              Google
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleSocialLogin('apple')}
              disabled={loading}
              style={styles.socialButton}
            >
              Apple
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Don't have an account? </Text>
            <Button mode="text" onPress={() => router.push('/signup')} compact>
              Sign up
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
    justifyContent: 'center',
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
  forgotButton: {
    alignSelf: 'flex-end',
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
