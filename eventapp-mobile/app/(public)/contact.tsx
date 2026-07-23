import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const CONTACT_INFO = [
  {
    icon: 'mail',
    title: 'Email Support',
    description: 'Get help from our support team',
    value: 'support@liteevent.com',
  },
  {
    icon: 'clock',
    title: 'Response Time',
    description: 'We typically respond within',
    value: '24 hours',
    highlight: true,
  },
  {
    icon: 'book-open',
    title: 'Documentation',
    description: 'Browse our help center',
    value: 'Help Center',
  },
];

export default function ContactScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Message Sent!',
        "We'll get back to you within 24 hours.",
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ name: '', email: '', subject: '', message: '' });
              setErrors({});
            },
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Feather name="message-circle" size={14} color={Colors.accent.cyan} />
            <Text style={[styles.badgeText, { color: Colors.accent.cyan }]}>We're Here to Help</Text>
          </View>
          <Text style={styles.heroTitle}>Get in Touch</Text>
          <Text style={styles.heroDesc}>
            Have a question or need assistance? Our team is ready to help you create amazing events.
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={styles.infoCards}>
          {CONTACT_INFO.map((info, index) => (
            <View
              key={index}
              style={[
                styles.infoCard,
                info.highlight && {
                  backgroundColor: Colors.accent.indigo + '15',
                  borderColor: Colors.accent.indigo + '40',
                },
              ]}
            >
              <View
                style={[
                  styles.infoIcon,
                  info.highlight && { backgroundColor: Colors.accent.indigo },
                ]}
              >
                <Feather
                  name={info.icon as any}
                  size={20}
                  color={info.highlight ? '#fff' : Colors.text.muted}
                />
              </View>
              <Text style={styles.infoTitle}>{info.title}</Text>
              <Text style={styles.infoDescription}>{info.description}</Text>
              <Text
                style={[
                  styles.infoValue,
                  info.highlight && { color: Colors.accent.indigo },
                ]}
              >
                {info.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Send us a message</Text>
          <Text style={styles.formDesc}>
            Fill out the form below and we'll get back to you as soon as possible.
          </Text>

          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError,
              ]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Your full name"
              placeholderTextColor={Colors.text.subtle}
            />
            {errors.name && (
              <View style={styles.errorRow}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError,
              ]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="you@example.com"
              placeholderTextColor={Colors.text.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <View style={styles.errorRow}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Subject Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subject *</Text>
            <TextInput
              style={[
                styles.input,
                errors.subject && styles.inputError,
              ]}
              value={formData.subject}
              onChangeText={(text) => {
                setFormData({ ...formData, subject: text });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              placeholder="How can we help?"
              placeholderTextColor={Colors.text.subtle}
            />
            {errors.subject && (
              <View style={styles.errorRow}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{errors.subject}</Text>
              </View>
            )}
          </View>

          {/* Message Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                errors.message && styles.inputError,
              ]}
              value={formData.message}
              onChangeText={(text) => {
                setFormData({ ...formData, message: text });
                if (errors.message) setErrors({ ...errors, message: '' });
              }}
              placeholder="Tell us more about your inquiry..."
              placeholderTextColor={Colors.text.subtle}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {errors.message && (
              <View style={styles.errorRow}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{errors.message}</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitBtn,
              isSubmitting && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Send Message</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitle}>Ready to start planning?</Text>
          <Text style={styles.ctaDesc}>
            Create your first event for free and see how LiteEvent can transform your event
            management.
          </Text>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Get Started Free</Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.cyan + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '40',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  formContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  formDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bg.input,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.accent.red,
  },
  textarea: {
    height: 120,
    paddingTop: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.red,
  },
  errorText: {
    fontSize: 12,
    color: Colors.accent.red,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.indigo,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent.indigo,
  },
});
