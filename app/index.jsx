import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import LoadingCom from "../components/Common/LoadingCom";

const IndexLayout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Adding a small timeout to allow the Root Layout to mount before redirecting
    const timeout = setTimeout(() => {
      router.replace("/signIn");
    }, 500); // Adjust the delay as necessary

    // Cleanup the timeout on unmount
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{ uri: "https://res.cloudinary.com/qualifier/image/upload/v1730461004/Applied%20App%20Default/applied_blue_logo_b4q0ll.png" }}
        style={styles.logo}
      />
      <View style={styles.buttonContainer}>
        <Link href="/signIn" style={styles.button}>
    
    <Text   style={styles.buttonText}>Sign In</Text>
        </Link>  
      </View>
      <LoadingCom visible={isLoading} setIsVisible={setIsLoading} />
    </SafeAreaView>
  );
};

export default IndexLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 50,
  },
  buttonContainer: {
    width: "80%",
  },
  button: {
    backgroundColor: "#00506C",
    color: "#fff",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    textAlign: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight:"bold"
  },
});
