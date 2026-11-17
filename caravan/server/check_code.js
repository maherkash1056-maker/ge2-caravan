// GE2 Caravan: roster-gated login with a 4-digit PIN (set on first login).
function sha256(ascii){function rightRotate(v,a){return (v>>>a)|(v<<(32-a));}var mathPow=Math.pow,maxWord=mathPow(2,32),lengthProperty='length',i,j,result='',words=[],asciiBitLength=ascii[lengthProperty]*8,hash=sha256.h=sha256.h||[],k=sha256.k=sha256.k||[],primeCounter=k[lengthProperty],isComposite={};for(var candidate=2;primeCounter<64;candidate++){if(!isComposite[candidate]){for(i=0;i<313;i+=candidate)isComposite[i]=candidate;hash[primeCounter]=(mathPow(candidate,.5)*maxWord)|0;k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0;}}ascii+='\x80';while(ascii[lengthProperty]%64-56)ascii+='\x00';for(i=0;i<ascii[lengthProperty];i++){j=ascii.charCodeAt(i);if(j>>8)return;words[i>>2]|=j<<((3-i)%4)*8;}words[words[lengthProperty]]=((asciiBitLength/maxWord)|0);words[words[lengthProperty]]=(asciiBitLength);for(j=0;j<words[lengthProperty];){var w=words.slice(j,j+=16),oldHash=hash;hash=hash.slice(0,8);for(i=0;i<64;i++){var w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4],temp1=hash[7]+(rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rightRotate(w15,7)^rightRotate(w15,18)^(w15>>>3))+w[i-7]+(rightRotate(w2,17)^rightRotate(w2,19)^(w2>>>10)))|0);var temp2=(rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));hash=[(temp1+temp2)|0].concat(hash);hash[4]=(hash[4]+temp1)|0;}for(i=0;i<8;i++)hash[i]=(hash[i]+oldHash[i])|0;}for(i=0;i<8;i++)for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;result+=((b<16)?0:'')+b.toString(16);}return result;}
const PEPPER = "ge2-caravan-2026-dhofar";
const pinHash = (id, pin) => sha256(PEPPER + "|" + String(id).toUpperCase() + "|" + String(pin));
const rnd = () => { let t = ""; const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; for (let i = 0; i < 32; i++) t += a[Math.floor(Math.random() * a.length)]; return t; };
const req = $('Read the request').first().json;
const roster = $input.first().json || {};
const fail = (code, error) => [{ json: { ok: false, code, error, id: req.id } }];
if (!roster.student_id) return fail("roster", "This College ID is not on the Group 9 list. Check the ID, or ask your teacher to add you.");
if (roster.active === false) return fail("roster", "This account is not active. Ask your teacher.");
const base = { ok: true, id: req.id, token: rnd(), name: roster.name || req.name || req.id, short: roster.short_name || "", role: roster.role || "student", device: req.device, now: new Date().toISOString(), pin_set: true, pin_hash: roster.pin_hash || "" };
if (!roster.pin_set || !roster.pin_hash) {
  if (!req.setPin) return fail("newpin", "First time here. Choose a 4-digit PIN that you will remember.");
  if (/^(\d)\1{3}$/.test(req.pinIn) || req.pinIn === "1234") return fail("weakpin", "Choose a PIN that is harder to guess (not 1234 or 0000).");
  base.pin_hash = pinHash(req.id, req.pinIn); base.first = true;
  return [{ json: base }];
}
if (req.setPin) return fail("pin", "A PIN already exists for this ID. Type your PIN to log in, or ask your teacher to reset it.");
if (pinHash(req.id, req.pinIn) !== roster.pin_hash) return fail("pin", "That PIN is not right. Try again, or ask your teacher to reset it.");
return [{ json: base }];
