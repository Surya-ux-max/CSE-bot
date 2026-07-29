import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const DEFAULT_ITEMS = [
  {
    label: 'Joyful Learning',
    href: '#',
    ariaLabel: 'Joyful Learning',
    rotation: -4,
    hoverStyles: { bgColor: '#ffc815', textColor: '#000000' }
  },
  {
    label: 'Instant Search',
    href: '#',
    ariaLabel: 'Instant Search',
    rotation: 4,
    hoverStyles: { bgColor: '#f05030', textColor: '#ffffff' }
  },
  {
    label: 'SIH Radar',
    href: '#',
    ariaLabel: 'SIH Radar',
    rotation: -4,
    hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
  },
  {
    label: 'Smart Sync',
    href: '#',
    ariaLabel: 'Smart Sync',
    rotation: 4,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
  },
  {
    label: 'Department AI',
    href: '#',
    ariaLabel: 'Department AI',
    rotation: -4,
    hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
  }
];

export default function BubbleMenu({
  logo,
  onMenuClick,
  className,
  style,
  menuAriaLabel = 'Toggle menu',
  menuBg = '#fff',
  menuContentColor = '#111',
  useFixedPosition = false,
  items,
  animationEase = 'back.out(1.5)',
  animationDuration = 0.5,
  staggerDelay = 0.12
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const overlayRef = useRef(null);
  const bubblesRef = useRef([]);
  const labelRefs = useRef([]);

  const menuItems = items?.length ? items : DEFAULT_ITEMS;

  const containerClassName = [
    'bubble-menu',
    useFixedPosition ? 'fixed' : 'relative',
    'w-full',
    'flex items-center justify-between',
    'gap-4 px-6 py-4',
    'pointer-events-none',
    'z-[1001]',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const handleToggle = () => {
    const nextState = !isMenuOpen;
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    onMenuClick?.(nextState);
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!overlay || !bubbles.length) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: 'flex' });
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { y: 24, autoAlpha: 0 });

      bubbles.forEach((bubble, i) => {
        const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);
        const tl = gsap.timeline({ delay });
        tl.to(bubble, {
          scale: 1,
          duration: animationDuration,
          ease: animationEase
        });
        if (labels[i]) {
          tl.to(
            labels[i],
            {
              y: 0,
              autoAlpha: 1,
              duration: animationDuration,
              ease: 'power3.out'
            },
            '-=' + animationDuration * 0.9
          );
        }
      });
    } else if (showOverlay) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, {
        y: 24,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power3.in'
      });
      gsap.to(bubbles, {
        scale: 0,
        duration: 0.2,
        ease: 'power3.in',
        onComplete: () => {
          gsap.set(overlay, { display: 'none' });
          setShowOverlay(false);
        }
      });
    }
  }, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay]);

  useEffect(() => {
    const handleResize = () => {
      if (isMenuOpen) {
        const bubbles = bubblesRef.current.filter(Boolean);
        const isDesktop = window.innerWidth >= 900;
        bubbles.forEach((bubble, i) => {
          const item = menuItems[i];
          if (bubble && item) {
            const rotation = isDesktop ? (item.rotation ?? 0) : 0;
            gsap.set(bubble, { rotation });
          }
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, menuItems]);

  return (
    <div className={`relative w-full rounded-3xl bg-theme-card border-2 border-black p-4 shadow-[4px_4px_0_0_#000] transition-all duration-300 ${showOverlay || isMenuOpen ? 'min-h-[380px] sm:min-h-[420px]' : 'min-h-[85px]'}`}>
      {/* Inline styles for GSAP BubbleMenu */}
      <style>{`
        .bubble-menu .menu-line {
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform-origin: center;
        }
        @media (min-width: 900px) {
          .bubble-menu-items .pill-link {
            transform: rotate(var(--item-rot));
          }
          .bubble-menu-items .pill-link:hover {
            transform: rotate(var(--item-rot)) scale(1.06);
            background: var(--hover-bg) !important;
            color: var(--hover-color) !important;
          }
          .bubble-menu-items .pill-link:active {
            transform: rotate(var(--item-rot)) scale(.94);
          }
        }
        @media (max-width: 899px) {
          .bubble-menu-items {
            padding-top: 75px;
            align-items: flex-start;
          }
          .bubble-menu-items .pill-list {
            row-gap: 12px;
          }
          .bubble-menu-items .pill-list .pill-col {
            flex: 0 0 100% !important;
            margin-left: 0 !important;
          }
          .bubble-menu-items .pill-link {
            font-size: 1.1rem;
            min-height: 55px !important;
          }
          .bubble-menu-items .pill-link:hover {
            transform: scale(1.04);
            background: var(--hover-bg);
            color: var(--hover-color);
          }
        }
      `}</style>

      <nav className={containerClassName} style={style} aria-label="Main navigation">
        <div
          className={[
            'bubble logo-bubble',
            'inline-flex items-center justify-center',
            'rounded-full',
            'bg-white',
            'border-2 border-black',
            'shadow-[2px_2px_0_0_#000]',
            'pointer-events-auto',
            'h-12 md:h-14',
            'px-4 md:px-8',
            'gap-2',
            'will-change-transform'
          ].join(' ')}
          aria-label="Logo"
          style={{
            background: menuBg,
            minHeight: '48px',
            borderRadius: '9999px'
          }}
        >
          <span
            className={['logo-content', 'inline-flex items-center justify-center', 'h-full', 'font-black text-black text-xs sm:text-sm tracking-wider'].join(' ')}
          >
            {typeof logo === 'string' ? (
              <img src={logo} alt="Logo" className="bubble-logo max-h-[60%] max-w-full object-contain block" />
            ) : (
              logo || <span className="font-mono font-bold text-xs uppercase text-black">🚀 Joy of Learning CSE-Bot</span>
            )}
          </span>
        </div>

        <button
          type="button"
          className={[
            'bubble toggle-bubble menu-btn',
            isMenuOpen ? 'open' : '',
            'inline-flex flex-col items-center justify-center',
            'rounded-full',
            'bg-[#ffc815]',
            'border-2 border-black',
            'shadow-[2px_2px_0_0_#000]',
            'pointer-events-auto',
            'w-12 h-12 md:w-14 md:h-14',
            'cursor-pointer p-0',
            'will-change-transform'
          ].join(' ')}
          onClick={handleToggle}
          aria-label={menuAriaLabel}
          aria-pressed={isMenuOpen}
        >
          <span
            className="menu-line block mx-auto rounded-[2px]"
            style={{
              width: 24,
              height: 2.5,
              background: '#000',
              transform: isMenuOpen ? 'translateY(4px) rotate(45deg)' : 'none'
            }}
          />
          <span
            className="menu-line short block mx-auto rounded-[2px]"
            style={{
              marginTop: '5px',
              width: 24,
              height: 2.5,
              background: '#000',
              transform: isMenuOpen ? 'translateY(-4px) rotate(-45deg)' : 'none'
            }}
          />
        </button>
      </nav>

      {showOverlay && (
        <div
          ref={overlayRef}
          className={[
            'bubble-menu-items',
            'absolute',
            'inset-0',
            'flex items-center justify-center',
            'pointer-events-none',
            'bg-black/60 backdrop-blur-md rounded-3xl pt-20 pb-6 px-6',
            'z-[1000]'
          ].join(' ')}
          aria-hidden={!isMenuOpen}
        >
          <ul
            className={[
              'pill-list',
              'list-none m-0 p-0',
              'w-full max-w-[1000px] mx-auto',
              'flex flex-wrap items-center justify-center',
              'gap-3 sm:gap-4',
              'pointer-events-auto'
            ].join(' ')}
            role="menu"
            aria-label="Menu links"
          >
            {menuItems.map((item, idx) => (
              <li
                key={idx}
                role="none"
                className={[
                  'pill-col',
                  'flex justify-center items-stretch',
                  'sm:flex-[0_0_calc(100%/3-1rem)] flex-[0_0_100%]',
                  'box-border'
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    item.onClick?.();
                  }}
                  aria-label={item.ariaLabel || item.label}
                  className={[
                    'pill-link',
                    'w-full',
                    'rounded-2xl',
                    'no-underline',
                    'bg-white',
                    'text-black border-2 border-black',
                    'shadow-[3px_3px_0_0_#000]',
                    'flex items-center justify-center font-bold font-display',
                    'relative',
                    'transition-all duration-300 ease-in-out',
                    'box-border',
                    'whitespace-nowrap overflow-hidden cursor-pointer'
                  ].join(' ')}
                  style={{
                    ['--item-rot']: `${item.rotation ?? 0}deg`,
                    ['--pill-bg']: menuBg,
                    ['--pill-color']: menuContentColor,
                    ['--hover-bg']: item.hoverStyles?.bgColor || '#ffc815',
                    ['--hover-color']: item.hoverStyles?.textColor || '#000000',
                    background: 'var(--pill-bg)',
                    color: 'var(--pill-color)',
                    minHeight: '65px',
                    padding: '0.85rem 1.25rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    willChange: 'transform'
                  }}
                  ref={el => {
                    if (el) bubblesRef.current[idx] = el;
                  }}
                >
                  <span
                    className="pill-label inline-block tracking-tight"
                    ref={el => {
                      if (el) labelRefs.current[idx] = el;
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
