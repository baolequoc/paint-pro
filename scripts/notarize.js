// This is a placeholder notarization script
// In a production environment, you would implement actual notarization here
module.exports = async function notarizing(context) {
  // Skip notarization in development
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  
  console.log('Skipping notarization in development');
  return;
}; 