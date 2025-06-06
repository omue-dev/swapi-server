import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import credentials from '../utils/authCredentials';

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
      username: credentials.username, 
      password: credentials.password  
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      cachedToken = response.data.access_token;
      setTimeout(() => {
        cachedToken = null;
      }, (response.data.expires_in - 60) * 1000);
  
      return cachedToken as string;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      throw error;
    }
  };
  
  export default getAuthToken;
