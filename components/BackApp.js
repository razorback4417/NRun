import * as React from 'react';
import { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default function BackApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>N R U N</Text>
      <Text style={styles.paragraph}>Putting your data to use.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 100,
    marginBottom: 20,
  },
  paragraph: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 15,
    paddingTop: 10,
    fontStyle: 'italic',
  },
  time: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 45,
    fontWeight: 'bold',
  },
});
