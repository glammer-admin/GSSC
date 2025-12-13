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

  // Si hay error, redirigir a página de error
  if (error) {
    console.error("[AUTH-SSO-001] OAuth error:", error, errorDescription)
    return NextResponse.redirect(new URL("/error?code=AUTH-SSO-001", request.url))
  }

  // Si no hay código, redirigir a página de error
  if (!code) {
    console.error("[AUTH-SSO-002] No authorization code received")
    return NextResponse.redirect(new URL("/error?code=AUTH-SSO-002", request.url))
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
          console.error('[AUTH-SSO-003] No code_verifier found in sessionStorage');
          window.location.href = '/error?code=AUTH-SSO-003';
          return;
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
          console.error('[AUTH-TKN-001] Token exchange failed:', error);
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('pkce_state');
          sessionStorage.removeItem('pkce_provider');
          const errorCode = error.errorCode || 'AUTH-TKN-001';
          window.location.href = '/error?code=' + errorCode;
          return;
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

        const authData = await authResponse.json();
        
        // Verificar si hay error con redirección a página de error
        if (authData.error && authData.redirect) {
          console.error('❌ [MS CALLBACK] Auth error, redirecting to error page');
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('pkce_state');
          sessionStorage.removeItem('pkce_provider');
          window.location.href = authData.redirect;
          return;
        }

        if (!authResponse.ok) {
          throw new Error(authData.message || 'Error creando sesión');
        }

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
        console.error('[ERR-GEN-000] Unexpected error:', error);
        
        // Limpiar sessionStorage en caso de error
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        sessionStorage.removeItem('pkce_provider');
        
        // Redirigir a página de error
        window.location.href = '/error?code=ERR-GEN-000';
      }
    })();
  </script>
</body>
</html>
  `
}

