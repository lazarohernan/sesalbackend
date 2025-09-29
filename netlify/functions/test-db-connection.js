// Función específica para test-db-connection
exports.handler = async (event, context) => {
  console.log('=== TEST-DB-CONNECTION FUNCTION CALLED ===')
  console.log('Event:', JSON.stringify(event, null, 2))
  
  // Manejar CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    }
  }
  
  // Verificar variables de entorno
  const envVars = {
    MYSQL_HOST: process.env.MYSQL_HOST ? 'SET' : 'NOT SET',
    MYSQL_PORT: process.env.MYSQL_PORT ? 'SET' : 'NOT SET',
    MYSQL_USER: process.env.MYSQL_USER ? 'SET' : 'NOT SET',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? 'SET' : 'NOT SET',
    MYSQL_DATABASE: process.env.MYSQL_DATABASE ? 'SET' : 'NOT SET'
  }
  
  console.log('Environment variables:', envVars)
  
  // Parsear el body si es POST
  let requestBody = null
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body)
      console.log('Request body:', requestBody)
    } catch (error) {
      console.error('Error parsing body:', error)
    }
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Test DB Connection function working!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      environmentVariables: envVars,
      requestBody: requestBody,
      nodeVersion: process.version
    })
  }
}
