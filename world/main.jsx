import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, X, RotateCcw, Map, SlidersHorizontal, Footprints } from 'lucide-react';
import { createWorld, exhibits } from './scene.js';
import './world.css';
import { personalAsset, posters } from './personal-stalls.js';

function App() {
  const canvasHost = useRef(null);
  const engine = useRef(null);
  const dialog = useRef(null);
  const [status, setStatus] = useState('Preparing the hall');
  const [error, setError] = useState('');
  const [near, setNear] = useState(null);
  const [active, setActive] = useState(null);
  const [menu, setMenu] = useState(false);
  const [quality, setQuality] = useState('balanced');
  const [stats, setStats] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch('/index.html', { signal: abort.signal }).then(r => {
      if (!r.ok) throw new Error('Portfolio content could not be loaded.');
      return r.text();
    }).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      setContent({ experience: doc.querySelector('.timeline').innerHTML,
        projects: [...doc.querySelectorAll('.work-card template')].map(t => t.innerHTML).join('<hr>') });
    }).catch(e => { if (e.name !== 'AbortError') setContent({ error: e.message }); });
    let disposed = false;
    createWorld(canvasHost.current, { onStatus: setStatus, onNear: setNear, onOpen: setActive, onStats: setStats })
      .then(value => { if (disposed) value.dispose(); else engine.current = value; })
      .catch(e => { if (!disposed) setError(e.message); });
    return () => { disposed = true; abort.abort(); engine.current?.dispose(); };
  }, []);
  useEffect(() => {
    engine.current?.pause(Boolean(active));
    if (active && !dialog.current.open) dialog.current.showModal();
    if (!active && dialog.current.open) dialog.current.close();
  }, [active]);

  return <main className="world-app">
    <div ref={canvasHost} className="scene-host" aria-label="Interactive portfolio exhibition" />
    <header className="world-header">
      <a className="back" href="/" aria-label="Back to portfolio"><ArrowLeft size={18} /><span>Portfolio</span></a>
      <div className="world-brand"><span className="brand-emblem">h.</span><div>HARIKRISHNAN'S WORLD<small>THE PERSONAL EXHIBITION / 01</small></div></div>
      <button className="icon-button" onClick={() => setMenu(!menu)} title="Exhibits and graphics" aria-label="Exhibits and graphics" aria-expanded={menu}><Map size={20} /></button>
    </header>
    {status && !error && <div className="loading" role="status"><span className="brand-emblem">h.</span><h1>A world of possibilities.</h1><p>{status}</p><progress aria-label="Loading world" /></div>}
    {error && <div className="loading" role="alert"><h1>The hall couldn't open.</h1><p>{error}</p><a className="action" href="/">Return to portfolio</a><button className="action" onClick={() => location.reload()}>Try again</button></div>}
    {!status && !error && <>
      <div className="world-caption"><span>WELCOME TO MY WORLD</span><h1>Somewhere between<br /><em>ideas & possibility.</em></h1></div>
      {menu && <aside className="world-menu" aria-label="World settings"><h2>The directory</h2>{exhibits.map(e => <button key={e.id} onClick={() => { setActive(e.id); setMenu(false); }}><span>{e.number} / {e.title}</span><ArrowRight size={16} /></button>)}<label><SlidersHorizontal size={16} /> Graphics<select value={quality} onChange={e => { setQuality(e.target.value); engine.current?.quality(e.target.value); }}><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select></label><button onClick={() => engine.current?.reset()}><span>Return to entrance</span><RotateCcw size={16} /></button>{stats && <small>{stats.fps} FPS · {stats.calls} draw calls</small>}</aside>}
      {near && <button className="interact" onClick={() => setActive(near)}><Footprints size={18} /><span>{exhibits.find(e => e.id === near)?.title}</span><kbd>E</kbd><ArrowRight size={18} /></button>}
      <footer className="world-footer"><span>HARIKRISHNAN P M <b>/</b> AN EXPLORATION</span><span className="prototype">PROTOTYPE 01</span><button className="icon-button" onClick={() => engine.current?.reset()} title="Return to entrance" aria-label="Return to entrance"><RotateCcw size={18} /></button></footer>
      <div className="touch-pad" aria-label="Movement controls">{[['forward', ArrowUp], ['left', ArrowLeft], ['backward', ArrowDown], ['right', ArrowRight]].map(([key, Icon]) => <button key={key} aria-label={`Move ${key}`} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); engine.current?.input(key, true); }} onPointerUp={() => engine.current?.input(key, false)} onPointerCancel={() => engine.current?.input(key, false)}><Icon size={20} /></button>)}</div>
    </>}
    <dialog ref={dialog} className="exhibit-dialog" aria-label={exhibits.find(e => e.id === active)?.title || 'Exhibit'} onCancel={() => setActive(null)} onClose={() => setActive(null)} onClick={e => { if (e.target === dialog.current) setActive(null); }}>
      <div className="exhibit-sheet"><header><span>THE COLLECTION / {exhibits.find(e => e.id === active)?.number}</span><button className="icon-button" aria-label="Close exhibit" title="Close exhibit" onClick={() => setActive(null)}><X size={22} /></button></header><h2>{exhibits.find(e => e.id === active)?.title}</h2>
      {(active === 'experience' || active === 'projects') && (!content ? <p>Loading the collection...</p> : content.error ? <p>{content.error} <a href="/">Read the portfolio</a></p> : active === 'experience' ? <ol className="portfolio-content experience-list" dangerouslySetInnerHTML={{ __html: content.experience }} /> : <div className="portfolio-content" dangerouslySetInnerHTML={{ __html: content.projects }} />)}
      {active === 'about' && <><p>I'm Harikrishnan, a software engineer based in Bengaluru, India. I build enterprise software from the API to the interface.</p><p>My work spans .NET, Angular, SQL Server, and Azure, with experience in distributed systems and an interest in enterprise AI.</p></>}
      {active === 'contact' && <div className="contact-actions"><p>Let's build something thoughtful.</p><a href="mailto:haripm.krishnan@gmail.com">Email me <ArrowRight size={18} /></a><a href="https://www.linkedin.com/in/harikrishnan-pm/" target="_blank" rel="noreferrer">LinkedIn <ArrowRight size={18} /></a><a href="https://github.com/Harik35" target="_blank" rel="noreferrer">GitHub <ArrowRight size={18} /></a><a href="/Harikrishnan_PM_EY_GDS%20(1).pdf" download>Download resume <ArrowDown size={18} /></a></div>}
      {active === 'fun' && <><p>Marvel & Game of Thrones. A few favorite characters from other worlds.</p><div className="poster-gallery">{posters.map(poster => <figure key={poster.file}><img src={personalAsset(poster.file)} alt={poster.name} loading="lazy" /><figcaption><strong>{poster.name}</strong><span>{poster.collection}</span></figcaption></figure>)}</div></>}
      </div>
    </dialog>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
