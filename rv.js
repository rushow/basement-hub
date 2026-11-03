// Basement Hub — remote viewing helpers shared by the hub (index.html) and the viewer (viewer.html).
// Video flows phone-to-phone over WebRTC (encrypted by WebRTC itself).
// The short connection messages travel through an ntfy topic, encrypted with AES-GCM using a key
// derived from the secret in your private viewer link. The ntfy server never sees the secret or the content.
'use strict';
const RVLIB = (() => {
  const ICE = [{urls:'stun:stun.l.google.com:19302'}, {urls:'stun:stun.cloudflare.com:3478'}];
  const te = new TextEncoder(), td = new TextDecoder();

  function b64uEnc(u8){ let s=''; for (let i=0;i<u8.length;i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function b64uDec(s){ s = s.replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i=0;i<b.length;i++) u[i] = b.charCodeAt(i); return u; }
  async function sha256(str){ return new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(str))); }
  const hex = u8 => Array.from(u8, b => b.toString(16).padStart(2,'0')).join('');

  function newSecret(){ const a = new Uint8Array(24); crypto.getRandomValues(a); return b64uEnc(a); }
  async function derive(secret){
    const topic = 'bhv-' + hex(await sha256('topic:'+secret)).slice(0, 32);
    const key = await crypto.subtle.importKey('raw', await sha256('key:'+secret), 'AES-GCM', false, ['encrypt','decrypt']);
    return {topic, key};
  }
  async function deflate(u8){
    if (!window.CompressionStream) return null;
    const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(u8); w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  }
  async function inflate(u8){
    const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(u8); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  async function seal(key, obj){
    let body = te.encode(JSON.stringify(obj)), flag = 0;
    const z = await deflate(body).catch(() => null); if (z && z.length < body.length){ body = z; flag = 1; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, body));
    const out = new Uint8Array(1 + 12 + ct.length); out[0] = flag; out.set(iv, 1); out.set(ct, 13);
    return 'bh1.' + b64uEnc(out);
  }
  async function open(key, str){
    if (typeof str !== 'string' || !str.startsWith('bh1.')) return null;
    try{
      const u = b64uDec(str.slice(4)), flag = u[0], iv = u.slice(1,13), ct = u.slice(13);
      let pt = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct));
      if (flag === 1) pt = await inflate(pt);
      return JSON.parse(td.decode(pt));
    }catch(e){ return null; }   // not ours / tampered
  }
  async function send(server, topic, key, obj){
    const r = await fetch(server.replace(/\/+$/,'') + '/' + topic, {method:'POST', body: await seal(key, obj)});
    if (!r.ok) throw new Error('signal HTTP ' + r.status);
  }
  // Subscribe to a topic; calls onMsg(decryptedObject) for every valid message.
  function listen(server, topic, key, onMsg, onState){
    const es = new EventSource(server.replace(/\/+$/,'') + '/' + topic + '/sse');
    es.onopen = () => onState && onState('open');
    es.onerror = () => onState && onState('error');
    es.onmessage = async ev => {
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if (m.event && m.event !== 'message') return;
      let text = m.message;
      if (m.attachment && m.attachment.url){ try{ text = await (await fetch(m.attachment.url)).text(); }catch(e){ return; } }
      const obj = await open(key, text); if (obj) onMsg(obj);
    };
    return es;
  }
  function iceDone(pc, ms){
    return new Promise(res => {
      if (pc.iceGatheringState === 'complete') return res();
      const t = setTimeout(res, ms || 3000);
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete'){ clearTimeout(t); res(); } });
    });
  }
  return {ICE, newSecret, derive, send, listen, iceDone};
})();
