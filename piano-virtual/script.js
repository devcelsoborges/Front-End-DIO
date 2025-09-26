
/* Piano Virtual - Completo
Features:
- Samples (local) for timbres: acoustic, electric, pad (assets/samples/<timbre>/<midi>.wav)
- Synth fallback (WebAudio) when samples unavailable or when timbre 'synth' selected
- Metronome, quantization during recording
- Recording/playback, MIDI export (format 0), limited MIDI import (reading note events not fully robust)
- UI: theme, octave shift, sustain, timbre selection, audio params
*/

// Audio context and master
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let masterGain = audioCtx.createGain();
masterGain.gain.value = 0.8;
masterGain.connect(audioCtx.destination);

// UI refs
const pianoEl = document.getElementById('piano');
const octaveDisplay = document.getElementById('octave-display');
const octUp = document.getElementById('oct-up');
const octDown = document.getElementById('oct-down');
const sustainChk = document.getElementById('sustain');
const recordBtn = document.getElementById('record-btn');
const stopBtn = document.getElementById('stop-btn');
const playBtn = document.getElementById('play-btn');
const exportMidiBtn = document.getElementById('export-midi');
const importMidiInput = document.getElementById('import-midi');
const recordLog = document.getElementById('record-log');
const bpmInput = document.getElementById('bpm');
const divSelect = document.getElementById('div');
const metToggle = document.getElementById('met-toggle');
const quantizeChk = document.getElementById('quantize');
const timbreSelect = document.getElementById('timbre-select');
const themeSelect = document.getElementById('theme-select');
const volumeInput = document.getElementById('volume');
const attackInput = document.getElementById('attack');
const releaseInput = document.getElementById('release');

let baseOctave = 4;
octaveDisplay.textContent = baseOctave;

// mapping keys to semitone offsets
const keyMap = {'a':0,'w':1,'s':2,'e':3,'d':4,'f':5,'t':6,'g':7,'y':8,'h':9,'u':10,'j':11,'k':12};

// piano DOM build: 3 octaves
const OCTAVES = 3;
function buildPiano(){
  pianoEl.innerHTML = '';
  for(let oc=0; oc<OCTAVES; oc++){
    const octDiv = document.createElement('div'); octDiv.className='octave';
    const octNum = baseOctave + oc;
    const order = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    order.forEach((noteName, idx)=>{
      const semitone = idx;
      const midi = 12*(octNum+1) + semitone;
      const isBlack = noteName.includes('#');
      const el = document.createElement('div');
      el.className = 'key ' + (isBlack? 'black':'white');
      el.dataset.midi = midi;
      el.innerHTML = `<div class="key-label">${noteName}${octNum} <span style="font-size:10px;color:rgba(0,0,0,0.4)">${findKeyCharForOffset(semitone)||''}</span></div>`;
      attachMouseEvents(el);
      octDiv.appendChild(el);
    });
    pianoEl.appendChild(octDiv);
  }
}
function findKeyCharForOffset(offset){
  for(const k in keyMap) if(keyMap[k]===offset) return k.toUpperCase();
  return '';
}
buildPiano();

// audio sample loader
const sampleCache = {}; // sampleCache[timbre][midi] = AudioBuffer
async function loadSample(timbre, midi){
  if(!sampleCache[timbre]) sampleCache[timbre] = {};
  if(sampleCache[timbre][midi]) return sampleCache[timbre][midi];
  const url = `assets/samples/${timbre}/${midi}.wav`;
  try{
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('no sample');
    const arr = await resp.arrayBuffer();
    const buf = await audioCtx.decodeAudioData(arr);
    sampleCache[timbre][midi] = buf;
    return buf;
  }catch(e){
    // sample not found
    sampleCache[timbre][midi] = null;
    return null;
  }
}

// synth fallback
function createSynthVoice(freq){
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  return {osc,gain};
}

// active voices tracking
const activeVoices = new Map(); // id -> {source, midi, type('sample'|'synth'), when}

// play note, returns id
async function playNote(midi){
  if(audioCtx.state==='suspended') await audioCtx.resume();
  const timbre = timbreSelect.value;
  let id = `${midi}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const vol = parseFloat(volumeInput.value)||0.8;
  const attack = parseFloat(attackInput.value)||0.02;
  const release = parseFloat(releaseInput.value)||0.3;
  if(timbre==='synth'){
    const freq = 440 * Math.pow(2,(midi-69)/12);
    const v = createSynthVoice(freq);
    v.gain.gain.cancelScheduledValues(audioCtx.currentTime);
    v.gain.gain.setValueAtTime(0, audioCtx.currentTime);
    v.gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + attack);
    activeVoices.set(id, {source:v, midi, type:'synth', release});
    return id;
  } else {
    const buf = await loadSample(timbre, midi);
    if(buf){
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      // attach gain envelope
      const g = audioCtx.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(masterGain);
      const now = audioCtx.currentTime;
      g.gain.linearRampToValueAtTime(vol, now + attack);
      src.start(now);
      activeVoices.set(id, {source:src, gainNode:g, midi, type:'sample', release});
      return id;
    } else {
      // fallback synth if sample missing
      const freq = 440 * Math.pow(2,(midi-69)/12);
      const v = createSynthVoice(freq);
      v.gain.gain.cancelScheduledValues(audioCtx.currentTime);
      v.gain.gain.setValueAtTime(0, audioCtx.currentTime);
      v.gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + attack);
      activeVoices.set(id, {source:v, midi, type:'synth', release});
      return id;
    }
  }
}

// stop note by id
function stopNote(id){
  const entry = activeVoices.get(id);
  if(!entry) return;
  const now = audioCtx.currentTime;
  const release = entry.release || 0.3;
  if(entry.type==='sample'){
    try{
      entry.gainNode.gain.cancelScheduledValues(now);
      entry.gainNode.gain.setValueAtTime(entry.gainNode.gain.value, now);
      entry.gainNode.gain.linearRampToValueAtTime(0, now + release);
      entry.source.stop(now + release + 0.05);
    }catch(e){}
  } else if(entry.type==='synth'){
    try{
      entry.source.gain.gain.cancelScheduledValues(now);
      entry.source.gain.gain.setValueAtTime(entry.source.gain.gain.value, now);
      entry.source.gain.gain.linearRampToValueAtTime(0, now + release);
      setTimeout(()=>{ try{ entry.source.osc.stop(); } catch(e){} }, (release+0.05)*1000);
    }catch(e){}
  }
  activeVoices.delete(id);
}

// mouse interaction on keys
function attachMouseEvents(el){
  el.addEventListener('mousedown', async (e)=>{
    const midi = parseInt(el.dataset.midi);
    const id = await playNote(midi);
    el.dataset.noteId = id; el.classList.add('active');
    if(isRecording) recordEvent({type:'down', midi, time:performance.now()-recordStart});
  });
  el.addEventListener('mouseup', (e)=>{
    const id = el.dataset.noteId;
    if(id && !sustainChk.checked){ stopNote(id); }
    delete el.dataset.noteId; el.classList.remove('active');
    if(isRecording) recordEvent({type:'up', midi:parseInt(el.dataset.midi), time:performance.now()-recordStart});
  });
  el.addEventListener('mouseleave', (e)=>{
    const id = el.dataset.noteId;
    if(id && !sustainChk.checked){ stopNote(id); delete el.dataset.noteId; el.classList.remove('active'); }
  });
}

// keyboard mapping
const pressedKeys = new Map();
window.addEventListener('keydown', async (e)=>{
  if(e.repeat) return;
  const k = e.key.toLowerCase();
  if(keyMap.hasOwnProperty(k)){
    const offset = keyMap[k];
    const midi = 12*(baseOctave+1) + offset;
    const id = await playNote(midi);
    pressedKeys.set(k,id);
    highlightKeyByMidi(midi,true);
    if(isRecording) recordEvent({type:'down', midi, time:performance.now()-recordStart});
  }
  if(k===' ') { sustainChk.checked = !sustainChk.checked; }
});
window.addEventListener('keyup', (e)=>{
  const k = e.key.toLowerCase();
  if(keyMap.hasOwnProperty(k)){
    const id = pressedKeys.get(k);
    if(id && !sustainChk.checked) stopNote(id);
    pressedKeys.delete(k);
    const offset = keyMap[k];
    const midi = 12*(baseOctave+1) + offset;
    highlightKeyByMidi(midi,false);
    if(isRecording) recordEvent({type:'up', midi, time:performance.now()-recordStart});
  }
});

function highlightKeyByMidi(midi,on){ const el = document.querySelector('[data-midi="'+midi+'"]'); if(el) el.classList.toggle('active',on); }

// octave controls
octUp.addEventListener('click', ()=>{ baseOctave = Math.min(6, baseOctave+1); octaveDisplay.textContent = baseOctave; buildPiano(); });
octDown.addEventListener('click', ()=>{ baseOctave = Math.max(1, baseOctave-1); octaveDisplay.textContent = baseOctave; buildPiano(); });

// theme
themeSelect.addEventListener('change',(e)=>{ document.body.className = e.target.value === 'light' ? 'light':''; });

// metronome
let metronomeId = null;
let metTickOsc = null;
function startMetronome(){
  const bpm = parseFloat(bpmInput.value)||100;
  const interval = 60000 / bpm / (parseInt(divSelect.value)/4); // ms per chosen division
  if(metronomeId) clearInterval(metronomeId);
  // simple click using oscillator
  metronomeId = setInterval(()=>{ clickSound(); }, interval);
  metToggle.textContent = 'Stop Metronome';
}
function stopMetronome(){ if(metronomeId) clearInterval(metronomeId); metronomeId = null; metToggle.textContent = 'Start Metronome'; }
function clickSound(){
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='square'; o.frequency.value = 1000; g.gain.value = 0.0001; o.connect(g); g.connect(masterGain);
  const now = audioCtx.currentTime;
  g.gain.setValueAtTime(0.001, now);
  g.gain.exponentialRampToValueAtTime(0.00001, now+0.08);
  o.start(now); o.stop(now+0.09);
}
metToggle.addEventListener('click', ()=>{ if(metronomeId) stopMetronome(); else startMetronome(); });

// recording with quantization
let isRecording = false;
let recordStart = 0;
let recordedEvents = []; // {type, midi, time(ms)}
recordBtn.addEventListener('click', ()=>{ isRecording=true; recordedEvents=[]; recordStart=performance.now(); recordBtn.disabled=true; stopBtn.disabled=false; playBtn.disabled=true; recordLog.textContent='Gravando...'; });
stopBtn.addEventListener('click', ()=>{ isRecording=false; recordBtn.disabled=false; stopBtn.disabled=true; playBtn.disabled=recordedEvents.length===0; recordLog.textContent = recordedEvents.length? (recordedEvents.length+' eventos gravados') : 'Nenhum evento gravado.'; });
playBtn.addEventListener('click', ()=>{ playRecorded(); });

function recordEvent(ev){ // called by note handlers
  if(!isRecording) return;
  let time = ev.time;
  if(quantizeChk.checked && metronomeId){
    // quantize to nearest subdivision
    const bpm = parseFloat(bpmInput.value)||100; const division = parseInt(divSelect.value);
    const beatMs = 60000 / bpm;
    const unit = beatMs * (4/division); // e.g., division=16 => unit=beatMs/4
    time = Math.round(time / unit) * unit;
  }
  recordedEvents.push({type:ev.type, midi:ev.midi, time});
}

// playback recorded
async function playRecorded(){
  if(recordedEvents.length===0) return;
  recordLog.textContent='Reproduzindo...';
  const start = performance.now();
  for(const ev of recordedEvents){
    const when = ev.time - (recordedEvents[0].time || 0);
    setTimeout(async ()=>{
      if(ev.type==='down'){
        const id = await playNote(ev.midi);
        // auto stop note after 700ms if not sustained
        if(!sustainChk.checked) setTimeout(()=> stopNote(id), 700);
      }
    }, when);
  }
  setTimeout(()=>{ recordLog.textContent='Playback finalizado.'; }, recordedEvents[recordedEvents.length-1].time + 500);
}

// MIDI export (simple format 0 writer)
exportMidiBtn.addEventListener('click', ()=>{
  if(recordedEvents.length===0){ alert('Nenhuma gravação para exportar.'); return; }
  const bpm = parseFloat(bpmInput.value)||100;
  const midiData = buildMidiFile(recordedEvents, bpm);
  const blob = new Blob([midiData], {type:'audio/midi'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'recording.mid'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Very basic MIDI writer (single track) - not comprehensive but works for note on/off events
function buildMidiFile(events, bpm){
  // convert ms to ticks (ppq = 480)
  const ppq = 480;
  const microsPerBeat = 60000000 / bpm;
  const ticksPerMs = ppq / (microsPerBeat/1000);
  // build midi events: list of {delta, dataBytes}
  const trackEvents = [];
  // sort events by time
  events.sort((a,b)=>a.time - b.time);
  let lastTick = 0;
  for(const ev of events){
    const tick = Math.round(ev.time * ticksPerMs);
    const delta = tick - lastTick;
    lastTick = tick;
    if(ev.type === 'down'){
      // note on channel 0, velocity 100
      trackEvents.push({delta, bytes:[0x90, ev.midi, 100]});
    } else if(ev.type === 'up'){
      trackEvents.push({delta, bytes:[0x80, ev.midi, 64]});
    }
  }
  // end of track event
  trackEvents.push({delta: 0, bytes: [0xFF, 0x2F, 0x00]});
  // helper to write varlen
  function writeVarLen(n){
    const bytes = [];
    let buffer = n & 0x7F;
    n >>= 7;
    while(n>0){
      buffer <<=8;
      buffer |= ((n & 0x7F) | 0x80);
      n >>=7;
    }
    // now split into bytes
    const out = [];
    while(true){
      out.push(buffer & 0xFF);
      if(buffer & 0x80) buffer >>=8; else break;
    }
    return out;
  }
  // assemble track data bytes
  const trackBytes = [];
  for(const ev of trackEvents){
    const v = writeVarLen(ev.delta);
    for(const b of v) trackBytes.push(b);
    for(const b of ev.bytes) trackBytes.push(b);
  }
  // build header chunk
  function u32(n){ return [(n>>24)&0xFF,(n>>16)&0xFF,(n>>8)&0xFF,n&0xFF]; }
  function u16(n){ return [(n>>8)&0xFF,n&0xFF]; }
  const header = [
    ...[0x4D,0x54,0x68,0x64], ...u32(6), ...u16(0), ...u16(1), ...u16(ppq)
  ];
  const trackHeader = [0x4D,0x54,0x72,0x6B, ...u32(trackBytes.length)];
  const bytes = new Uint8Array([...header, ...trackHeader, ...trackBytes]);
  return bytes.buffer;
}

// MIDI import: for simplicity allow user to import JSON of recordedEvents (not full MIDI)
importMidiInput.addEventListener('change',(e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = new Uint8Array(reader.result);
      // naive: check if it's MIDI by header 'MThd'
      const text = String.fromCharCode(...data.slice(0,4));
      if(text === 'MThd'){ alert('Import MIDI not fully supported in this demo. Use JSON import.'); return; }
      // try JSON parse
      const str = new TextDecoder().decode(data);
      const obj = JSON.parse(str);
      if(Array.isArray(obj)) { recordedEvents = obj; playBtn.disabled = false; recordLog.textContent = recordedEvents.length+' eventos importados.'; }
    }catch(err){
      alert('Falha ao importar. Envie um JSON com eventos gravados.');
    }
  };
  reader.readAsArrayBuffer(f);
});

// utility: save recorded events as JSON download
function saveRecordingJSON(){
  const blob = new Blob([JSON.stringify(recordedEvents)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'recording.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// stop all voices
function stopAll(){
  for(const id of Array.from(activeVoices.keys())) stopNote(id);
}

// UI bindings for params
volumeInput.addEventListener('input', ()=>{ masterGain.gain.value = parseFloat(volumeInput.value)||0.8; });
attackInput.addEventListener('input', ()=>{});
releaseInput.addEventListener('input', ()=>{});
timbreSelect.addEventListener('change', ()=>{});

// ensure audio resumes on user gesture
window.addEventListener('click', ()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); }, {once:true});
