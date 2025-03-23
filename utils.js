import { Share, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Helper function to check if a cricket match has started
 * @param {Object} match - The match object with score and time information
 * @returns {boolean} - Whether the match has started
 */
export const hasMatchStarted = (match) => {
  if (!match) return false;
  
  // Check if the API directly provides this information
  if (match.matchStarted === false) return false;
  
  // Check if any team has a score
  const team1HasScore = match.score && match.score[0] && 
                       (match.score[0].r > 0 || match.score[0].w > 0 || match.score[0].o > 0);
  const team2HasScore = match.score && match.score[1] && 
                       (match.score[1].r > 0 || match.score[1].w > 0 || match.score[1].o > 0);
  
  // Check if the match start time is in the past
  const matchTimeCheck = match.dateTimeGMT && new Date(match.dateTimeGMT) < new Date();
  
  return team1HasScore || team2HasScore || matchTimeCheck;
};

/**
 * Helper function to check if a match is completed
 * @param {Object} match - The match object with status information
 * @returns {boolean} - Whether the match is completed
 */
export const isMatchCompleted = (match) => {
  if (!match) return false;
  
  // Check status text for common "completed" indicators
  const status = match.status?.toLowerCase() || '';
  return status.includes('won') || 
         status.includes('victory') || 
         status.includes('drawn') || 
         status.includes('tied') ||
         status.includes('abandoned');
};

/**
 * Function to format match status text based on match state
 * @param {Object} match - The match object
 * @returns {string} - Formatted status text
 */
export const getMatchStatusText = (match) => {
  if (!match) return "Unknown status";
  
  // If the API directly provides status, use it
  if (match.status) return match.status;
  
  // Handle cases where match hasn't started
  if (!hasMatchStarted(match)) {
    // Try to get scheduled time if available
    if (match.dateTimeGMT) {
      const matchDate = new Date(match.dateTimeGMT);
      return `Starts: ${matchDate.toLocaleDateString()} at ${matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    return "Match not started yet";
  }
  
  // For matches in progress without a status
  return "Match in progress";
};

/**
 * Function to determine status color based on match state
 * @param {Object} match - The match object
 * @returns {string} - Color code for the status
 */
export const getStatusColor = (match) => {
  if (!match) return '#aaa';
  
  if (!hasMatchStarted(match)) {
    return '#f39c12'; // Orange for upcoming
  }
  
  if (isMatchCompleted(match)) {
    return '#e74c3c'; // Red for completed
  }
  
  return '#2ecc71'; // Green for live
};

/**
 * Returns flag emoji for cricket team based on team name
 * @param {string} teamName - Name of the cricket team
 * @returns {string} - Flag emoji
 */
export const getTeamFlag = (teamName) => {
  // This is a simple mapping function - you might want to enhance this
  const flags = {
    'India': '🇮🇳',
    'New Zealand': '🇳🇿',
    'Australia': '🇦🇺',
    'England': '🇬🇧',
    'South Africa': '🇿🇦',
    'West Indies': '🌴',
    'Pakistan': '🇵🇰',
    'Sri Lanka': '🇱🇰',
    'Bangladesh': '🇧🇩',
    'Afghanistan': '🇦🇫',
    'Zimbabwe': '🇿🇼',
    'Ireland': '🇮🇪',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Netherlands': '🇳🇱',
    'United Arab Emirates': '🇦🇪',
    'Nepal': '🇳🇵',
    'Oman': '🇴🇲',
    'Papua New Guinea': '🇵🇬',
    'Namibia': '🇳🇦',
  };
  
  // Try to find the flag, return a default if not found
  return flags[teamName] || '🏏';
};

/**
 * Share match details with native share functionality
 * @param {Object} match - The match object containing details to share
 */
export const shareMatch = async (match) => {
  try {
    if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const team1 = match.teamInfo?.[0]?.shortname || match.teams?.[0] || 'Team 1';
    const team2 = match.teamInfo?.[1]?.shortname || match.teams?.[1] || 'Team 2';
    
    let messageText = `${match.name || 'Cricket Match'}\n`;
    messageText += `${team1} vs ${team2}\n`;
    
    if (hasMatchStarted(match) && match.score) {
      messageText += `Score: ${team1} ${match.score?.[0]?.r || 0}/${match.score?.[0]?.w || 0} (${match.score?.[0]?.o || 0})\n`;
      messageText += `${team2} ${match.score?.[1]?.r || 0}/${match.score?.[1]?.w || 0} (${match.score?.[1]?.o || 0})\n`;
    }
    
    messageText += `Status: ${match.status || getMatchStatusText(match)}\n`;
    messageText += `Check live scores on Cricket Score App!`;
    
    await Share.share({
      message: messageText,
      title: 'Cricket Score Update',
    });
    
  } catch (error) {
    Alert.alert('Error', 'Could not share match details.');
    console.error(error);
  }
};

/**
 * Sort matches by priority (international first, then by status, then by start time)
 * @param {Array} matches - Array of match objects
 * @returns {Array} - Sorted array of matches
 */
export const sortMatches = (matches) => {
  if (!matches || !Array.isArray(matches)) return [];
  
  return [...matches].sort((a, b) => {
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
};