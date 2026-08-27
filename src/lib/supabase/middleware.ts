import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener usuario autenticado real
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPatientRoute = pathname.startsWith('/paciente');
  const isDoctorRoute = pathname.startsWith('/doctor');
  const isLoginRoute = pathname === '/login';

  // Si no está autenticado e intenta acceder a una ruta protegida
  if ((isPatientRoute || isDoctorRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Si el usuario está autenticado, obtener su rol desde la base de datos o metadata
  if (user) {
    const userRole = user.user_metadata?.role || request.cookies.get('user_role')?.value || 'patient';

    // Restricciones por rol
    if (isDoctorRoute && userRole !== 'doctor') {
      const url = request.nextUrl.clone();
      url.pathname = '/paciente';
      return NextResponse.redirect(url);
    }

    if (isPatientRoute && userRole !== 'patient') {
      const url = request.nextUrl.clone();
      url.pathname = '/doctor';
      return NextResponse.redirect(url);
    }

    // Si ya está logueado e intenta ir a login
    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = userRole === 'doctor' ? '/doctor' : '/paciente';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
