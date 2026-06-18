const Loading = () => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <img
          src="/Assets/dostlogo.png"
          alt="DOST logo"
          className="h-20 w-20 animate-pulse object-contain sm:h-24 sm:w-24"
          draggable={false}
        />
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 motion-safe:animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 motion-safe:animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 motion-safe:animate-bounce" />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/80">Loading data...</p>
      </div>
    </div>
  );
};

export default Loading;
