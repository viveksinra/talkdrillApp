import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
const AuthLayout = () => {
  return (
<>
<Stack>
    <Stack.Screen 
    name="signIn"
    options={{ headerShown: false }}
    />
 
</Stack>
<StatusBar 
  backgroundColor="#00506C" 
  barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
/>

    </>
 
  )
    
}

export default AuthLayout
