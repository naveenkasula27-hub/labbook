import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — LabBook';
    document.querySelector('meta[name="robots"]')?.setAttribute('content','noindex,follow');
  }, []);
  return <main className="center" style={{padding:'clamp(40px,10vw,100px) 24px'}}><div className="card" style={{maxWidth:560,margin:'auto',textAlign:'center'}}><p className="muted">404 · LABBOOK</p><h1>This page could not be found.</h1><p className="muted">The link may have changed. Return to LabBook or check the lab address you were given.</p><Link className="btn btn-primary" to="/">Back to LabBook</Link></div></main>;
}
