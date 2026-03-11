export default function Footer() {
  return (
    <footer className="py-10 px-10 border-t border-[rgba(0,0,0,0.1)] text-center space-y-4">
      <div className="flex items-center justify-center gap-4 text-[13px]">
        <a 
          href="#documentation" 
          className="font-roos text-[#333] hover:text-[#1a1a1a] transition-colors"
        >
          Read the Documentation
        </a>
        <span className="text-[rgba(0,0,0,0.2)]">|</span>
        <a 
          href="https://twitter.com/council_agi" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-roos text-[#333] hover:text-[#1a1a1a] transition-colors"
        >
          Follow @council_agi ↗
        </a>
      </div>
      
      <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[#444]">
        $council — ca: 4hRfJMBxA794NNduLtpJSeLSEq51zVxU6Gevw1LQpump
      </p>
      
      <p className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">
        Council Platform · AI Entity Communication System
      </p>
    </footer>
  );
}
