import { jwtVerify, createRemoteJWKSet } from "jose";

function getNeonAuthConfig(env?: any) {
  const actualEnv = env || 
    (typeof globalThis !== 'undefined' && (globalThis as any).env) ||
    (typeof process !== 'undefined' && process.env) ||
    {};
  
  const projectId = actualEnv.STACK_PROJECT_ID;
  const projectSecret = actualEnv.STACK_PROJECT_SECRET;
  // Stack Auth uses the projects endpoint for JWKS
  const jwksUrl = actualEnv.STACK_JWKS_URL || `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`;
  
  if (!projectId) {
    throw new Error(
      "STACK_PROJECT_ID is required but not provided. " +
      "Make sure it's configured in wrangler.toml or environment variables."
    );
  }
  
  return { projectId, projectSecret, jwksUrl };
}

// Cache for JWKS to avoid fetching on every request
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksUrlCache: string | null = null;

function getJWKS(jwksUrl: string) {
  if (!jwksCache || jwksUrlCache !== jwksUrl) {
    jwksCache = createRemoteJWKSet(new URL(jwksUrl));
    jwksUrlCache = jwksUrl;
  }
  return jwksCache;
}

export async function verifyNeonAuthToken(token: string, env?: any) {
  try {
    const { projectId, jwksUrl } = getNeonAuthConfig(env);
    
    // Stack Auth uses ES256 (Elliptic Curve) signing, which requires JWKS
    // The JWKS endpoint is: https://api.stack-auth.com/api/v1/projects/{projectId}/.well-known/jwks.json
    const JWKS = getJWKS(jwksUrl);
    
    // Try different possible issuer formats
    const possibleIssuers = [
      `https://api.stack-auth.com/api/v1/${projectId}`,
      `https://api.stackauth.dev/api/v1/${projectId}`,
      `https://${projectId}.stackauth.dev`,
      `https://stack-auth.com/${projectId}`,
    ];
    
    let payload: any;
    let verified = false;
    
    // Try without issuer first (some tokens might not have issuer claim)
    try {
      const result = await jwtVerify(token, JWKS);
      payload = result.payload;
      verified = true;
    } catch (noIssuerError: any) {
      // If that fails, try with different issuer formats
      for (const issuer of possibleIssuers) {
        try {
          const result = await jwtVerify(token, JWKS, { issuer });
          payload = result.payload;
          verified = true;
          break;
        } catch (issuerError: any) {
          // Continue to next issuer
          continue;
        }
      }
      
      if (!verified) {
        throw noIssuerError;
      }
    }
    
    // Extract user information from the token payload
    // Stack Auth tokens typically have 'sub' as the user ID
    const userId = payload.sub || payload.userId || payload.id;
    
    if (!userId) {
      throw new Error("Invalid token: No user ID found in token");
    }
    
    return {
      sub: userId,
      userId: userId,
      email: payload.email as string | undefined,
      ...payload,
    };
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new Error("Token has expired");
    }
    if (error.code === 'ERR_JWT_INVALID') {
      throw new Error("Invalid token");
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

