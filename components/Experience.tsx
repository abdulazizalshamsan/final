'use client';

import { useState } from 'react';
import BahrainCover from './cover/BahrainCover';
import App from './App';

export default function Experience() {
  const [entered, setEntered] = useState(false);
  return entered ? <App /> : <BahrainCover onEnter={() => setEntered(true)} />;
}
