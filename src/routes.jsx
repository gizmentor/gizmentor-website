import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Ventures from './pages/Ventures';
import Easelect from './pages/Easelect';
import MagFusion from './pages/MagFusion';
import Investors from './pages/Investors';
import Contact from './pages/Contact';
import Services from './pages/Services';
import WebsiteDesign from './pages/WebsiteDesign';
import Brief from './pages/Brief';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Returns from './pages/Returns';
import NotFound from './pages/NotFound';
import { localizePath } from './i18n/locales';

/** The same page tree, mounted once per locale. */
function pages(locale) {
  const to = (p) => localizePath(locale, p);
  return (
    <>
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="ventures" element={<Ventures />} />
      <Route path="easelect" element={<Easelect />} />
      <Route path="products" element={<Navigate to={to('/products/magfusion')} replace />} />
      <Route path="products/magfusion" element={<MagFusion />} />
      <Route path="products/magfusion-air" element={<Navigate to={to('/products/magfusion')} replace />} />
      <Route path="investors" element={<Investors />} />
      <Route path="services" element={<Services />} />
      <Route path="services/website-design" element={<WebsiteDesign />} />
      <Route path="services/website-design/brief" element={<Brief />} />
      <Route path="contact" element={<Contact />} />
      <Route path="terms" element={<Terms />} />
      <Route path="privacy" element={<Privacy />} />
      <Route path="returns" element={<Returns />} />
      <Route path="*" element={<NotFound />} />
    </>
  );
}

/**
 * Shared by the browser app and the build-time prerender.
 * Legacy URLs are also redirected at the edge (vercel.json / public/_redirects);
 * the <Navigate> routes cover client-side navigation from old links.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/ar" element={<Layout locale="ar" />}>{pages('ar')}</Route>
      <Route path="/" element={<Layout locale="en" />}>{pages('en')}</Route>
    </Routes>
  );
}
