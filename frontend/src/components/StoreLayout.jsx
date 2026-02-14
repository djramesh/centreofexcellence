import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import ScrollToTop from "./ScrollToTop";
import Footer from "./Footer";

export default function StoreLayout() {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <Outlet />
      <Footer />
      <BottomNav />
    </>
  );
}
