import axios from "axios";

const SHOPWARE_API_URL = process.env.SHOPWARE_API_URL!;
const CLIENT_ID = process.env.SHOPWARE_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPWARE_CLIENT_SECRET!;

let accessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Holt oder erneuert das Access Token für die Shopware Admin API
 */
export async function getAuthToken(): Promise<string> {
  const now = Date.now();

  // Token noch gültig? Dann wiederverwenden
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  // Neues Token holen (Client Credentials Flow)
  const response = await axios.post(`${SHOPWARE_API_URL}/oauth/token`, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  // Hier wird das Token sicher gesetzt
  accessToken = response.data.access_token as string;

  const expiresIn = response.data.expires_in as number;
  tokenExpiresAt = now + expiresIn * 1000 - 60 * 1000; // 1 min Puffer

  // Jetzt garantiert string, kein null
  return accessToken!;
}
