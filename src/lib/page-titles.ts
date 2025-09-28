import { siteConfig } from './config';

const appName = siteConfig.name;

export const pageTitles = {
  home: appName,
  dashboard: `Dashboard - ${appName}`,
  generate: `Generate Playlist - ${appName}`,
  discover: `Discover - ${appName}`,
  radio: `Radio - ${appName}`,
  search: `Search - ${appName}`,
  history: `History - ${appName}`,
  favorites: `Favorites - ${appName}`,
  settings: `Settings - ${appName}`,
  playlist: (title: string) => `${title} - ${appName}`,
  login: `Sign in - ${appName}`,
  signup: `Sign up - ${appName}`,
  forgotPassword: `Reset password - ${appName}`,
};

export const pageDescriptions = {
  home: `${appName} helps you craft AI-powered playlists and save them on Spotify`,
  dashboard: `Manage and discover playlists with ${appName}`,
  generate: `Create AI-driven playlists using ${appName}`,
  discover: `Find new tracks and artists with ${appName}`,
  radio: `Listen to custom stations powered by ${appName}`,
  search: `Search music, artists, and playlists in ${appName}`,
  history: `Review every playlist you've created with ${appName}`,
  favorites: `Your favorite playlists inside ${appName}`,
  settings: `Adjust your experience in ${appName}`,
  playlist: (title: string) => `Playlist "${title}" crafted with ${appName}`,
  login: `Sign in to access ${appName}`,
  signup: `Create your ${appName} account`,
  forgotPassword: `Recover access to your ${appName} account`,
};
