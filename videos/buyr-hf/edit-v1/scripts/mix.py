# Sound design (motion-video-director §9) on the measured beats from audiomap.json. Output: cache/mix.wav
import json, subprocess
BT = json.load(open('audiomap.json'))['grid']['beats_sec']; END = 24.621
EV = [('thud',BT[0],.7),('whoosh',BT[4],.5),('thud',BT[4],.5),('pop',BT[7],.6),('pop',BT[10],.6),('pop',BT[13],.6),
      ('whoosh',BT[16],.4),('thud',BT[16],.7),('riser',BT[19],.45),
      ('tap',BT[21],1),('thud',BT[21],.4),('tap',BT[22],1),('thud',BT[22],.4),('tap',BT[23],1),('thud',BT[23],.4),
      ('boom',BT[24],.9),('thud',BT[24],.8),('whoosh',BT[28],.4),('thud',BT[28],.6),('whoosh',BT[32],.4),('thud',BT[32],.6),
      ('whoosh',BT[36],.5),('pop',BT[37],.5),('pop',BT[38],.5),('tap',BT[39],1),('sparkle',BT[39],.5)]
EV += [('tap', BT[k], .35) for k in range(25, 36) if k not in (28, 32)]
args = ['ffmpeg','-nostdin','-v','error','-y','-i','assets/bgm.mp3']
for n,_,_ in EV: args += ['-i', f'assets/sfx/{n}.wav']
f = [f'[0:a]atrim=0:{END},afade=t=out:st={END-0.6}:d=0.6,aresample=48000[m]']
for i,(n,t,v) in enumerate(EV): f.append(f'[{i+1}:a]aresample=48000,volume={v},adelay={int(t*1000)}|{int(t*1000)}[s{i}]')
f.append('[m]' + ''.join(f'[s{i}]' for i in range(len(EV))) + f'amix=inputs={len(EV)+1}:normalize=0,atrim=0:{END}[out]')
subprocess.run(args + ['-filter_complex', ';'.join(f), '-map', '[out]', '-c:a', 'pcm_s16le', 'cache/mix.wav'], check=True)
print('mixed', len(EV), 'sfx')
