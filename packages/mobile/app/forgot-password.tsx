import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { authService } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    const { error: resetError } = await authService.resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Reset Password
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          {error ? (
            <HelperText type="error" visible={true} style={styles.message}>
              {error}
            </HelperText>
          ) : null}

          {success ? (
            <HelperText type="info" visible={true} style={styles.message}>
              Check your email for a password reset link
            </HelperText>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading || success}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || success}
            style={styles.button}
          >
            Send Reset Link
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Remember your password? </Text>
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
  message: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
