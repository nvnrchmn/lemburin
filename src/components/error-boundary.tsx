import { Component, ReactNode } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so the app shows a readable message instead of a
 * blank white screen. Without this, any throw during the first render leaves
 * #root empty and the user just sees white.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error);
  }

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#0f172a',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
          Terjadi Kesalahan
        </Text>
        <Text
          style={{
            color: '#94a3b8',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 24,
            maxWidth: 320,
          }}
        >
          Aplikasi mengalami masalah saat memuat. Silakan coba muat ulang.
        </Text>
        <Text
          style={{
            color: '#64748b',
            fontSize: 11,
            textAlign: 'center',
            marginBottom: 24,
            maxWidth: 320,
          }}
        >
          {String(error.message).substring(0, 300)}
        </Text>
        <Pressable
          onPress={this.handleReload}
          style={{
            backgroundColor: '#1B5DF5',
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Muat Ulang</Text>
        </Pressable>
      </View>
    );
  }
}
