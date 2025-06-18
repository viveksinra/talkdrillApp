import { Colors } from "@/constants/Colors";
import { StyleSheet, Text } from "react-native";
import { useEffect, useState } from "react";

// Add LoadingDots component
export const LoadingDots = () => {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev.length >= 3) return "";
                return prev + ".";
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return <Text style={styles.loadingDots}>{dots}</Text>;
};

const styles = StyleSheet.create({
    loadingDots: {
        fontSize: 16,
        color: Colors.light.primary,
        width: 30,
        marginLeft: 4,
    },
})