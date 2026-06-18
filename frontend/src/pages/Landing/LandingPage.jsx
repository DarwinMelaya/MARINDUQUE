import { useCallback, useEffect, useRef, useState } from "react";
import Head from "../../Components/MainPage/Head";
import About from "../../Components/MainPage/About";
import ContactUs from "../../Components/MainPage/ContactUs";
import Map from "../../Components/MainPage/Map";
import Programs from "../../Components/MainPage/Programs";
import Announcements from "../../Components/MainPage/Announcements";
import ChatBot from "../../Components/Modals/ChatBot/ChatBot";
import Loading from "../../Components/Loading/Loading";

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const LandingPage = () => {
  const mapSectionRef = useRef(null);
  const [mapNavVisible, setMapNavVisible] = useState(false);
  const [chatBotOpen, setChatBotOpen] = useState(false);
  const [pendingLoads, setPendingLoads] = useState(
    () => new Set(["announcements", "programs", "map"]),
  );
  const [isPageLoading, setIsPageLoading] = useState(true);

  const markInitialSectionLoaded = useCallback((section) => {
    setPendingLoads((prev) => {
      if (!prev.has(section)) return prev;
      const next = new Set(prev);
      next.delete(section);
      return next;
    });
  }, []);

  useEffect(() => {
    if (pendingLoads.size === 0) setIsPageLoading(false);
  }, [pendingLoads]);

  useEffect(() => {
    const el = mapSectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show controls habang malinaw na nakatingin sa map section (hindi lang dumaan).
        setMapNavVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.2,
        );
      },
      { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {isPageLoading ? <Loading /> : null}
      <div className="w-full">
        <Head />

        <section id="announcements" className="w-full scroll-mt-24 bg-black">
          <Announcements
            onInitialLoadComplete={() => markInitialSectionLoaded("announcements")}
          />
        </section>

        <section
          id="map"
          ref={mapSectionRef}
          className="relative w-full scroll-mt-24 bg-black"
        >
          <Map onInitialLoadComplete={() => markInitialSectionLoaded("map")} />
        </section>

        <section id="programs" className="w-full scroll-mt-24 bg-black">
          <Programs onInitialLoadComplete={() => markInitialSectionLoaded("programs")} />
        </section>

        <section id="about" className="w-full scroll-mt-24 bg-black">
          <About />
        </section>

        <section id="contact" className="w-full scroll-mt-24 bg-black">
          <ContactUs />
        </section>
      </div>

      {/* Up/Down: kapag nasa map section, may explicit na scroll para hindi ma-trap ng map */}
      <div
        className={`pointer-events-none fixed right-4 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 transition-opacity duration-200 sm:right-6 ${
          mapNavVisible ? "opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!mapNavVisible}
      >
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-[0_8px_30px_rgba(0,0,0,.45)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => scrollToSection("announcements")}
            className="flex h-11 w-11 items-center justify-center text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:h-12 sm:w-12"
            aria-label="Pumunta sa Announcements (taas)"
            title="Taas — Announcements"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M11.47 7.72a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 1 1-1.06 1.06L12 9.31l-4.72 4.72a.75.75 0 0 1-1.06-1.06l5.25-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="mx-2 h-px bg-white/10" />
          <button
            type="button"
            onClick={() => scrollToSection("programs")}
            className="flex h-11 w-11 items-center justify-center text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:h-12 sm:w-12"
            aria-label="Pumunta sa Programs (ibaba)"
            title="Ibaba — Programs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.53 16.28a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 0 1 1.06-1.06L12 14.69l4.72-4.72a.75.75 0 1 1 1.06 1.06l-5.25 5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ChatBot launcher */}
      {!chatBotOpen ? (
        <button
          type="button"
          onClick={() => setChatBotOpen(true)}
          className={`fixed bottom-5 right-5 z-[1050] inline-flex h-28 w-28 items-center justify-center bg-transparent text-white transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:bottom-7 sm:right-7 sm:h-36 sm:w-36 ${
            isPageLoading ? "pointer-events-none opacity-0" : ""
          }`}
          aria-label="Open ChatBot"
          disabled={isPageLoading}
        >
          <span className="relative inline-flex h-full w-full items-center justify-center">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-4 rounded-full bg-cyan-400/20 blur-2xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-6 rounded-full border border-cyan-300/35 shadow-[0_0_26px_rgba(34,211,238,0.5),0_0_46px_rgba(59,130,246,0.35)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-5 rounded-full border border-blue-300/30 opacity-80 motion-safe:animate-pulse"
            />
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
            >
              <source src="/Assets/Chatbot/Chatbot.webm" type="video/webm" />
            </video>
            <span className="absolute -top-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-cyan-200/30 bg-slate-900/90 px-2 py-1 text-[10px] font-semibold text-cyan-100 shadow-[0_8px_20px_rgba(0,0,0,.4)] sm:-top-7 sm:text-xs">
              <span className="text-[11px] sm:text-sm">💬</span>
              Chat tayo!
            </span>
          </span>
        </button>
      ) : null}

      <ChatBot open={chatBotOpen} onClose={() => setChatBotOpen(false)} />
    </main>
  );
};

export default LandingPage;
