import { next } from "@vercel/edge";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(request) {
  // 環境変数が設定されているかチェック
  if (!process.env.BASIC_AUTH_USER || !process.env.BASIC_AUTH_PASSWORD) {
    console.warn('Basic Auth environment variables not set');
    return next();
  }

  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader && authorizationHeader.startsWith("Basic ")) {
    try {
      const basicAuth = authorizationHeader.split(" ")[1];
      const decoded = atob(basicAuth);
      const [user, password] = decoded.split(":");

      if (user === process.env.BASIC_AUTH_USER && password === process.env.BASIC_AUTH_PASSWORD) {
        return next();
      }
    } catch (error) {
      console.error('Basic Auth parsing error:', error);
    }
  }

  return new Response("Basic Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}