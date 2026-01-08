import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type { User } from "../types/user";
import { styles } from "../styles/styles";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

export function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 4;
  }, [email, password]);

  function handleLogin() {
    if (!canSubmit) return;
    onLogin({ email: email.trim().toLowerCase() });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DeadlineVault</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <View style={styles.card}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <PrimaryButton title="Log in" onPress={handleLogin} disabled={!canSubmit} />

        <Pressable
          onPress={() => Alert.alert("Not wired yet", "Add sign-up later.")}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Create account</Text>
        </Pressable>
      </View>
    </View>
  );
}
