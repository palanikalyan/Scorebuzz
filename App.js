import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Animated,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MatchCard, Header, FilterTabs } from './components';
import { hasMatchStarted, isMatchCompleted, getStatusColor, getMatchStatusText, shareMatch } from './utils';

export default function CricketScoreApp() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const headerHeight = useState(new Animated.Value(60))[0];
  <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />
  useEffect(() => {
    fetchMatches();
    loadFavorites();
    
    // Fade in animation on initial load
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Update scores every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favoriteCricketMatches');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favoriteCricketMatches', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = (matchId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let newFavorites;
    if (favorites.includes(matchId)) {
      newFavorites = favorites.filter(id => id !== matchId);
    } else {
      newFavorites = [...favorites, matchId];
    }
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches().then(() => setRefreshing(false));
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // Replace with your cricket API endpoint and API key
      const response = await axios.get('https://api.cricapi.com/v1/currentMatches', {
        params: {
          apikey: '1f3486be-8bb4-41ed-8dcb-70906448dccd', // Replace with your actual API key
          offset: 0
        }
      });
      
      if (response.data && response.data.data) {
        // Sort matches: put international matches first, then by start time
        const sortedMatches = response.data.data.sort((a, b) => {
          // Put international matches first
          const aIsInternational = a.name?.includes('International') || false;
          const bIsInternational = b.name?.includes('International') || false;
          
          if (aIsInternational && !bIsInternational) return -1;
          if (!aIsInternational && bIsInternational) return 1;
          
          // Then sort by match status (live matches first)
          const aIsLive = hasMatchStarted(a) && !isMatchCompleted(a);
          const bIsLive = hasMatchStarted(b) && !isMatchCompleted(b);
          
          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;
          
          // Sort by start time
          return new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT);
        });
        
        setMatches(sortedMatches);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Invalid data received from API');
      }
    } catch (err) {
      setError('Failed to fetch match data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareMatch = (match) => {
    shareMatch(match);
  };

  const renderErrorContent = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          fetchMatches();
        }}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyContent = () => (
    <View style={styles.noMatchesContainer}>
      {activeTab === 'favorites' ? (
        <>
          <Ionicons name="star-outline" size={64} color="#aaa" />
          <Text style={styles.noMatchesText}>No favorite matches yet</Text>
          <Text style={styles.noMatchesSubtext}>
            Tap the star icon on a match to add it to your favorites
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="calendar-outline" size={64} color="#aaa" />
          <Text style={styles.noMatchesText}>No live matches found</Text>
          <Text style={styles.noMatchesSubtext}>
            Check back later for upcoming matches
          </Text>
        </>
      )}
    </View>
  );

  const filteredMatches = activeTab === 'favorites'
    ? matches.filter(match => favorites.includes(match.id))
    : matches;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <Header 
        headerHeight={headerHeight}
        lastUpdated={lastUpdated}
        onRefresh={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          fetchMatches();
        }}
      />
      
      <FilterTabs 
        activeTab={activeTab}
        setActiveTab={(tab) => {
          Haptics.selectionAsync();
          setActiveTab(tab);
        }}
      />
      
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      )}
      
      {error && renderErrorContent()}
      
      {!loading && !error && filteredMatches.length === 0 && renderEmptyContent()}
      
      <ScrollView 
        style={styles.matchesList}
        contentContainerStyle={styles.matchesListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a73e8']}
            tintColor="#1a73e8"
          />
        }
      >
        {filteredMatches.map(match => (
          <MatchCard 
            key={match.id}
            match={match}
            expanded={expandedMatch === match.id}
            isFavorite={favorites.includes(match.id)}
            fadeAnim={fadeAnim}
            onToggleExpand={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
            onToggleFavorite={() => toggleFavorite(match.id)}
            onShare={() => handleShareMatch(match)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#aaa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noMatchesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noMatchesText: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 16,
  },
  noMatchesSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  matchesList: {
    flex: 1,
  },
  matchesListContent: {
    paddingVertical: 8,
  },
});