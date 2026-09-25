import { Outlet } from "react-router-dom";
import Footer from "@/components/footer/Footer";

import Navbar from "@/components/navbar/Navbar";
import ScrollToTop from "@/components/ScrollToTop";

function ParentLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default ParentLayout;
