/* Funções comuns ao cardápio e ao painel */
const $ = id => document.getElementById(id);
const brl = v => (Number.isFinite(Number(v)) ? Number(v) : 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zap = t => `https://wa.me/${ZAP}?text=${encodeURIComponent(t)}`;
const cpfMask = v => String(v).replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
function cpfValido(c){ if(!/^\d{11}$/.test(c)||/^(\d)\1{10}$/.test(c)) return false;
  for(const n of [9,10]){ let t=0; for(let i=0;i<n;i++) t+=+c[i]*(n+1-i); if((t*10%11)%10!==+c[n]) return false; } return true; }
