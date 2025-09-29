// Función de prueba simple para verificar que Netlify Functions funciona
exports.handler = async (event, context) => {
  console.log('Test function called:', event.path)
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      message: 'Test function working!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    })
  }
}
