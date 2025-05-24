const setTokens = (accessToken, refreshToken, user) => {
    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user || {}));
      console.log('tokenUtils - Tokens set:', { accessToken, refreshToken, user });
    } catch (error) {
      console.error('tokenUtils - Error setting tokens:', error);
    }
  };
  
  const getAccessToken = () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('tokenUtils - Retrieved access token:', token);
      return token;
    } catch (error) {
      console.error('tokenUtils - Error getting access token:', error);
      return null;
    }
  };
  
  const getRefreshToken = () => {
    try {
      const token = localStorage.getItem('refresh_token');
      console.log('tokenUtils - Retrieved refresh token:', token);
      return token;
    } catch (error) {
      console.error('tokenUtils - Error getting refresh token:', error);
      return null;
    }
  };
  
  const clearTokens = () => {
    try {
      console.log('tokenUtils - Clearing tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('tokenUtils - Error clearing tokens:', error);
    }
  };
  
  export { setTokens, getAccessToken, getRefreshToken, clearTokens };