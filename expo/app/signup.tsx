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
import { UserPlus, Mail, Lock, User, Chrome } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/store/auth-store';

export default function SignupScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, isLoading } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLocalLoading(true);
      const result = await signUpWithEmail(email.trim(), password, fullName.trim());
      
      console.log('[Signup] Signup successful', result);
      
      if (result?.user?.identities?.length === 0) {
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Please sign in instead.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/login'),
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Success!',
        'Your account has been created. Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error) {
      console.error('[Signup] Error:', error);
      Alert.alert(
        'Signup Failed',
        error instanceof Error ? error.message : 'An error occurred during signup'
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLocalLoading(true);
      await signInWithGoogle();
      
      if (Platform.OS === 'web') {
        console.log('[Signup] Google signup initiated on web');
      } else {
        console.log('[Signup] Google signup successful, navigating to onboarding');
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('[Signup] Google signup error:', error);
      Alert.alert(
        'Google Signup Failed',
        error instanceof Error ? error.message : 'An error occurred during Google signup'
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
            <UserPlus size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Create Account 🐝</Text>
          <Text style={styles.subtitle}>
            Join BeeMind and start managing your apiaries
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isFormLoading}
              />
            </View>
          </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isFormLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isFormLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, isFormLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isFormLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={isFormLoading}
          >
            <Chrome size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity disabled={isFormLoading}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  signupButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  signupButtonText: {
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
});
