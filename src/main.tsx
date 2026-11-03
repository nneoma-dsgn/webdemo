import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './styles/tokens.css'
import './styles/app.css'
import './styles/login.css'
import { getSession } from './auth'
import { MenuProvider } from './components/Menu'
import { PreviewProvider } from './components/Preview'
import { MobileNav, TopNav } from './components/Nav'
import Home from './pages/Home'
import Search from './pages/Search'
import Studio from './pages/Studio'
import Browse from './pages/Browse'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'

/* Signed-out visitors land on the signed-out Discover page; half-finished sign ups resume onboarding. */
function RequireAuth() {
  const { pathname, search } = useLocation()
  const s = getSession()
  if (!s) return <Navigate to="/welcome" replace state={{ from: pathname + search }} />
  if (!s.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/* Signed-out only pages bounce signed-in visitors to where they belong. */
function SignedOut({ children }: { children: React.ReactNode }) {
  const s = getSession()
  if (s) return <Navigate to={s.onboarded ? '/' : '/onboarding'} replace />
  return <>{children}</>
}

function OnboardingRoute() {
  const s = getSession()
  if (!s) return <Navigate to="/signup" replace />
  if (s.onboarded) return <Navigate to="/" replace />
  return <Onboarding />
}

function Shell() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return (
    <PreviewProvider>
      <TopNav />
      <main>
        <Outlet />
      </main>
      <MobileNav />
    </PreviewProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MenuProvider>
        <Routes>
          <Route path="welcome" element={<SignedOut><Welcome /></SignedOut>} />
          <Route path="signup" element={<SignedOut><Auth mode="signup" key="signup" /></SignedOut>} />
          <Route path="login" element={<SignedOut><Auth mode="login" key="login" /></SignedOut>} />
          <Route path="onboarding" element={<OnboardingRoute />} />
          <Route element={<RequireAuth />}>
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="studio/:id" element={<Studio />} />
              <Route path="browse/:shelf" element={<Browse />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MenuProvider>
    </BrowserRouter>
  </StrictMode>,
)
