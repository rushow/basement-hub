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
  // ntfy.sh caps a message at 4096 bytes, so long messages are sent in numbered pieces.
  const CHUNK = 3000;
  async function post(server, topic, body){
    const r = await fetch(server.replace(/\/+$/,'') + '/' + topic, {method:'POST', body});
    if (!r.ok) throw new Error('signal HTTP ' + r.status);
  }
  async function send(server, topic, key, obj){
    const sealed = await seal(key, obj);
    if (sealed.length <= CHUNK) return post(server, topic, sealed);
    const id = hex(crypto.getRandomValues(new Uint8Array(4))), n = Math.ceil(sealed.length / CHUNK);
    for (let i = 0; i < n; i++) await post(server, topic, 'bhc.' + id + '.' + i + '.' + n + '.' + sealed.slice(i*CHUNK, (i+1)*CHUNK));
    return n;
  }
  // Subscribe to a topic; calls onMsg(decryptedObject) for every valid message.
  function listen(server, topic, key, onMsg, onState){
    const parts = new Map();
    const es = new EventSource(server.replace(/\/+$/,'') + '/' + topic + '/sse');
    es.onopen = () => onState && onState('open');
    es.onerror = () => onState && onState('error');
    es.onmessage = async ev => {
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if (m.event && m.event !== 'message') return;
      let text = m.message;
      if (m.attachment && m.attachment.url){ try{ text = await (await fetch(m.attachment.url)).text(); }catch(e){ return; } }
      const c = typeof text === 'string' && text.match(/^bhc\.([0-9a-f]+)\.(\d+)\.(\d+)\.([\s\S]*)$/);
      if (c){
        const id = c[1], i = +c[2], n = +c[3];
        if (!parts.has(id)) parts.set(id, {n, got:new Array(n), at:Date.now()});
        const p = parts.get(id); p.got[i] = c[4];
        if (p.got.filter(x => x !== undefined).length < p.n) return;
        parts.delete(id); text = p.got.join('');
        for (const [k, v] of parts) if (Date.now() - v.at > 60000) parts.delete(k);
      }
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
  return {ICE, newSecret, derive, send, listen, iceDone, seal};
})();
