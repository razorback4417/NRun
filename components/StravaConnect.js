import * as React from 'react';
import { useCallback } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default function StravaConnect() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../assets/connectWhite.png')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    //justifyContent: 'center',
    padding: 24,
  },
  logo: {
    marginTop: 10,
    height: 48,
    width: 193,
  },
});
