import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const SHOPWARE_API_URL = process.env.API_BASE_URL;

let cachedToken: string | null = null;

const getAuthToken = async (): Promise<string> => {
  if (cachedToken) {
    return cachedToken as string;
  }

  try {
    const response = await axios.post(`${SHOPWARE_API_URL}/oauth/token`, {
      client_id: 'administration',
      grant_type: 'password',
      scopes: 'read',
      username: 'omueller', // Ersetzen Sie diesen Wert durch Ihren tatsächlichen Benutzername
      password: '9UC&tj^1nHPef$'  // Ersetzen Sie diesen Wert durch Ihr tatsächliches Passwort
    }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      cachedToken = response.data.access_token;
      setTimeout(() => {
        cachedToken = null;
      }, (response.data.expires_in - 60) * 1000); // Erneuern 1 Minute vor Ablauf
  
      return cachedToken as string;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      throw error;
    }
  };
  
  export default getAuthToken;