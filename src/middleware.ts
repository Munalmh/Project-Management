import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tickets/:path*",
    "/board/:path*",
    "/team/:path*",
    "/reports/:path*",
    "/workload/:path*",
  ]
}
