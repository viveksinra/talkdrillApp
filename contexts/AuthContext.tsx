import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';

// Define the User type
type User = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
} | null;

// Define the AuthContext type
type AuthContextType = {
  user: User;
  login: (userData: Omit<NonNullable<User>, 'id'>) => void;
  logout: () => void;
  isLoading: boolean;
};

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider props
type AuthProviderProps = {
  children: ReactNode;
};

// Function to check if the route is protected
function useProtectedRoute(user: User) {
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    
    const isPublicRoute = segments[0] === 'login' || 
    segments[0] === 'otp-verification' ||
    segments[0] === 'login-via-mobile' || 
    segments[0] === 'welcome-carousel';
    
    if (!user && !isPublicRoute) {
      // Redirect to the login page if the user is not authenticated
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // Redirect to the home page if the user is authenticated and on a public page
      router.replace('/(tabs)');
    }
  }, [user, segments, navigationState?.key]);
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on app load
  useEffect(() => {
    // Mock checking for stored credentials
    // In a real app, this would check AsyncStorage or SecureStore
    const checkAuth = async () => {
      try {
        // Simulating async auth check
        setTimeout(() => {
          setIsLoading(false);
          // No stored user found
        }, 1000);
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = (userData: Omit<NonNullable<User>, 'id'>) => {
    // Mock login - in a real app, this would call your API
    const newUser = {
      id: 'user-' + Date.now(),
      ...userData,
    };
    setUser(newUser);
    // In a real app, store user data in AsyncStorage or SecureStore
  };

  // Logout function
  const logout = () => {
    setUser(null);
    // In a real app, clear user data from AsyncStorage or SecureStore
    router.replace('/login');
  };

  // Use the protected route hook
  useProtectedRoute(user);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 