import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Icon } from '@ui-kitten/components';
import { createIcon } from './UIKittenIcons';

// Creating icon components using our custom provider
const HomeIcon = (props) => createIcon('material', 'home').toReactElement(props);
const SettingsIcon = (props) => createIcon('ionicons', 'settings-outline').toReactElement(props);
const HeartIcon = (props) => createIcon('material-community', 'heart').toReactElement(props);

export const IconExample = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Examples</Text>
      
      <View style={styles.row}>
        <Button
          style={styles.button}
          accessoryLeft={HomeIcon}
          status="primary">
          HOME
        </Button>
        
        <Button
          style={styles.button}
          accessoryLeft={SettingsIcon}
          status="success">
          SETTINGS
        </Button>
        
        <Button
          style={styles.button}
          accessoryLeft={HeartIcon}
          status="danger">
          LIKE
        </Button>
      </View>
      
      <View style={styles.iconRow}>
        <Icon
          style={styles.icon}
          fill="#8F9BB3"
          pack="material"
          name="star"
        />
        <Icon
          style={styles.icon}
          fill="#8F9BB3" 
          pack="ionicons"
          name="notifications-outline"
        />
        <Icon
          style={styles.icon}
          fill="#8F9BB3"
          pack="material-community"
          name="account"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    margin: 8,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  icon: {
    width: 32,
    height: 32,
  }
}); 