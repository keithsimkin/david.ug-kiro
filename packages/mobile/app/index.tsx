import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { session, user, loading, authService } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const handleSignOut = async () => {
    await authService.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Classified Marketplace</Text>
      <Text variant="bodyLarge" style={styles.welcomeText}>
        Welcome, {user?.fullName || 'User'}!
      </Text>
      <Button mode="contained" onPress={() => router.push('/profile')} style={styles.button}>
        Edit Profile
      </Button>
      <Button mode="outlined" onPress={handleSignOut} style={styles.button}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  welcomeText: {
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
});
