import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Classified Marketplace - Mobile</Text>
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
});
