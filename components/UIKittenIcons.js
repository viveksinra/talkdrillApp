import React from 'react';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Create a proper UI Kitten icon provider
export const IconProvider = {
  toReactElement: (props) => {
    const { name, pack, style } = props;
    
    // Default to MaterialIcons if no pack specified
    let IconComponent = MaterialIcons;
    let iconName = name;
    
    // Select the correct icon pack
    if (pack === 'material-community') {
      IconComponent = MaterialCommunityIcons;
    } else if (pack === 'ionicons') {
      IconComponent = Ionicons;
    }
    
    return (
      <IconComponent
        name={iconName}
        size={style?.width || style?.height || 24}
        color={style?.tintColor || '#000'}
      />
    );
  },
  
  getComponentForProvider: (provider, name) => {
    return {
      toReactElement: (props) => {
        let Component;
        
        switch (provider) {
          case 'material':
            Component = MaterialIcons;
            break;
          case 'material-community':
            Component = MaterialCommunityIcons;
            break;
          case 'ionicons':
            Component = Ionicons;
            break;
          default:
            Component = MaterialIcons;
        }
        
        return (
          <Component
            name={name}
            size={props.style?.width || props.style?.height || 24}
            color={props.style?.tintColor || '#000'}
          />
        );
      }
    };
  }
};

// Helper function to create UI Kitten compatible icon components
export const createIcon = (provider, name) => {
  return IconProvider.getComponentForProvider(provider, name);
};

// Example usage in your components:
// const StarIcon = (props) => createIcon('material', 'star').toReactElement(props); 