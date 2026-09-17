'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoverAtmosphere } from '@/lib/coverAnimation';
import styles from './Cover.module.css';

const ENTER_TRANSITION_MS = 1100;

export default function Cover() {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<CoverAtmosphere | null>(null);

  const [paused, setPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const atmosphere = new CoverAtmosphere(canvas, img);
    atmosphereRef.current = atmosphere;
    setPaused(atmosphere.isPaused());
    atmosphere.start();

    const onVisibility = () => atmosphere.setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      atmosphere.stop();
      document.removeEventListener('visibilitychange', onVisibility);
      atmosphereRef.current = null;
    };
  }, []);

  function toggleMotion() {
    const atmosphere = atmosphereRef.current;
    if (!atmosphere) return;
    setPaused(atmosphere.togglePaused());
  }

  function enter() {
    if (entering) return;
    setEntering(true);
    atmosphereRef.current?.setEntering(true);
    stageRef.current?.classList.add(styles.opening);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      router.push('/mission-control/request');
    }, reduced ? 0 : ENTER_TRANSITION_MS);
  }

  return (
    <div className={styles.cover}>
      <div ref={stageRef} className={styles.stage}>
        {imageFailed ? (
          <div
            className={styles.image}
            style={{ background: 'radial-gradient(circle at 20% 70%, #241016, var(--nbb-bg-deep))' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- canvas readImageData needs the raw <img>, not next/image's optimized output
          <img
            ref={imgRef}
            className={styles.image}
            src="/assets/nbb/bahrain-cover.jpg"
            alt="NBB Bahrain After Dark: Bahrain skyline, crescent moon, aircraft and a red-lit airport control tower. Every case. A clear direction."
            onError={() => setImageFailed(true)}
          />
        )}
        <canvas ref={canvasRef} className={styles.livingLayer} aria-hidden="true" />
        <button
          type="button"
          className={styles.enter}
          aria-label="Enter the NBB financial crime workflow demo"
          onMouseEnter={() => atmosphereRef.current?.setHover(true)}
          onMouseLeave={() => atmosphereRef.current?.setHover(false)}
          onFocus={() => atmosphereRef.current?.setHover(true)}
          onBlur={() => atmosphereRef.current?.setHover(false)}
          onClick={enter}
        >
          Enter Mission Control <span className={styles.arrow}>→</span>
        </button>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.mobileEnter} onClick={enter}>
          Enter Mission Control →
        </button>
        <button type="button" onClick={toggleMotion}>
          {paused ? 'Play atmosphere' : 'Pause atmosphere'}
        </button>
        <span className={styles.status}>
          <i className={styles.liveDot} />
          {paused ? 'Atmosphere paused' : 'Live atmosphere'}
        </span>
        <span className={styles.note}>
          Rain · Lightning · Original runway lights pulsing · Moving control-room staff · Boat wake
        </span>
      </div>
    </div>
  );
}
