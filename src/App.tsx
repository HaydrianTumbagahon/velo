import { Suspense, useCallback, useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { useBrandTheme } from './hooks/useBrandTheme'
import { brandBySlug } from './lib/data'
import { Command } from './components/Command'
import { CompareTray } from './components/CompareTray'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Page } from './components/Page'
import { Cursor } from './components/Cursor'
import { ScrollLine } from './components/ScrollLine'
import { EdgeBlur } from './components/EdgeBlur'
import { LenisProvider } from './lib/smooth'
import { routes, routePages } from './routes'

function currentBrand(path: string) {
  const match = path.match(/^\/brands\/([^/]+)/)
  return match ? brandBySlug(match[1]) ?? null : null
}

function AppShell() {
  const [location] = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandMode, setCommandMode] = useState<'navigate' | 'compare'>('navigate')
  const brand = currentBrand(location)
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openCommand = useCallback(() => {
    setCommandMode('navigate')
    setCommandOpen(true)
  }, [])

  useBrandTheme(brand)

  useEffect(() => {
    const open = () => openCommand()
    const openCompare = () => {
      setCommandMode('compare')
      setCommandOpen(true)
    }
    window.addEventListener('velo:open-command', open)
    window.addEventListener('velo:open-compare-command', openCompare)
    return () => {
      window.removeEventListener('velo:open-command', open)
      window.removeEventListener('velo:open-compare-command', openCompare)
    }
  }, [openCommand])

  return (
    <>
      <div id="app-shell" className="paper" inert={commandOpen}>
        <a
          className="paper link sr-only fixed left-4 top-4 z-[120] p-3 text-fg focus:not-sr-only"
          href="#main"
        >
          Skip to content
        </a>
        <Nav onSearch={openCommand} />
        <Page brand={brand}>
          <main id="main" className="paper" tabIndex={-1}>
            <Suspense fallback={<div className="paper min-h-svh" />}>
              <Switch>
                {routes.map((route) => (
                  <Route key={route.path} path={route.path} component={route.page} />
                ))}
                <Route component={routePages.notFound} />
              </Switch>
            </Suspense>
          </main>
        </Page>
        <Footer />
        <CompareTray />
      </div>
      <Command open={commandOpen} mode={commandMode} onClose={closeCommand} />
      <EdgeBlur />
      <Cursor />
      <ScrollLine />
    </>
  )
}

export function App() {
  return (
    <LenisProvider>
      <AppShell />
    </LenisProvider>
  )
}
