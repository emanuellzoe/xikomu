// Landing markup for Xikomu Auto-Save (built on the Casa Flow template structure).
// Copy is themed to Xikomu; colors are Claude orange. IMAGE elements (<img src>) are
// intentionally kept as placeholders for the owner to replace with generated assets.
export const landingHtml = String.raw`
    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-stone-200/50">
        <div class="lg:px-8 flex h-20 max-w-7xl mr-auto ml-auto pr-6 pl-6 items-center justify-between">
            <div class="flex items-center gap-1 cursor-pointer">
                <span class="text-[#E8A07E] font-light tracking-widest text-2xl uppercase">Xiko</span>
                <div class="relative flex items-center">
                    <span class="text-[#C96442] font-normal text-2xl tracking-tight -ml-1">mu</span>
                    <div class="absolute -bottom-1 -right-2 w-8 h-0.5 bg-[#C96442]/60 rounded-full rotate-[-5deg]"></div>
                </div>
            </div>

            <div class="hidden md:flex items-center gap-8 text-lg font-light text-stone-500">
                <a href="#features-section" class="hover:text-stone-900 transition-colors">Features</a>
                <a href="#payment-section" class="hover:text-stone-900 transition-colors">How it Works</a>
                <a href="#faq" class="hover:text-stone-900 transition-colors">FAQ</a>
            </div>

            <div class="flex items-center gap-4">
                <button class="hidden md:flex items-center gap-2 text-lg font-normal text-stone-900 hover:text-stone-600 transition-colors">
                    Docs
                </button>
                <a href="/app" class="hover:bg-[#A84F2E] transition-all flex text-lg font-normal text-white bg-[#C96442] rounded-full pt-2.5 pr-5 pb-2.5 pl-5 gap-x-2 gap-y-2 items-center">Launch App</a>
            </div>
        </div>
    </nav>

    <main class="flex-grow pt-20">
        <!-- Hero Section -->
        <section class="lg:px-8 lg:pt-32 lg:pb-32 flex flex-col lg:flex-row gap-16 max-w-7xl mr-auto ml-auto pt-24 pr-6 pb-24 pl-6 relative gap-x-16 gap-y-16 items-center">

            <!-- Left: Content -->
            <div class="flex-1 w-full z-10 relative">
                <div class="inline-flex gap-2 bg-white/50 border-stone-200 border rounded-full mb-8 pt-1 pr-3 pb-1 pl-3 backdrop-blur-sm gap-x-2 gap-y-2 items-center">
                    <span class="w-2 h-2 rounded-full bg-[#E8A07E]"></span>
                    <span class="text-base font-normal text-stone-600">Automatic, non-custodial savings on Celo</span>
                </div>

                <h1 id="hero-heading" class="lg:text-8xl leading-[1.05] text-6xl tracking-tight mb-8 flex flex-col font-normal">
                    <span class="cta-bounce-enter block text-[#2C2B29] font-playfair">Save smart.</span>
                    <span class="cta-bounce-enter block text-[#D2754E] font-playfair">Stress less.</span>
                    <span class="cta-bounce-enter block font-playfair italic text-[#F0C2A6]">Xikomu.</span>
                </h1>

                <p class="leading-relaxed text-2xl font-light text-stone-500 font-montserrat max-w-2xl mb-10">Set a savings plan once and let an on-chain keeper move cUSD into your vault on schedule. Non-custodial, withdraw anytime &mdash; right inside MiniPay.</p>

                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <a href="/app" class="text-center hover:bg-[#A84F2E] transition-all sm:w-auto text-xl font-normal text-white bg-[#C96442] w-full rounded-full pt-4 pr-8 pb-4 pl-8 shadow-xl">Start Saving Free</a>
                    <a href="#payment-section" class="sm:w-auto hover:text-stone-900 transition-colors flex hover:border-stone-200 text-xl font-normal text-stone-600 w-full border-transparent border rounded-full pt-4 pr-8 pb-4 pl-8 gap-x-2 gap-y-2 items-center justify-center">See How It Works</a>
                </div>
            </div>

            <!-- Right: Architectural Pattern Visual -->
            <div class="flex-1 w-full max-w-lg lg:max-w-none relative aspect-square lg:aspect-[4/3] flex items-center justify-center">
                <div class="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" style="background-image: linear-gradient(to right, rgba(231, 229, 228, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(231, 229, 228, 0.4) 1px, transparent 1px); background-size: 4rem 4rem;"></div>

                <div id="svg-wrapper" class="relative w-full h-full flex items-center justify-center cursor-crosshair">
                    <svg viewBox="0 0 400 400" class="w-[120%] h-[120%] lg:w-[140%] lg:h-[140%] text-stone-200 drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">

                        <line x1="150" y1="0" x2="150" y2="175" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.00s;"></line>
                        <line x1="250" y1="40" x2="250" y2="120" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.05s;"></line>
                        <line x1="300" y1="80" x2="300" y2="200" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.10s;"></line>
                        <line x1="100" y1="100" x2="100" y2="260" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.15s;"></line>

                        <g transform="translate(200, 200)">
                            <polygon points="0,0 -50,-28.87 0,-57.74 50,-28.87" fill="#F5F5F4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.20s;"></polygon>
                            <polygon points="-50,-28.87 -50,28.87 0,57.74 0,0" fill="#FFFFFF" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.25s;"></polygon>
                            <polygon points="0,0 0,57.74 50,28.87 50,-28.87" fill="#E7E5E4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.30s;"></polygon>

                            <g transform="translate(-50, 86.6)">
                                <polygon points="0,0 -50,-28.87 0,-57.74 50,-28.87" fill="#FAFAFA" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.35s;"></polygon>
                                <polygon points="-50,-28.87 -50,28.87 0,57.74 0,0" fill="#F5F5F4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.40s;"></polygon>
                                <polygon points="0,0 0,57.74 50,28.87 50,-28.87" fill="#FFFFFF" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.45s;"></polygon>
                            </g>

                            <g transform="translate(100, 28.87)">
                                <polygon points="0,0 -50,-28.87 0,-57.74 50,-28.87" fill="#FFFFFF" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.50s;"></polygon>
                                <polygon points="-50,-28.87 -50,28.87 0,57.74 0,0" fill="#E7E5E4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.55s;"></polygon>
                                <polygon points="0,0 0,57.74 50,28.87 50,-28.87" fill="#F5F5F4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.60s;"></polygon>
                            </g>

                            <g transform="translate(50, -86.6)">
                                <polygon points="-50,-28.87 -50,28.87 0,57.74 0,0" fill="#F5F5F4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.65s;"></polygon>
                                <polygon points="0,0 0,57.74 50,28.87 50,-28.87" fill="#FFFFFF" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.70s;"></polygon>
                            </g>

                             <g transform="translate(-100, -28.87)">
                                <polygon points="0,0 -50,-28.87 0,-57.74 50,-28.87" fill="#FFFFFF" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.75s;"></polygon>
                                <polygon points="-50,-28.87 -50,28.87 0,57.74 0,0" fill="#FAFAFA" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.80s;"></polygon>
                                <polygon points="0,0 0,57.74 50,28.87 50,-28.87" fill="#E7E5E4" stroke="currentColor" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both, fadeInBlock 2s ease-out both; animation-delay: 0.85s;"></polygon>
                            </g>
                        </g>

                        <polyline points="50,258.87 100,287.74 150,258.87 150,201.13" fill="none" stroke-width="1" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.90s;"></polyline>
                        <polyline points="250,258.87 300,287.74 350,258.87 350,201.13" fill="none" stroke-width="1" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 0.95s;"></polyline>
                        <line x1="200" y1="257.74" x2="200" y2="350" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 1.00s;"></line>
                        <line x1="300" y1="287.74" x2="300" y2="380" stroke-width="1" class="text-stone-200" style="stroke-dasharray: 1000; animation: drawLine 2s ease-out both; animation-delay: 1.05s;"></line>
                    </svg>
                </div>
            </div>
        </section>

        <!-- Trust Marquee Section -->
        <div class="w-full bg-white border-y border-stone-200 py-3.5 overflow-hidden relative z-20 flex trust-marquee-container shadow-sm">
            <div class="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <div class="trust-marquee-content flex gap-8 sm:gap-14 shrink-0 px-4 sm:px-7 items-center">
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:verified-check-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Non-Custodial by Design</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:pie-chart-2-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Withdraw Anytime</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:box-minimalistic-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Verified on Celoscan</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:shield-check-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Open-Source Contract</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:calendar-date-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Save Daily or Weekly</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:routing-2-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Powered by cUSD</span></div>
            </div>

            <div class="trust-marquee-content flex gap-8 sm:gap-14 shrink-0 px-4 sm:px-7 items-center">
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:verified-check-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Non-Custodial by Design</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:pie-chart-2-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Withdraw Anytime</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:box-minimalistic-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Verified on Celoscan</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:shield-check-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Open-Source Contract</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:calendar-date-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Save Daily or Weekly</span></div>
                <div class="flex items-center gap-2.5 text-stone-600"><iconify-icon icon="solar:routing-2-linear" class="text-[#C96442] text-xl" stroke-width="1.5"></iconify-icon><span class="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-medium font-montserrat">Powered by cUSD</span></div>
            </div>
        </div>

        <!-- Dynamic Card Deck Spread Section -->
        <section id="features-section" class="h-[250vh] relative bg-[#FAFAFA] border-t border-stone-200 z-10">
            <div class="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-stone-100/50 blur-3xl rounded-full opacity-60 pointer-events-none"></div>

                <div id="features-heading" class="relative z-40 text-center mb-10 lg:mb-16 opacity-0 translate-y-8 will-change-transform max-w-4xl mx-auto">
                    <div class="inline-flex bg-white border-stone-200 border rounded-full mb-8 pt-1 pr-3 pb-1 pl-3 shadow-sm gap-x-2 items-center">
                        <span class="w-2 h-2 rounded-full bg-[#E8A07E]"></span>
                        <span class="text-sm font-normal text-stone-600">No Lock-Ups</span>
                        <span class="w-2 h-2 rounded-full bg-[#E8A07E]"></span>
                        <span class="text-sm font-normal text-stone-600">No Custody</span>
                    </div>

                    <h2 class="text-5xl lg:text-7xl leading-[1.05] tracking-tight flex flex-col font-normal items-center text-center">
                        <span class="font-playfair text-[#2C2B29]">Automated Savings</span>
                        <span class="font-playfair italic text-[#D2754E]">built on Celo</span>
                    </h2>
                </div>

                <div class="relative w-full max-w-[320px] sm:max-w-[360px] h-[380px] lg:h-[460px] z-30 perspective-normal mt-4 lg:mt-0">
                    <div id="feature-card-1" class="absolute inset-0 bg-white rounded-[2rem] p-8 lg:p-10 border border-stone-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col will-change-transform origin-bottom z-10">
                        <div class="w-14 h-14 rounded-2xl border border-stone-100 bg-[#FAFAFA] flex items-center justify-center mb-6 shadow-sm"><iconify-icon icon="solar:pen-new-square-linear" class="text-2xl text-[#C96442]"></iconify-icon></div>
                        <h3 class="text-2xl lg:text-3xl font-normal text-stone-900 tracking-tight mb-4 mt-auto">Set Your Plan</h3>
                        <p class="leading-relaxed text-sm lg:text-base text-stone-500 font-montserrat font-light">Choose an amount and an interval once, approve cUSD, and you are done. No reminders, no manual transfers.</p>
                    </div>

                    <div id="feature-card-3" class="absolute inset-0 bg-white rounded-[2rem] p-8 lg:p-10 border border-stone-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col will-change-transform origin-bottom z-20">
                        <div class="w-14 h-14 rounded-2xl border border-stone-100 bg-[#FAFAFA] flex items-center justify-center mb-6 shadow-sm"><iconify-icon icon="solar:wallet-money-linear" class="text-2xl text-[#C96442]"></iconify-icon></div>
                        <h3 class="text-2xl lg:text-3xl font-normal text-stone-900 tracking-tight mb-4 mt-auto">Withdraw Anytime</h3>
                        <p class="leading-relaxed text-sm lg:text-base text-stone-500 font-montserrat font-light">Your savings stay yours. Pull funds out whenever you like &mdash; withdrawals work even if saving is paused.</p>
                    </div>

                    <div id="feature-card-2" class="absolute inset-0 bg-[#2C2B29] rounded-[2rem] p-8 lg:p-10 border border-[#3A3936] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] flex flex-col will-change-transform origin-bottom z-30">
                        <div class="w-14 h-14 rounded-2xl border border-[#3A3936] bg-[#1F1E1D] flex items-center justify-center mb-6 shadow-inner"><iconify-icon icon="solar:bolt-circle-linear" class="text-2xl text-[#E8A07E]"></iconify-icon></div>
                        <h3 class="text-2xl lg:text-3xl font-normal text-white tracking-tight mb-4 mt-auto">Keeper on Autopilot</h3>
                        <p class="leading-relaxed text-sm lg:text-base text-stone-300 font-montserrat font-light">A deterministic keeper bot executes your scheduled saves on-chain. No price guessing &mdash; just steady, automatic progress.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Parallax Gallery Section -->
        <section id="collections" class="relative h-[250vh] bg-[#161514] border-y border-[#2C2B29]">
            <div class="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
                <div class="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2C2B29]/30 via-[#161514] to-[#11100F] absolute top-0 right-0 bottom-0 left-0"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E8A07E]/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div id="gallery-content-wrapper" class="relative z-20 text-center p-8 lg:p-14 rounded-3xl bg-[#2C2B29]/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] max-w-2xl mx-6">
                    <span class="cta-bounce-enter uppercase block text-sm font-semibold text-[#E8A07E] tracking-[0.2em] font-montserrat mb-6">Your Money, On-Chain</span>
                    <h2 class="text-5xl lg:text-7xl leading-[1.05] tracking-tight mb-8 flex flex-col font-normal items-center">
                        <span class="cta-bounce-enter block text-white font-playfair">Save steadily.</span>
                        <span class="cta-bounce-enter block text-[#E8A07E] font-playfair">Track on-chain.</span>
                        <span class="cta-bounce-enter block font-playfair italic text-[#C96442]">Withdraw freely.</span>
                    </h2>
                    <p class="cta-bounce-enter text-xl lg:text-2xl text-stone-300 font-montserrat font-light leading-relaxed max-w-lg mx-auto">Every save is a real on-chain transaction on Celo &mdash; transparent, verifiable, and always under your control.</p>
                </div>

                <div class="parallax-item absolute w-64 lg:w-80 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-10" style="top: -5%; left: 8%;" data-speed="0.8" data-rotation="-6deg"><img src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[4/5]"></div>
                <div class="parallax-item absolute w-60 lg:w-72 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-30 hidden md:block" style="top: 15%; right: 12%;" data-speed="0.6" data-rotation="4deg"><img src="https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-video"></div>
                <div class="parallax-item absolute w-40 lg:w-56 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-0" style="top: 80%; left: 30%;" data-speed="-0.5" data-rotation="-3deg"><img src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-square"></div>
                <div class="parallax-item absolute w-52 lg:w-64 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-0 hidden lg:block" style="top: 90%; right: 28%;" data-speed="-0.7" data-rotation="5deg"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[4/5]"></div>
                <div class="parallax-item absolute w-48 lg:w-64 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-10" style="top: 75%; left: 45%;" data-speed="-0.3" data-rotation="-2deg"><img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[4/3]"></div>
                <div class="parallax-item absolute w-56 lg:w-72 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-30 hidden sm:block" style="top: -15%; left: 2%;" data-speed="1.2" data-rotation="8deg"><img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[3/4]"></div>
                <div class="parallax-item absolute w-40 lg:w-56 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-10 hidden md:block" style="top: 0%; left: 65%;" data-speed="0.9" data-rotation="-7deg"><img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-square"></div>
                <div class="parallax-item absolute w-52 lg:w-64 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-40" style="top: -20%; right: 8%;" data-speed="1.5" data-rotation="3deg"><img src="https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[4/5]"></div>
                <div class="parallax-item absolute w-48 lg:w-60 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-10 hidden lg:block" style="top: 110%; right: -2%;" data-speed="-1.1" data-rotation="-5deg"><img src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-video"></div>
                <div class="parallax-item absolute w-44 lg:w-56 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-20 hidden sm:block" style="top: -10%; right: 25%;" data-speed="1.3" data-rotation="6deg"><img src="https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-square"></div>
                <div class="parallax-item absolute w-48 lg:w-64 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-30 hidden md:block" style="top: 120%; left: 15%;" data-speed="-1.5" data-rotation="-10deg"><img src="https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-square"></div>
                <div class="parallax-item absolute w-32 lg:w-48 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-10" style="top: 5%; right: 40%;" data-speed="0.5" data-rotation="12deg"><img src="https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[3/4]"></div>
                <div class="parallax-item absolute w-40 lg:w-56 p-2 bg-[#2C2B29]/30 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl will-change-transform z-0" style="top: 95%; right: 40%;" data-speed="-0.9" data-rotation="3deg"><img src="https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=800" alt="Placeholder" class="w-full h-auto rounded-xl object-cover aspect-[4/5]"></div>
            </div>
        </section>

        <!-- Dynamic Live Savings Plan Section -->
        <section id="payment-section" class="h-[350vh] relative bg-[#FAFAFA] border-t border-stone-200 z-10">
            <div class="sticky top-0 min-h-screen py-24 flex flex-col justify-center overflow-hidden w-full">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[80px] opacity-60 pointer-events-none"></div>

                <div class="max-w-7xl w-full mx-auto px-6 lg:px-8 relative z-10">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                        <div class="order-2 lg:order-1" id="live-quote-text-content">
                            <div class="cta-bounce-enter inline-flex items-center gap-2 mb-6">
                                <iconify-icon icon="solar:calculator-minimalistic-linear" class="text-3xl text-[#C96442]" stroke-width="1.5"></iconify-icon>
                                <span class="uppercase text-xs font-medium tracking-widest text-[#C96442] font-montserrat">Live Savings Plan</span>
                            </div>

                            <h2 class="text-5xl lg:text-6xl font-normal mb-8 leading-[1.05] tracking-tight flex flex-col">
                                <span class="cta-bounce-enter block text-[#2C2B29] font-playfair">Save now.</span>
                                <span class="cta-bounce-enter block text-[#D2754E] font-playfair">Grow at your</span>
                                <span class="cta-bounce-enter block font-playfair italic text-[#F0C2A6]">own pace.</span>
                            </h2>

                            <p class="cta-bounce-enter text-xl text-stone-500 font-light leading-relaxed mb-10 font-montserrat">Setting up takes seconds: pick an amount and how often to save. Your keeper handles the rest, moving cUSD into your vault on schedule &mdash; and your balance is always withdrawable.</p>

                            <ul class="space-y-4 mb-10 text-stone-600">
                                <li class="cta-bounce-enter tick-item flex items-center gap-3"><iconify-icon icon="solar:check-circle-linear" class="text-[#C96442] text-2xl" stroke-width="1.5"></iconify-icon><span class="text-lg font-light font-montserrat">Non-custodial &mdash; funds are always yours</span></li>
                                <li class="cta-bounce-enter tick-item flex items-center gap-3"><iconify-icon icon="solar:check-circle-linear" class="text-[#C96442] text-2xl" stroke-width="1.5"></iconify-icon><span class="text-lg font-light font-montserrat">Reentrancy-guarded smart contract</span></li>
                                <li class="cta-bounce-enter tick-item flex items-center gap-3"><iconify-icon icon="solar:check-circle-linear" class="text-[#C96442] text-2xl" stroke-width="1.5"></iconify-icon><span class="text-lg font-light font-montserrat">Save daily, weekly, or a custom interval</span></li>
                            </ul>
                        </div>

                        <div class="order-1 lg:order-2 relative" id="invoice-section">
                            <div class="bg-white/80 backdrop-blur-2xl border border-stone-200 rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col h-[550px]">

                                <div id="quote-header" class="bg-[#F5F4F2] p-6 border-b border-stone-200 flex justify-between items-end relative z-30 shadow-sm opacity-0 will-change-transform">
                                    <div><p class="text-xs font-medium tracking-widest uppercase text-stone-500 mb-1">Plan #XK-2026</p><h3 class="text-2xl font-normal text-stone-900 tracking-tight">My Auto-Save</h3></div>
                                    <div class="text-right"><p class="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">Saved So Far</p><p class="text-xl font-normal text-stone-900 tracking-tight">145 cUSD</p></div>
                                </div>

                                <div class="flex-1 relative overflow-hidden bg-white/30" id="mockup-viewport">
                                    <div id="mockup-scroll-content" class="absolute top-0 left-0 w-full p-6 pb-6 flex flex-col gap-4 will-change-transform">

                                        <div class="checkout-anim-item opacity-0 flex gap-4 items-center p-3 rounded-2xl bg-white border border-stone-100 shadow-sm" data-anim="left">
                                            <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=150&h=150&fit=crop" alt="Placeholder" class="w-full h-full object-cover"></div>
                                            <div class="flex-1"><h4 class="font-normal text-stone-900 text-base tracking-tight">Daily Auto-Save</h4><p class="text-sm text-stone-500 mt-0.5 font-light">Executed by keeper</p></div>
                                            <div class="text-right"><p class="text-base font-normal text-stone-900 tracking-tight">+5 cUSD</p></div>
                                        </div>

                                        <div class="checkout-anim-item opacity-0 flex gap-4 items-center p-3 rounded-2xl bg-white border border-stone-100 shadow-sm" data-anim="right">
                                            <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=150&h=150&fit=crop" alt="Placeholder" class="w-full h-full object-cover"></div>
                                            <div class="flex-1"><h4 class="font-normal text-stone-900 text-base tracking-tight">Daily Auto-Save</h4><p class="text-sm text-stone-500 mt-0.5 font-light">Executed by keeper</p></div>
                                            <div class="text-right"><p class="text-base font-normal text-stone-900 tracking-tight">+5 cUSD</p></div>
                                        </div>

                                        <div id="fast-stack-container" class="flex flex-col mt-2 px-1">
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-24 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-8 bg-stone-100 rounded-full"></div></div>
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-32 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-10 bg-stone-100 rounded-full"></div></div>
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-20 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-12 bg-stone-100 rounded-full"></div></div>
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-28 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-8 bg-stone-100 rounded-full"></div></div>
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-24 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-10 bg-stone-100 rounded-full"></div></div>
                                            <div class="fast-item opacity-0 flex items-center gap-3 p-2 bg-white rounded-xl border border-stone-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"><div class="w-8 h-8 bg-[#F5F4F2] rounded-lg border border-stone-200 flex items-center justify-center text-stone-400"><iconify-icon icon="solar:dollar-minimalistic-linear" class="text-sm"></iconify-icon></div><div class="h-2 w-20 bg-stone-100 rounded-full"></div><div class="flex-1"></div><div class="h-2 w-8 bg-stone-100 rounded-full"></div></div>
                                        </div>

                                        <div class="checkout-anim-item opacity-0 flex gap-4 items-center p-3 rounded-2xl bg-white border border-stone-100 shadow-sm relative z-10" data-anim="summary">
                                            <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAFAFA] flex items-center justify-center text-[#C96442] border border-stone-200"><iconify-icon icon="solar:layers-linear" class="text-2xl" stroke-width="1.5"></iconify-icon></div>
                                            <div class="flex-1"><h4 class="font-normal text-stone-900 text-base tracking-tight">+ 24 more saves</h4><p class="text-sm text-stone-500 mt-0.5 font-light">This month</p></div>
                                            <div class="text-right"><p class="text-base font-normal text-stone-900 tracking-tight">+120 cUSD</p></div>
                                        </div>

                                        <div class="mt-8 relative pt-2 pb-2" id="milestones-container">
                                            <div class="absolute left-6 top-4 bottom-8 w-px bg-stone-200"><div id="milestone-progress-line" class="w-full bg-[#C96442] h-0 origin-top"></div></div>

                                            <div class="milestone pl-16 relative mb-12" id="m1">
                                                <div class="absolute left-[8px] top-0 w-8 h-8 rounded-full border-2 border-stone-200 bg-white milestone-dot z-10 flex items-center justify-center text-stone-400 shadow-sm"><iconify-icon icon="solar:add-circle-linear" class="text-lg" stroke-width="1.5"></iconify-icon></div>
                                                <div class="milestone-content"><span class="inline-block text-[10px] font-bold tracking-widest uppercase text-stone-500 bg-stone-200 rounded-full px-2.5 py-0.5 mb-1.5 milestone-badge">Day 1</span><h4 class="text-xl text-stone-900 font-normal tracking-tight mt-0.5">Plan Created</h4></div>
                                            </div>

                                            <div class="milestone pl-16 relative mb-12" id="m2">
                                                <div class="absolute left-[8px] top-0 w-8 h-8 rounded-full border-2 border-stone-200 bg-white milestone-dot z-10 flex items-center justify-center text-stone-400 shadow-sm"><iconify-icon icon="solar:refresh-circle-linear" class="text-lg" stroke-width="1.5"></iconify-icon></div>
                                                <div class="milestone-content"><span class="inline-block text-[10px] font-bold tracking-widest uppercase text-stone-500 bg-stone-200 rounded-full px-2.5 py-0.5 mb-1.5 milestone-badge">Ongoing</span><h4 class="text-xl text-stone-900 font-normal tracking-tight mt-0.5">Keeper Saves Daily</h4></div>
                                            </div>

                                            <div class="milestone pl-16 relative" id="m3">
                                                <div class="absolute left-[8px] top-0 w-8 h-8 rounded-full border-2 border-stone-200 bg-white milestone-dot z-10 flex items-center justify-center text-stone-400 shadow-sm"><iconify-icon icon="solar:wallet-linear" class="text-lg" stroke-width="1.5"></iconify-icon></div>
                                                <div class="milestone-content" style="perspective: 1000px;">
                                                    <span class="inline-block text-[10px] font-bold tracking-widest uppercase text-stone-500 bg-stone-200 rounded-full px-2.5 py-0.5 mb-1.5 milestone-badge">Anytime</span>
                                                    <h4 class="text-xl text-stone-900 font-normal tracking-tight mt-0.5">Withdraw Your Savings</h4>

                                                    <div class="finance-card-wrapper mt-5">
                                                        <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-xl relative cursor-default flex flex-col gap-6">
                                                            <div class="flex justify-between items-start">
                                                                <div><p class="text-sm text-stone-500 font-light hidden">Daily save</p><h4 class="font-normal text-stone-900 tracking-tight text-lg mt-1">1 cUSD / day</h4></div>
                                                                <div class="text-right"><p class="text-xs font-medium text-[#C96442] uppercase tracking-widest mb-1">Projected</p><div class="text-2xl font-normal text-stone-900 tracking-tight" id="completion-price">1,800 cUSD</div></div>
                                                            </div>

                                                            <div class="flex flex-col gap-3">
                                                                <input type="range" min="0" max="60" value="60" class="w-full relative z-10" id="finance-slider">
                                                                <div class="flex justify-between w-full text-[10px] sm:text-xs text-stone-400 font-medium uppercase tracking-widest items-center"><span>Start</span><span id="months-display" class="text-stone-700 bg-[#F5F4F2] px-2 py-1 rounded-md border border-stone-200 font-normal shadow-sm tracking-widest">60 MONTHS</span></div>
                                                            </div>

                                                            <button class="w-full bg-[#C96442] text-white py-3.5 rounded-xl font-normal tracking-widest uppercase text-sm hover:bg-[#A84F2E] transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(201,100,66,0.3)] hover:shadow-[0_6px_16px_rgba(28,25,23,0.4)] transform hover:-translate-y-0.5 duration-300 group">Start This Plan<iconify-icon icon="solar:arrow-right-linear" class="text-lg group-hover:translate-x-1 transition-transform" stroke-width="1.5"></iconify-icon></button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    <div id="bottom-gradient" class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/95 to-transparent pointer-events-none z-20 transition-opacity duration-300 ease-out"></div>
                                </div>
                            </div>

                            <div class="absolute -bottom-10 -left-10 w-full h-full bg-[#E7E5E4]/60 rounded-[2rem] -z-10 transform -rotate-3 blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section id="faq" class="relative py-24 lg:py-32 bg-[#FAFAFA] border-t border-stone-200 overflow-hidden">
            <div class="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16 lg:mb-24">
                <div class="inline-flex items-center justify-center gap-3 mb-6">
                    <div class="w-7 h-7 rounded-full border border-[#D2754E] flex items-center justify-center text-[#D2754E]"><span class="text-sm font-light mt-0.5">?</span></div>
                    <span class="uppercase text-xs font-medium tracking-[0.2em] text-[#D2754E] font-montserrat">FAQ</span>
                </div>
                <h2 class="text-6xl lg:text-7xl font-normal tracking-tight mb-8"><span class="text-[#2C2B29] font-playfair">Frequently Asked </span><span class="font-instrument-serif italic text-[#D2754E]">Questions</span></h2>
                <p class="text-xl text-[#C96442] font-montserrat font-light max-w-3xl mx-auto leading-relaxed">Everything you need to know about saving automatically with Xikomu &mdash; how it works, whether it is safe, and how to get your money out.</p>
            </div>

            <div class="faq-scene relative w-full max-w-6xl mx-auto h-[480px] sm:h-[550px] flex items-center justify-center">
                <button id="faq-prev" class="absolute left-2 sm:left-10 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#C96442]/50"><iconify-icon icon="solar:arrow-left-linear" class="text-2xl"></iconify-icon></button>
                <button id="faq-next" class="absolute right-2 sm:right-10 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#C96442]/50"><iconify-icon icon="solar:arrow-right-linear" class="text-2xl"></iconify-icon></button>

                <div id="faq-carousel" class="faq-carousel w-[280px] sm:w-[360px] h-[400px] sm:h-[480px] relative z-20">
                    <div class="faq-card-wrapper group is-active">
                        <div class="faq-card-inner">
                            <div class="faq-card-front bg-white/60 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-8 text-center pulse-glow-wheel"><iconify-icon icon="solar:bolt-circle-linear" class="text-4xl text-[#E8A07E] mb-6"></iconify-icon><h3 class="text-2xl sm:text-3xl font-playfair text-[#2C2B29] leading-snug">How does automatic saving work?</h3><div class="absolute bottom-6 text-xs text-[#C96442] font-montserrat tracking-widest uppercase flex items-center gap-2">Tap to reveal <iconify-icon icon="solar:refresh-linear" class="text-sm"></iconify-icon></div></div>
                            <div class="faq-card-back bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80" alt="Placeholder" class="absolute inset-0 w-full h-full object-cover z-0"><div class="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/40 z-10"></div><div class="relative z-20 p-6 sm:p-8 h-full flex flex-col"><h4 class="text-xl font-playfair text-white mb-4 border-b border-white/20 pb-4 shrink-0">How it works</h4><div class="overflow-y-auto hide-scrollbar flex-1 pb-2"><p class="text-sm sm:text-base text-stone-200 font-montserrat font-light leading-relaxed">You set an amount and an interval once and approve cUSD. A deterministic keeper bot then calls your vault on schedule, moving funds from your wallet into your personal balance &mdash; no manual action needed, no price guessing.</p></div></div></div>
                        </div>
                    </div>

                    <div class="faq-card-wrapper group">
                        <div class="faq-card-inner">
                            <div class="faq-card-front bg-white/60 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-8 text-center pulse-glow-wheel"><iconify-icon icon="solar:shield-check-linear" class="text-4xl text-[#E8A07E] mb-6"></iconify-icon><h3 class="text-2xl sm:text-3xl font-playfair text-[#2C2B29] leading-snug">Is it safe? Can anyone take my funds?</h3><div class="absolute bottom-6 text-xs text-[#C96442] font-montserrat tracking-widest uppercase flex items-center gap-2">Tap to reveal <iconify-icon icon="solar:refresh-linear" class="text-sm"></iconify-icon></div></div>
                            <div class="faq-card-back bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end"><img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80" alt="Placeholder" class="absolute inset-0 w-full h-full object-cover z-0"><div class="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/40 z-10"></div><div class="relative z-20 p-6 sm:p-8 h-full flex flex-col"><h4 class="text-xl font-playfair text-white mb-4 border-b border-white/20 pb-4 shrink-0">Security</h4><div class="overflow-y-auto hide-scrollbar flex-1 pb-2"><p class="text-sm sm:text-base text-stone-200 font-montserrat font-light leading-relaxed">No. Xikomu is non-custodial and the contract is immutable. Funds only ever move from your wallet into your own balance, withdrawable only by you. Withdrawals work even if saving is paused &mdash; no one can lock or drain your savings.</p></div></div></div>
                        </div>
                    </div>

                    <div class="faq-card-wrapper group">
                        <div class="faq-card-inner">
                            <div class="faq-card-front bg-white/60 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-8 text-center pulse-glow-wheel"><iconify-icon icon="solar:refresh-linear" class="text-4xl text-[#E8A07E] mb-6"></iconify-icon><h3 class="text-2xl sm:text-3xl font-playfair text-[#2C2B29] leading-snug">Can I withdraw or change my plan anytime?</h3><div class="absolute bottom-6 text-xs text-[#C96442] font-montserrat tracking-widest uppercase flex items-center gap-2">Tap to reveal <iconify-icon icon="solar:refresh-linear" class="text-sm"></iconify-icon></div></div>
                            <div class="faq-card-back bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end"><img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80" alt="Placeholder" class="absolute inset-0 w-full h-full object-cover z-0"><div class="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/40 z-10"></div><div class="relative z-20 p-6 sm:p-8 h-full flex flex-col"><h4 class="text-xl font-playfair text-white mb-4 border-b border-white/20 pb-4 shrink-0">Flexibility</h4><div class="overflow-y-auto hide-scrollbar flex-1 pb-2"><p class="text-sm sm:text-base text-stone-200 font-montserrat font-light leading-relaxed">Yes. Withdraw any amount whenever you want, and update or cancel your plan at any time. You stay fully in control from the first save to the last.</p></div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-12 text-[#C96442] font-montserrat text-sm tracking-widest uppercase flex items-center justify-center gap-2 lg:hidden"><iconify-icon icon="solar:hand-swipe-linear" class="text-lg"></iconify-icon> Swipe to rotate</div>
        </section>

        <!-- CTA Section -->
        <section class="lg:py-32 bg-white border-stone-200 border-t pt-24 pb-24 overflow-hidden relative">
            <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 id="cta-heading" class="lg:text-7xl xl:text-8xl leading-[1.05] text-5xl tracking-tight mb-12 flex flex-col font-normal items-center text-center w-full">
                    <span class="cta-bounce-enter block text-[#2C2B29] font-playfair">Set it once.</span>
                    <span class="font-playfair text-[#D2754E] cta-bounce-enter block">Save on autopilot.</span>
                    <span class="font-playfair italic text-[#F0C2A6] cta-bounce-enter block">Xikomu does the rest.</span>
                </h2>
                <p class="text-2xl text-stone-500 max-w-2xl mr-auto mb-12 ml-auto font-light">Start your first auto-save plan today &mdash; non-custodial, on Celo, right inside MiniPay.</p>
                <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <a href="/app" class="sm:w-auto hover:bg-[#A84F2E] transition-colors flex btn-pulse text-xl font-normal text-white bg-[#C96442] w-full rounded-full pt-4 pr-8 pb-4 pl-8 relative gap-x-2 gap-y-2 items-center justify-center">Start Saving</a>
                    <button class="sm:w-auto hover:bg-stone-50 transition-all flex text-xl font-normal text-stone-900 bg-white w-full border-stone-200 border rounded-full pt-4 pr-8 pb-4 pl-8 gap-x-2 gap-y-2 items-center justify-center">Learn More</button>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="bg-[#FAFAFA] border-t border-stone-200 pt-16 pb-8">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div class="col-span-2 md:col-span-1">
                    <div class="flex items-center gap-1 mb-6"><span class="text-[#E8A07E] font-extralight tracking-widest text-xl uppercase">Xiko</span><span class="text-[#C96442] font-normal text-xl tracking-tight -ml-1">mu</span></div>
                    <p class="text-lg text-stone-500 max-w-xs font-light">Automatic, non-custodial savings on Celo.</p>
                </div>
                <div><h4 class="text-base font-normal text-stone-900 mb-4 tracking-tight">Product</h4><ul class="space-y-3 text-lg font-light text-stone-500"><li><a href="#features-section" class="hover:text-stone-900 transition-colors">Features</a></li><li><a href="#payment-section" class="hover:text-stone-900 transition-colors">How it Works</a></li></ul></div>
                <div><h4 class="text-base font-normal text-stone-900 mb-4 tracking-tight">Project</h4><ul class="space-y-3 text-lg font-light text-stone-500"><li><a href="https://github.com/emanuellzoe/xikomu" class="hover:text-stone-900 transition-colors">GitHub</a></li><li><a href="#faq" class="hover:text-stone-900 transition-colors">FAQ</a></li></ul></div>
                <div><h4 class="text-base font-normal text-stone-900 mb-4 tracking-tight">Legal</h4><ul class="space-y-3 text-lg font-light text-stone-500"><li><a href="#" class="hover:text-stone-900 transition-colors">Privacy Policy</a></li><li><a href="#" class="hover:text-stone-900 transition-colors">Terms of Service</a></li></ul></div>
            </div>
            <div class="border-t border-stone-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <p class="text-lg font-light text-stone-400">&copy; 2026 Xikomu. All rights reserved.</p>
                <div class="flex items-center gap-4 text-stone-400"><a href="#" class="hover:text-stone-900 transition-colors"><i data-lucide="twitter" stroke-width="1.5" class="w-6 h-6"></i></a><a href="#" class="hover:text-stone-900 transition-colors"><i data-lucide="github" stroke-width="1.5" class="w-6 h-6"></i></a></div>
            </div>
        </div>
    </footer>
`;
