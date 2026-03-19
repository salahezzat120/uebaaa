import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/colors';

// ─── OpenRouter config ───────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Guardian Owl, an elite AI Security Operations Center (SOC) assistant embedded in a UEBA (User and Entity Behavior Analytics) platform.

You help SOC analysts investigate insider threats, data exfiltration, privilege escalation, and anomalous user behavior. Your tone is precise, analytical, and professional — like a senior threat intelligence analyst.

You have access to:
- Real-time alerts with risk scores (0-100)
- User behavioral baselines (30-day rolling)
- Geolocation and login activity
- Model performance metrics (Precision 97.3%, Recall 94.8%, F1 96.0%, Accuracy 98.2%)
- SOAR playbooks: Block User, Force Password Reset, Quarantine Endpoint

When analyzing threats, structure your response with:
- Key findings (use emoji bullets: 📍 🔍 ⚠️ 🧠 🌍)
- Statistical context vs baseline
- A clear **Recommendation** at the end

Keep responses concise but actionable (under 200 words). Use markdown-style bold for key terms.`;
// ─────────────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  typing?: boolean;
  isError?: boolean;
};

// Chat history shape expected by OpenRouter (no id/typing fields)
type ApiMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function callGroq(history: ApiMessage[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '⚠️ Empty response from model.';
}

const QUICK_PROMPTS = [
  'Analyze threat patterns',
  'Check user baseline',
  'Geolocation velocity',
  'Explain model decision',
  'Recommend SOAR action',
];

function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (val: typeof dot1, delay: number) => {
      setTimeout(() => {
        val.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
          ),
          -1,
          false
        );
      }, delay);
    };
    animate(dot1, 0);
    animate(dot2, 180);
    animate(dot3, 360);
  }, []);

  const dotStyle = (val: typeof dot1) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(val.value, [0, 1], [0.3, 1]),
      transform: [{ translateY: interpolate(val.value, [0, 1], [0, -5]) }],
    }));

  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 4 }}>
      <Animated.View style={[styles.dot, dotStyle(dot1)]} />
      <Animated.View style={[styles.dot, dotStyle(dot2)]} />
      <Animated.View style={[styles.dot, dotStyle(dot3)]} />
    </View>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.bubbleContainer, isUser && styles.bubbleRight, style]}>
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <MaterialCommunityIcons name="owl" size={14} color={COLORS.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.typing ? (
          <TypingDots />
        ) : (
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.text}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

type Props = { visible: boolean; onClose: () => void };

export function AIAssistant({ visible, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: '🦉 Guardian Owl Neural Engine online.\n\nPowered by Qwen AI via OpenRouter. I\'m analyzing live threat feeds across 847 monitored endpoints. Ask me anything about your investigation.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const slideY = useSharedValue(600);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 28, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      glowPulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
        -1,
        false
      );
    } else {
      slideY.value = withTiming(600, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const typingMsg: Message = { id: 'typing', role: 'assistant', text: '', typing: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Build history for the API (exclude typing indicators & errors)
    const history: ApiMessage[] = messages
      .filter((m) => !m.typing && !m.isError)
      .map((m) => ({ role: m.role, content: m.text }))
      .concat({ role: 'user', content: text });

    try {
      const reply = await callGroq(history);
      setMessages((prev) =>
        prev.filter((m) => m.id !== 'typing').concat({
          id: Date.now().toString() + 'r',
          role: 'assistant',
          text: reply,
        })
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== 'typing').concat({
          id: Date.now().toString() + 'err',
          role: 'assistant',
          text: `⚠️ Connection error: ${e?.message ?? 'Unknown error'}. Check your API key or network.`,
          isError: true,
        })
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, containerStyle]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.panel, panelStyle]}>
        {/* Glow */}
        <Animated.View style={[styles.headerGlow, glowStyle]} />

        {/* Header */}
        <LinearGradient
          colors={['rgba(0,212,255,0.12)', 'rgba(0,212,255,0.02)']}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="owl" size={20} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Neural SOC Assistant</Text>
              <View style={styles.statusRow}>
                <View style={[styles.activeDot, isLoading && { backgroundColor: COLORS.high }]} />
                <Text style={styles.statusText}>
                  {isLoading ? 'GROQ · THINKING...' : 'LLAMA 3.3 70B · GROQ'}
                </Text>
              </View>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsRow}>
          {QUICK_PROMPTS.map((p) => (
            <Pressable key={p} onPress={() => sendMessage(p)} style={styles.promptChip}>
              <Text style={styles.promptChipText}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, isLoading && { opacity: 0.6 }]}
              value={input}
              onChangeText={setInput}
              placeholder={isLoading ? 'Analyzing...' : 'Investigate threat...'}
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
              multiline={false}
              editable={!isLoading}
            />
            <Pressable
              onPress={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={[styles.sendBtn, (isLoading || !input.trim()) && { opacity: 0.4 }]}
            >
              <LinearGradient
                colors={isLoading ? ['#333', '#222'] : [COLORS.accent, '#0099CC']}
                style={styles.sendGradient}
              >
                <Ionicons name={isLoading ? 'ellipsis-horizontal' : 'arrow-up'} size={16} color={isLoading ? COLORS.textMuted : '#000'} />
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

      </Animated.View>
    </Animated.View>
  );
}

// Floating trigger button
export function AIAssistantButton({ onPress, criticalCount }: { onPress: () => void; criticalCount: number }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withSpring(1.08, { damping: 8 }), withSpring(1, { damping: 8 })),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.4, { duration: 1200 })),
      -1,
      false
    );
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View style={[styles.fabContainer, btnStyle]}>
      <Animated.View style={[styles.fabGlow, glowStyle]} />
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={styles.fab}
      >
        <LinearGradient
          colors={['rgba(0,212,255,0.25)', 'rgba(0,212,255,0.08)']}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="owl" size={22} color={COLORS.accent} />
          {criticalCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{criticalCount}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  panel: {
    backgroundColor: '#0D1520',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.safe,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
    maxHeight: 380,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.15)',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: 'rgba(0,212,255,0.18)',
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: COLORS.text,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  promptsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    backgroundColor: 'rgba(0,212,255,0.06)',
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.text,
  },
  sendBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    zIndex: 50,
  },
  fabGlow: {
    position: 'absolute',
    inset: -8,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    opacity: 0.15,
  },
  fab: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.critical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
});
