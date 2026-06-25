import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useGameStore } from '../store/gameStore';

const chapterMoods: Record<string, { bpm: number; drone: string; ambient?: 'rain' | 'heartbeat' | 'tension' | 'wind' | 'silence' }> = {
  intro:    { bpm: 55, drone: 'A1', ambient: 'rain' },
  news:     { bpm: 62, drone: 'G#1', ambient: 'silence' },
  phone:    { bpm: 58, drone: 'B1', ambient: 'rain' },
  dossier:  { bpm: 52, drone: 'A1', ambient: 'silence' },
  letter:   { bpm: 60, drone: 'C2', ambient: 'silence' },
  patients: { bpm: 58, drone: 'A1', ambient: 'silence' },
  timeline: { bpm: 70, drone: 'G1', ambient: 'tension' },
  deduction:{ bpm: 78, drone: 'F#1', ambient: 'heartbeat' },
  ending:   { bpm: 48, drone: 'A1', ambient: 'wind' },
};

export function useAudio() {
  const { audioEnabled, audioVolume } = useGameStore();
  const started = useRef(false);

  // 背景音乐相关引用
  const bgLoopRef = useRef<Tone.Loop | null>(null);
  const padSynthRef = useRef<Tone.PolySynth | null>(null);
  const melodySynthRef = useRef<Tone.Synth | null>(null);
  const bassSynthRef = useRef<Tone.Synth | null>(null);
  const droneRef = useRef<Tone.Oscillator | null>(null);

  const start = useCallback(async () => {
    if (started.current) return;
    await Tone.start();
    started.current = true;

    // 铺底 Pad：悠长、缓慢和弦，制造压抑氛围
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 0.8, sustain: 0.4, release: 4 },
    }).toDestination();
    pad.volume.value = -34;
    padSynthRef.current = pad;

    // 旋律音色：柔和长音
    const melody = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.8, decay: 0.8, sustain: 0.3, release: 2 },
    }).toDestination();
    melody.volume.value = -28;
    melodySynthRef.current = melody;

    // 低音贝斯：深沉根音
    const bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.4, sustain: 0.4, release: 1.5 },
    }).toDestination();
    bass.volume.value = -24;
    bassSynthRef.current = bass;

    // 持续低频嗡鸣 — 保持静音，仅保留引用以避免报错
    const drone = new Tone.Oscillator('A1', 'sine').toDestination();
    drone.volume.value = -60;
    drone.mute = true;
    droneRef.current = drone;

    // 悬疑旋律循环：4 小节，每小节 4 拍，BPM 很慢
    // 提供 3 组变奏，避免单调
    const melodyVariations = [
      [
        { time: '0:0', note: 'A4', dur: '2n' },
        { time: '0:2', note: 'G#4', dur: '2n' },
        { time: '1:0', note: 'E4', dur: '2n.' },
        { time: '1:3', note: 'C4', dur: '4n' },
        { time: '2:0', note: 'D4', dur: '2n' },
        { time: '2:2', note: 'F4', dur: '2n' },
        { time: '3:0', note: 'E4', dur: '1n' },
      ],
      [
        { time: '0:0', note: 'C5', dur: '2n' },
        { time: '0:2', note: 'A4', dur: '4n' },
        { time: '0:3', note: 'G#4', dur: '4n' },
        { time: '1:0', note: 'E4', dur: '2n' },
        { time: '1:2', note: 'F4', dur: '2n' },
        { time: '2:0', note: 'D4', dur: '2n.' },
        { time: '2:3', note: 'E4', dur: '4n' },
        { time: '3:0', note: 'A4', dur: '1n' },
      ],
      [
        { time: '0:0', note: 'E4', dur: '2n' },
        { time: '0:2', note: 'F4', dur: '4n' },
        { time: '0:3', note: 'E4', dur: '4n' },
        { time: '1:0', note: 'D4', dur: '2n' },
        { time: '1:2', note: 'C4', dur: '2n' },
        { time: '2:0', note: 'G#4', dur: '2n' },
        { time: '2:2', note: 'A4', dur: '2n' },
        { time: '3:0', note: 'G#4', dur: '1n' },
      ],
    ];

    // 铺底和弦变奏
    const padVariations = [
      [
        { time: '0:0', chord: ['A2', 'E3', 'C4'] },
        { time: '2:0', chord: ['A2', 'G#3', 'E4'] },
      ],
      [
        { time: '0:0', chord: ['A2', 'C4', 'E4'] },
        { time: '1:2', chord: ['D3', 'A3', 'F4'] },
        { time: '2:0', chord: ['E3', 'G#3', 'D4'] },
        { time: '3:2', chord: ['A2', 'E3', 'C4'] },
      ],
      [
        { time: '0:0', chord: ['F2', 'C3', 'A3'] },
        { time: '1:0', chord: ['E2', 'B2', 'G#3'] },
        { time: '2:0', chord: ['D2', 'A2', 'F3'] },
        { time: '3:0', chord: ['A1', 'E2', 'C3'] },
      ],
    ];

    // 低音根音变奏
    const bassVariations = [
      [
        { time: '0:0', note: 'A1' },
        { time: '1:0', note: 'A1' },
        { time: '2:0', note: 'G#1' },
        { time: '3:0', note: 'E1' },
      ],
      [
        { time: '0:0', note: 'A1' },
        { time: '0:2', note: 'C2' },
        { time: '1:0', note: 'E1' },
        { time: '1:2', note: 'G#1' },
        { time: '2:0', note: 'D2' },
        { time: '2:2', note: 'F1' },
        { time: '3:0', note: 'A1' },
      ],
      [
        { time: '0:0', note: 'F1' },
        { time: '1:0', note: 'E1' },
        { time: '2:0', note: 'D1' },
        { time: '3:0', note: 'A0' },
      ],
    ];

    // 随机装饰音/紧张音，每隔几小节触发一次
    const tensionNotes = ['C5', 'C#5', 'D5', 'F5', 'G#5'];

    Tone.Transport.bpm.value = 60;

    let variationIndex = 0;

    const loop = new Tone.Loop((time) => {
      // 每次循环切换变奏（按顺序轮播，比完全随机更音乐化）
      const melodyPattern = melodyVariations[variationIndex % melodyVariations.length];
      const padPattern = padVariations[variationIndex % padVariations.length];
      const bassPattern = bassVariations[variationIndex % bassVariations.length];
      variationIndex += 1;

      // Pad 和弦
      padPattern.forEach((evt) => {
        pad.triggerAttackRelease(evt.chord, '2n', time + Tone.Time(evt.time).toSeconds());
      });
      // 旋律
      melodyPattern.forEach((evt) => {
        melody.triggerAttackRelease(evt.note, evt.dur, time + Tone.Time(evt.time).toSeconds());
      });
      // 低音
      bassPattern.forEach((evt) => {
        bass.triggerAttackRelease(evt.note, '2n', time + Tone.Time(evt.time).toSeconds());
      });

      // 10% 概率加入紧张装饰音
      if (Math.random() < 0.1) {
        const note = tensionNotes[Math.floor(Math.random() * tensionNotes.length)];
        melody.triggerAttackRelease(note, '1n', time + Tone.Time('2:0').toSeconds());
      }
    }, '4m').start(0);

    bgLoopRef.current = loop;

    if (audioEnabled) {
      Tone.Transport.start();
      drone.start();
    }
  }, [audioEnabled]);

  useEffect(() => {
    if (!started.current) return;
    const vol = Tone.gainToDb(Math.max(0.01, audioVolume));
    Tone.Destination.volume.rampTo(vol, 0.1);
    if (audioEnabled) {
      Tone.Transport.start();
      droneRef.current?.start();
    } else {
      Tone.Transport.pause();
      droneRef.current?.stop();
    }
  }, [audioEnabled, audioVolume]);

  const playClick = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination();
    synth.volume.value = -20;
    synth.triggerAttackRelease('C6', '32n');
  }, [audioEnabled]);

  const playSuccess = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -18;
    synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n');
  }, [audioEnabled]);

  const playError = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.25 },
    }).toDestination();
    synth.volume.value = -12;
    // 不协和的下行小二度，明确提示错误
    synth.triggerAttackRelease('G2', '16n');
    setTimeout(() => synth.triggerAttackRelease('F#2', '16n'), 120);
  }, [audioEnabled]);

  const playAdvance = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -14;
    // 进入下一章：上升的悬疑和弦，类似拉开新场景
    synth.triggerAttackRelease(['A3', 'E4', 'C5'], '4n');
  }, [audioEnabled]);

  const playHeartbeat = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const membrane = new Tone.MembraneSynth().toDestination();
    membrane.volume.value = -10;
    membrane.triggerAttackRelease('C2', '8n');
    setTimeout(() => membrane.triggerAttackRelease('C2', '8n'), 300);
  }, [audioEnabled]);

  const playClueCollect = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -14;
    synth.triggerAttackRelease(['E5', 'A5'], '16n');
  }, [audioEnabled]);

  const playTension = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const membrane = new Tone.MembraneSynth().toDestination();
    membrane.volume.value = -16;
    membrane.triggerAttackRelease('C1', '4n');
  }, [audioEnabled]);

  // 打字机按键音 — 随机频率的短促 click，模拟机械键盘
  const playTypeTick = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const freq = 2400 + Math.random() * 1200;
    const synth = new Tone.Synth({
      oscillator: { type: 'square' as const },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 },
    }).toDestination();
    synth.volume.value = -28;
    synth.triggerAttackRelease(freq, '64n');
    // 自动清理
    setTimeout(() => synth.dispose(), 200);
  }, [audioEnabled]);

  // 环境音持续引用
  const heartbeatLoopRef = useRef<number | null>(null);
  const ambientNoiseRef = useRef<Tone.Noise | null>(null);
  const ambientFilterRef = useRef<Tone.Filter | null>(null);

  // 环境音效 — 支持持续循环
  const playAmbient = useCallback((type: 'rain' | 'heartbeat' | 'tension' | 'heartbeat_loop' | 'heartbeat_stop' | 'rain_start' | 'rain_stop' | 'wind') => {
    if (!audioEnabled || !started.current) return;
    if (type === 'wind') {
      // 低音风噪
      const noise = new Tone.Noise('brown').toDestination();
      noise.volume.value = -34;
      const filter = new Tone.Filter(200, 'lowpass');
      noise.connect(filter);
      filter.toDestination();
      noise.start();
      noise.volume.rampTo(-26, 2);
      setTimeout(() => { noise.volume.rampTo(-50, 3); setTimeout(() => { noise.stop(); noise.dispose(); filter.dispose(); }, 3000); }, 4000);
    } else if (type === 'rain_start') {
      if (ambientNoiseRef.current) return;
      const noise = new Tone.Noise('pink').toDestination();
      noise.volume.value = -38;
      const filter = new Tone.Filter(600, 'lowpass');
      noise.connect(filter);
      filter.toDestination();
      noise.start();
      ambientNoiseRef.current = noise;
      ambientFilterRef.current = filter;
      noise.volume.rampTo(-26, 2);
    } else if (type === 'rain_stop') {
      if (ambientNoiseRef.current) {
        ambientNoiseRef.current.volume.rampTo(-50, 2);
        setTimeout(() => {
          ambientNoiseRef.current?.stop();
          ambientNoiseRef.current?.dispose();
          ambientFilterRef.current?.dispose();
          ambientNoiseRef.current = null;
          ambientFilterRef.current = null;
        }, 2000);
      }
    } else if (type === 'rain') {
      // one-shot rain (向后兼容)
      const noise = new Tone.Noise('pink').toDestination();
      noise.volume.value = -28;
      const filter = new Tone.Filter(800, 'lowpass').toDestination();
      noise.connect(filter);
      noise.start();
      setTimeout(() => { noise.stop(); noise.dispose(); filter.dispose(); }, 3000);
    } else if (type === 'heartbeat') {
      const membrane = new Tone.MembraneSynth().toDestination();
      membrane.volume.value = -14;
      membrane.triggerAttackRelease('C1', '8n');
      setTimeout(() => membrane.triggerAttackRelease('C1', '8n'), 400);
      setTimeout(() => membrane.dispose(), 1000);
    } else if (type === 'heartbeat_loop') {
      // 持续渐强心跳
      if (heartbeatLoopRef.current) return;
      let volume = -20;
      const beat = () => {
        if (!audioEnabled) return;
        const membrane = new Tone.MembraneSynth().toDestination();
        membrane.volume.value = volume;
        membrane.triggerAttackRelease('C1', '8n');
        setTimeout(() => {
          membrane.triggerAttackRelease('C1', '8n');
          setTimeout(() => membrane.dispose(), 500);
        }, 200);
        volume = Math.min(volume + 0.5, -6);
      };
      beat();
      heartbeatLoopRef.current = window.setInterval(beat, 3000);
    } else if (type === 'heartbeat_stop') {
      if (heartbeatLoopRef.current) {
        clearInterval(heartbeatLoopRef.current);
        heartbeatLoopRef.current = null;
      }
    } else if (type === 'tension') {
      const drone = new Tone.Oscillator('C2', 'sawtooth').toDestination();
      drone.volume.value = -30;
      drone.start();
      setTimeout(() => {
        drone.stop();
        drone.dispose();
      }, 1500);
    }
  }, [audioEnabled]);

  // 揭示时刻 — 上升音效，用于谜题解答
  const playRevelation = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.6, decay: 0.8, sustain: 0.5, release: 2 },
    }).toDestination();
    pad.volume.value = -26;
    pad.triggerAttackRelease(['A3', 'C4', 'E4'], '3n');
    setTimeout(() => pad.dispose(), 3000);
  }, [audioEnabled]);

  // 恐惧时刻 — 下行低音，用于错指认和坏结局
  const playDread = useCallback(() => {
    if (!audioEnabled || !started.current) return;
    const bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.6, sustain: 0.3, release: 2 },
    }).toDestination();
    bass.volume.value = -16;
    bass.triggerAttackRelease('G1', '2n');
    setTimeout(() => {
      bass.triggerAttackRelease('E1', '2n');
      setTimeout(() => bass.dispose(), 2500);
    }, 800);
  }, [audioEnabled]);

  const lastAmbient = useRef<string | undefined>(undefined);

  const setMood = useCallback((chapterId: string) => {
    if (!started.current) return;
    const mood = chapterMoods[chapterId] || chapterMoods.intro;
    Tone.Transport.bpm.rampTo(mood.bpm, 2);
    droneRef.current?.frequency.rampTo(mood.drone, 2);
    // 心跳渐强：时间线章开始，指认章达峰值
    if (chapterId === 'timeline') {
      playAmbient('heartbeat_loop');
    } else if (chapterId !== 'deduction') {
      playAmbient('heartbeat_stop');
    }
    // 环境音效切换 — 持续循环
    if (mood.ambient && mood.ambient !== lastAmbient.current) {
      // 先停止旧的环境音
      playAmbient('rain_stop');
      playAmbient('heartbeat_stop');
      lastAmbient.current = mood.ambient;
      if (mood.ambient !== 'silence') {
        setTimeout(() => {
          if (audioEnabled) {
            if (mood.ambient === 'rain') playAmbient('rain_start');
            else if (mood.ambient === 'wind') playAmbient('wind');
            else if (mood.ambient === 'heartbeat' || mood.ambient === 'tension') playAmbient(mood.ambient);
          }
        }, 1200);
      }
    }
  }, [audioEnabled, playAmbient]);

  return { start, playClick, playSuccess, playError, playAdvance, playHeartbeat, playClueCollect, playTension, playTypeTick, playAmbient, playRevelation, playDread, setMood };
}
