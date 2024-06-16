import { Request } from 'express';

export const getHeaders = (req: Request) => {
  //console.log("Incoming headers:", req.headers); // Debugging-Ausgabe
  const headers = {
    'Accept': 'application/vnd.api+json, application/json',
    'Content-Type': 'application/json',
    'Authorization': req.headers['Authorization'] || '' // Kleinbuchstaben, falls der Header nicht gefunden wird
  };

  return headers;
};
