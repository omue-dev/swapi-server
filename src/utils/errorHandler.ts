import { Response } from 'express';
import axios from 'axios';

export const handleAxiosFetchError = (error: any, res: Response): void => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Log only the relevant part of the error response
      console.error('Axios error response:', {
        errors: error.response.data.errors || []
      });
    }
    res.status(error.response?.status || 500).send(error.response?.data || error.message);
  } else {
    res.status(500).send('An unknown error occurred');
  }
};

export const handleAxiosUpdateError = (error: any, res: Response): void => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Log only the relevant part of the error response
      console.error('Axios error response:', {
        errors: error.response.data.errors || []
      });
    }
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      error: error.response?.data || 'Unknown error occurred'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred'
    });
  }
};