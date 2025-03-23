import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { getTeamFlag, getStatusColor, getMatchStatusText, hasMatchStarted, isMatchCompleted } from './utils';

export const Header = ({ headerHeight, lastUpdated, onRefresh }) => (
  <Animated.View style={[styles.header, { height: headerHeight }]}>
    <LinearGradient
      colors={['#1a73e8', '#0d47a1']}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="cricket" size={24} color="white" />
          <Text style={styles.headerTitle}>Scorebuzz</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {lastUpdated && (
        <Text style={styles.lastUpdatedText}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
    </LinearGradient>
  </Animated.View>
);

export const FilterTabs = ({ activeTab, setActiveTab }) => (
  <View style={styles.filtersContainer}>
    <TouchableOpacity
      style={[styles.filterTab, activeTab === 'all' && styles.activeFilterTab]}
      onPress={() => setActiveTab('all')}
    >
      <Text style={[styles.filterText, activeTab === 'all' && styles.activeFilterText]}>
        All Matches
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.filterTab, activeTab === 'favorites' && styles.activeFilterTab]}
      onPress={() => setActiveTab('favorites')}
    >
      <Text style={[styles.filterText, activeTab === 'favorites' && styles.activeFilterText]}>
        <Ionicons name="star" size={16} color={activeTab === 'favorites' ? "#1a73e8" : "#aaa"} /> Favorites
      </Text>
    </TouchableOpacity>
  </View>
);

export const MatchCard = ({ 
  match, 
  expanded, 
  isFavorite, 
  fadeAnim, 
  onToggleExpand, 
  onToggleFavorite, 
  onShare 
}) => {
  const started = hasMatchStarted(match);
  const completed = isMatchCompleted(match);
  const statusColor = getStatusColor(match);
  
  const team1 = match.teamInfo?.[0]?.shortname || match.teams?.[0] || 'Team 1';
  const team2 = match.teamInfo?.[1]?.shortname || match.teams?.[1] || 'Team 2';
  
  return (
    <Animated.View 
      style={[
        styles.matchCard,
        { opacity: fadeAnim }
      ]}
    >
      <LinearGradient
        colors={['#2c3e50', '#1e2a3a']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tournamentName}>{match.name || match.series_name}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onShare}
            >
              <Ionicons name="share-outline" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onToggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "star" : "star-outline"} 
                size={20} 
                color={isFavorite ? "#f1c40f" : "#ccc"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Match Content */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={onToggleExpand}
        >
          <View style={styles.teamsContainer}>
            {/* Team 1 */}
            <View style={styles.teamSection}>
              <Text style={styles.flagEmoji}>{getTeamFlag(match.teamInfo?.[0]?.name)}</Text>
              <Text style={styles.teamName}>{team1}</Text>
              {started ? (
                <View style={styles.scoreContainer}>
                  <Text style={styles.score}>
                    {match.score?.[0]?.r || 0}
                    <Text style={styles.wickets}>/{match.score?.[0]?.w || 0}</Text>
                  </Text>
                  <Text style={styles.overs}>({match.score?.[0]?.o || 0})</Text>
                </View>
              ) : (
                <Text style={styles.notStarted}>Awaiting</Text>
              )}
            </View>
            
            {/* VS */}
            <View style={styles.vsContainer}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              </View>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            {/* Team 2 */}
            <View style={styles.teamSection}>
              <Text style={styles.flagEmoji}>{getTeamFlag(match.teamInfo?.[1]?.name)}</Text>
              <Text style={styles.teamName}>{team2}</Text>
              {started ? (
                <View style={styles.scoreContainer}>
                  <Text style={styles.score}>
                    {match.score?.[1]?.r || 0}
                    <Text style={styles.wickets}>/{match.score?.[1]?.w || 0}</Text>
                  </Text>
                  <Text style={styles.overs}>({match.score?.[1]?.o || 0})</Text>
                </View>
              ) : (
                <Text style={styles.notStarted}>Awaiting</Text>
              )}
            </View>
          </View>
          
          <View style={styles.matchStatusContainer}>
            <Text style={[styles.matchStatus, { color: statusColor }]}>
              {getMatchStatusText(match)}
            </Text>
          </View>
          
          {/* Win probability - only show if match has started and data is available */}
          {started && match.winProbability && (
            <View style={styles.probabilityContainer}>
              <View style={styles.probabilityTeam}>
                <Text style={styles.probabilityLabel}>{team1}</Text>
                <Text style={styles.probabilityValue}>{match.winProbability?.team1 || '?'}%</Text>
              </View>
              <View style={styles.probabilityBar}>
                <View 
                  style={[
                    styles.probabilityFill, 
                    { width: `${match.winProbability?.team1 || 50}%` }
                  ]} 
                />
              </View>
              <View style={styles.probabilityTeam}>
                <Text style={styles.probabilityLabel}>{team2}</Text>
                <Text style={styles.probabilityValue}>{match.winProbability?.team2 || '?'}%</Text>
              </View>
            </View>
          )}
          
          {/* Expanded details */}
          {expanded && (
            <View style={styles.expandedDetails}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsHeader}>Match Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Venue:</Text>
                  <Text style={styles.detailValue}>{match.venue || 'Unknown venue'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Match Type:</Text>
                  <Text style={styles.detailValue}>{match.matchType || 'Not specified'}</Text>
                </View>
                
                {match.tossWinner && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Toss:</Text>
                    <Text style={styles.detailValue}>
                      {match.tossWinner} won and chose to {match.tossChoice || 'bat/bowl'}
                    </Text>
                  </View>
                )}
                
                {match.score && match.score[0] && started && (
                  <>
                    <Text style={styles.detailsHeader}>Batting Details</Text>
                    
                    {match.score[0].inning && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{match.score[0].inning}:</Text>
                        <Text style={styles.detailValue}>
                          {match.score[0].r}/{match.score[0].w} ({match.score[0].o})
                        </Text>
                      </View>
                    )}
                    
                    {match.score[1] && match.score[1].inning && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{match.score[1].inning}:</Text>
                        <Text style={styles.detailValue}>
                          {match.score[1].r}/{match.score[1].w} ({match.score[1].o})
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
          
          <View style={styles.cardFooter}>
            <Text style={styles.expandPrompt}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#aaa" 
            />
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1a73e8',
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  lastUpdatedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
  },
  filterText: {
    color: '#aaa',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  matchCard: {
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 10,
  },
  tournamentName: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flagEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  teamName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  wickets: {
    fontSize: 18,
  },
  overs: {
    color: '#aaa',
    fontSize: 14,
  },
  notStarted: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  matchStatusContainer: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  matchStatus: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  probabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  probabilityTeam: {
    alignItems: 'center',
    width: 60,
  },
  probabilityLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  probabilityValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  probabilityBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: '#1a73e8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  expandPrompt: {
    color: '#aaa',
    fontSize: 12,
    marginRight: 4,
  },
  expandedDetails: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 8,
  },
  detailsHeader: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 13,
    width: 70,
  },
  detailValue: {
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
});