'use client';

import { useEffect, useRef, useState } from 'react';
import './cover.css';
import { createCoverAnimation, type CoverAnimationHandle } from './coverAnimation';

export default function BahrainCover({ onEnter }: { onEnter: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<CoverAnimationHandle | null>(null);
  const [paused, setPaused] = useState(false);
  const [entering, setEntering] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = createCoverAnimation(canvas, img, reducedMotion);
    animRef.current = anim;
    return () => anim.destroy();
  }, []);

  function togglePause() {
    const next = !paused;
    setPaused(next);
    animRef.current?.setPaused(next);
  }

  function enter() {
    if (entering) return;
    setEntering(true);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stageRef.current?.classList.add('opening');
    animRef.current?.setActive(false);
    window.setTimeout(() => onEnter(), reducedMotion ? 0 : 1100);
  }

  return (
    <div className="bahrain-cover">
      <div className="cover-stage" ref={stageRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          className="cover-image"
          src="/assets/Bahrain-Cover.jpg"
          alt="Bahrain skyline at night with a crescent moon, a stationary aircraft and a red-lit airport control tower."
        />
        <canvas className="living-layer" ref={canvasRef} aria-hidden="true" />

        <div className="brand-mask">
          {logoOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/nbb-mark.png" alt="" onError={() => setLogoOk(false)} />
          )}
          <div>
            National Bank of Bahrain
            <small>Financial Crime Department</small>
          </div>
        </div>

        <div className="hero-copy">
          <h1>
            Every case.
            <br />
            <span className="red">A clear direction.</span>
          </h1>
          <div className="subtitle">Financial Crime Mission Control</div>
        </div>

        <button
          type="button"
          className="enter"
          aria-label="Enter the NBB financial crime workflow"
          onClick={enter}
          onMouseEnter={() => animRef.current?.setHover(true)}
          onMouseLeave={() => animRef.current?.setHover(false)}
          onFocus={() => animRef.current?.setHover(true)}
          onBlur={() => animRef.current?.setHover(false)}
        >
          Enter Mission Control <span className="arrow">→</span>
        </button>

        <div className="footer-strip">National Bank of Bahrain • Financial Crime Department</div>
      </div>

      <div className="controls">
        <button type="button" className="mobile-enter" onClick={enter}>
          Enter Mission Control →
        </button>
        <button type="button" onClick={togglePause}>
          {paused ? 'Play atmosphere' : 'Pause atmosphere'}
        </button>
        <span className="status">
          <i className="live-dot" />
          {paused ? 'Atmosphere paused' : 'Live atmosphere'}
        </span>
        <span className="note">Rain · Original runway lights pulsing · Moving control-room staff · Boat wake</span>
      </div>
    </div>
  );
}
