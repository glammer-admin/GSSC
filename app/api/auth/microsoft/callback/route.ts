import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/microsoft/callback
 * Recibe la respuesta de Microsoft OAuth con Authorization Code (PKCE)
 * Procesa el código, obtiene el token, crea la sesión y redirige al dashboard
 */
export async function GET(request: NextRequest) {
  // Obtener parámetros de la URL
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("📥 [MS CALLBACK] Request received", {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error
  })

  // Si hay error, mostrar página de error
  if (error) {
    console.error("❌ [MS CALLBACK] Auth error:", error, errorDescription)
    return new NextResponse(getErrorPage(errorDescription || error), {
      headers: { "Content-Type": "text/html" },
      status: 400,
    })
  }

  // Si no hay código, error
  if (!code) {
    console.error("❌ [MS CALLBACK] No code received")
    return new NextResponse(getErrorPage("No se recibió código de autorización"), {
      headers: { "Content-Type": "text/html" },
      status: 400,
    })
  }

  // Retornar página HTML que procesa el código usando sessionStorage
  const html = getProcessingPage(code, state || "")

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}

function getProcessingPage(code: string, state: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Microsoft Sign In</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      color: #333;
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }
    p {
      color: #666;
      margin: 0;
      line-height: 1.5;
    }
    .error {
      color: #d32f2f;
      background: #ffebee;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Completando autenticación</h1>
    <p id="status">Procesando tu información...</p>
    <div id="error-container"></div>
  </div>
  <script>
    (async function() {
      const code = "${code}";
      const state = "${state}";
      const statusEl = document.getElementById('status');
      const errorContainer = document.getElementById('error-container');

      console.log('🔍 [MS CALLBACK] Processing authorization code...');

      try {
        // 1. Obtener code_verifier del sessionStorage
        const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
        const savedState = sessionStorage.getItem('pkce_state');
        const provider = sessionStorage.getItem('pkce_provider');

        console.log('🔍 [MS CALLBACK] SessionStorage data:', {
          hasCodeVerifier: !!codeVerifier,
          hasSavedState: !!savedState,
          provider: provider,
          stateMatches: savedState === state
        });

        if (!codeVerifier) {
          throw new Error('No se encontró el código de verificación. Por favor, intenta nuevamente.');
        }

        if (savedState !== state) {
          console.warn('⚠️ [MS CALLBACK] State mismatch. Expected:', savedState, 'Got:', state);
        }

        statusEl.textContent = 'Intercambiando código por token...';

        // 2. Intercambiar código por tokens en el servidor
        console.log('📤 [MS CALLBACK] Calling token exchange endpoint...');
        const tokenResponse = await fetch('/api/auth/microsoft/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code,
            code_verifier: codeVerifier
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          throw new Error(error.details || error.error || 'Error intercambiando código');
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ [MS CALLBACK] Token received');

        statusEl.textContent = 'Creando sesión...';

        // 3. Enviar ID token al callback principal para crear sesión
        console.log('📤 [MS CALLBACK] Creating session...');
        const authResponse = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: tokenData.id_token,
            provider: 'microsoft'
          }),
        });

        if (!authResponse.ok) {
          const error = await authResponse.json();
          throw new Error(error.message || 'Error creando sesión');
        }

        const authData = await authResponse.json();
        console.log('✅ [MS CALLBACK] Session created, redirecting...');

        // 4. Limpiar sessionStorage
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        sessionStorage.removeItem('pkce_provider');

        // 5. Redirigir al dashboard
        statusEl.textContent = '¡Autenticación exitosa! Redirigiendo...';
        
        setTimeout(() => {
          window.location.href = authData.redirect || '/customer-dash';
        }, 500);

      } catch (error) {
        console.error('❌ [MS CALLBACK] Error:', error);
        statusEl.textContent = 'Error en la autenticación';
        errorContainer.innerHTML = \`
          <div class="error">
            <strong>Error:</strong> \${error.message || 'Error desconocido'}
            <br><br>
            <a href="/" style="color: #667eea; text-decoration: none; font-weight: 500;">
              ← Volver al login
            </a>
          </div>
        \`;
      }
    })();
  </script>
</body>
</html>
  `
}

function getErrorPage(errorMessage: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Error - Microsoft Sign In</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
    }
    .error-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 1.5rem;
      background: #ffebee;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d32f2f;
      font-size: 2rem;
    }
    h1 {
      color: #333;
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }
    p {
      color: #666;
      margin: 1rem 0;
      line-height: 1.5;
    }
    a {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 1rem;
      transition: background 0.2s;
    }
    a:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="error-icon">✕</div>
    <h1>Error de Autenticación</h1>
    <p>${errorMessage}</p>
    <a href="/">Volver al login</a>
  </div>
</body>
</html>
  `
}
