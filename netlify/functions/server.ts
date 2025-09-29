// Adaptador para convertir Express app a Netlify Function
import { Handler } from '@netlify/functions'

// Cargar variables de entorno
require('dotenv').config()

// Importar la aplicación Express del backend
const aplicacion = require('../../backend/dist/aplicacion.js')

// Crear handler para Netlify Functions
export const handler: Handler = async (event, context) => {
  // Configurar request y response objects para Express
  const req = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: event.body,
    query: event.queryStringParameters || {},
    // Agregar propiedades adicionales que Express espera
    get: (header: string) => event.headers[header.toLowerCase()],
    params: {},
    ip: event.headers['client-ip'] || '127.0.0.1',
    protocol: 'https',
    secure: true,
    hostname: event.headers.host,
    originalUrl: event.path,
    path: event.path,
    baseUrl: '',
    route: { path: event.path },
    cookies: {},
    signedCookies: {},
    fresh: false,
    stale: true,
    xhr: false,
    subdomains: [],
    accepts: () => true,
    acceptsCharsets: () => true,
    acceptsEncodings: () => true,
    acceptsLanguages: () => true,
    range: () => false,
    param: () => '',
    is: () => false,
    app: aplicacion,
    res: null,
    next: () => {},
    locals: {}
  }

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    
    status: (code: number) => {
      res.statusCode = code
      return res
    },
    
    json: (obj: any) => {
      res.body = JSON.stringify(obj)
      res.headers['Content-Type'] = 'application/json'
      return res
    },
    
    send: (data: string) => {
      res.body = data
      return res
    },
    
    setHeader: (name: string, value: string) => {
      res.headers[name] = value
      return res
    },
    
    end: (data?: string) => {
      if (data) res.body = data
      return res
    },
    
    // Métodos adicionales que Express puede usar
    cookie: () => res,
    clearCookie: () => res,
    redirect: () => res,
    render: () => res,
    sendFile: () => res,
    download: () => res,
    type: () => res,
    format: () => res,
    attachment: () => res,
    header: res.setHeader,
    get: (name: string) => res.headers[name.toLowerCase()],
    vary: () => res,
    append: () => res,
    locals: {}
  }

  // Conectar response al request
  ;(req as any).res = res

  // Crear función next
  const next = (error?: any) => {
    if (error) {
      console.error('Express error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  // Ejecutar middleware de Express
  try {
    await new Promise<void>((resolve, reject) => {
      // Simular el ciclo de request/response de Express
      const originalEnd = res.end
      res.end = function(data?: string) {
        originalEnd.call(this, data)
        resolve()
      }

      // Ejecutar la aplicación Express
      aplicacion(req as any, res as any, next)
    })

    return {
      statusCode: res.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        ...res.headers
      },
      body: res.body
    }
  } catch (error) {
    console.error('Handler error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
