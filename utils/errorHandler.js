// Error handling utilities for API responses

export const handleAPIError = (error, fallbackMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  // If it's a network error
  if (error.message === 'Network request failed') {
    return {
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
      details: []
    };
  }
  
  // If it's a timeout error
  if (error.message.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      details: []
    };
  }
  
  // If it's a validation error with details
  if (error.details && Array.isArray(error.details)) {
    return {
      title: 'Validation Error',
      message: error.message || fallbackMessage,
      details: error.details
    };
  }
  
  // Generic error handling
  return {
    title: 'Error',
    message: error.message || fallbackMessage,
    details: []
  };
};

export const formatValidationErrors = (details) => {
  if (!details || !Array.isArray(details) || details.length === 0) {
    return '';
  }
  
  return details.map(detail => 
    `• ${detail.field}: ${detail.message}`
  ).join('\n');
};

export const showErrorAlert = (error, fallbackMessage = 'An error occurred') => {
  const formattedError = handleAPIError(error, fallbackMessage);
  
  let message = formattedError.message;
  
  if (formattedError.details.length > 0) {
    const detailsText = formatValidationErrors(formattedError.details);
    message = `${message}\n\n${detailsText}`;
  }
  
  return {
    title: formattedError.title,
    message: message
  };
};

// Network connectivity check
export const checkNetworkConnectivity = async () => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      timeout: 5000
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Retry mechanism for API calls
export const retryAPICall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      console.log(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default {
  handleAPIError,
  formatValidationErrors,
  showErrorAlert,
  checkNetworkConnectivity,
  retryAPICall
};
