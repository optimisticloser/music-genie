import { siteConfig } from './config';

export const pageTitles = {
  home: `${siteConfig.name} - ${siteConfig.description}`,
  dashboard: `Dashboard - ${siteConfig.name}`,
  generate: `Gerar Playlist - ${siteConfig.name}`,
  discover: `Descobrir - ${siteConfig.name}`,
  radio: `Rádio - ${siteConfig.name}`,
  search: `Buscar - ${siteConfig.name}`,
  history: `Histórico - ${siteConfig.name}`,
  favorites: `Favoritos - ${siteConfig.name}`,
  settings: `Configurações - ${siteConfig.name}`,
  playlist: (title: string) => `${title} - ${siteConfig.name}`,
  login: `Entrar - ${siteConfig.name}`,
  signup: `Cadastrar - ${siteConfig.name}`,
  forgotPassword: `Recuperar Senha - ${siteConfig.name}`,
};

export const pageDescriptions = {
  home: siteConfig.fullDescription,
  dashboard: `Gerencie suas playlists e descubra novas músicas com ${siteConfig.name}`,
  generate: `Crie playlists personalizadas com IA usando ${siteConfig.name}`,
  discover: `Descubra novas músicas e artistas com ${siteConfig.name}`,
  radio: `Ouça rádios personalizadas e podcasts com ${siteConfig.name}`,
  search: `Busque músicas, artistas e playlists com ${siteConfig.name}`,
  history: `Veja o histórico de todas as suas playlists criadas com ${siteConfig.name}`,
  favorites: `Suas playlists favoritas criadas com ${siteConfig.name}`,
  settings: `Configure suas preferências em ${siteConfig.name}`,
  playlist: (title: string) => `Playlist "${title}" criada com ${siteConfig.name}`,
  login: `Faça login para acessar ${siteConfig.name}`,
  signup: `Crie sua conta no ${siteConfig.name}`,
  forgotPassword: `Recupere sua senha do ${siteConfig.name}`,
}; 