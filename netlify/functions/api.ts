// Netlify Function para el backend API
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createProxyMiddleware } from 'http-proxy-middleware'

// Configuración del backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// Crear proxy para redirigir requests al backend
const proxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remover /api del path
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err)
  }
})

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Convertir Netlify event a Express request/response
  return new Promise((resolve) => {
    const { httpMethod, path, headers, body } = event
    
    // Simular request/response objects
    const req = {
      method: httpMethod,
      url: path,
      headers,
      body: body ? JSON.parse(body) : undefined,
    }
    
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      setHeader: (name: string, value: string) => {
        res.headers[name] = value
      },
      end: (data: string) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        })
      }
    }
    
    proxy(req as any, res as any, () => {
      resolve({
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' })
      })
    })
  })
}
