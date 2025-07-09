// Check what API URL is being used
console.log('Environment:', process.env.NODE_ENV);
console.log('API URL from env:', process.env.REACT_APP_API_URL);
console.log('Axios default baseURL:', axios.defaults.baseURL);

// Add this temporarily to your App.js or index.js to debug
window.debugAPI = () => {
  console.log('Current API Configuration:');
  console.log('- Environment:', process.env.NODE_ENV);
  console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('- Axios baseURL:', axios.defaults.baseURL);
  console.log('- Window location:', window.location.href);
};

console.log('Run window.debugAPI() in console to check API configuration');