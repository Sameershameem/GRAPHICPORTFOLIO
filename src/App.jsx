import { useEffect } from 'react'
import { useSmoothScroll } from './lib/useSmoothScroll'
import { ScrollTrigger } from './lib/motion'
import Nav from './components/Nav'
import Lightbox from './components/Lightbox'
import Hero from './sections/Hero'
import Showcase from './sections/Showcase'
import Search from './sections/Search'
import Galaxy from './sections/Galaxy'
import Platforms from './sections/Platforms'
import Journey from './sections/Journey'

export default function App() {
  useSmoothScroll()

  // Fonts and lazy images change layout heights; re-measure triggers once settled.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Showcase />
        <Search />
        <Galaxy />
        <Platforms />
        <Journey />
      </main>
      <Lightbox />
    </>
  )
}
