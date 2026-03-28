import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { LogIn, Mail, Lock, Chrome } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/store/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLocalLoading(true);
      await signInWithEmail(email.trim(), password);
      console.log('[Login] Login successful, navigating to home');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('[Login] Error:', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'An error occurred during login'
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalLoading(true);
      await signInWithGoogle();
      
      if (Platform.OS === 'web') {
        console.log('[Login] Google login initiated on web');
      } else {
        console.log('[Login] Google login successful, navigating to home');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('[Login] Google login error:', error);
      Alert.alert(
        'Google Login Failed',
        error instanceof Error ? error.message : 'An error occurred during Google login'
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const isFormLoading = isLoading || localLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LogIn size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Welcome Back! 🐝</Text>
          <Text style={styles.subtitle}>
            Sign in to continue managing your apiaries
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!isFormLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isFormLoading}
              />
            </View>
          </View>

          <Link href="/forgot-password" asChild>
            <TouchableOpacity disabled={isFormLoading}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={[styles.loginButton, isFormLoading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isFormLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isFormLoading}
          >
            <Chrome size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity disabled={isFormLoading}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  forgotPassword: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '600' as const,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginLeft: 12,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
});
