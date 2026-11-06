# Sound design (motion-video-director §9): music bed + SFX placed on visual events. Output: cache/mix.wav
import subprocess
EV = [('thud',.075,.5),('thud',.675,.8),('whoosh',.675,.35),('whoosh',2.475,.5),('pop',3.075,.5),('whoosh',4.275,.4),
      ('tap',4.275,.8),('tap',5.475,.8),('tap',6.675,.8),('tap',7.275,.8),
      ('thud',9.255,.9),('thud',9.855,.9),('thud',10.455,.9),('whoosh',11.475,.6),('riser',11.475,.45),
      ('tap',12.675,1),('tap',13.275,1),('tap',13.875,1),('thud',12.675,.35),('thud',13.275,.35),('thud',13.875,.35),
      ('boom',14.475,.9),('thud',14.475,.8),('thud',15.075,.7),('sparkle',16.875,.6),('whoosh',16.875,.3),
      ('whoosh',18.075,.5),('pop',18.675,.6),('whoosh',19.875,.5),('pop',19.975,.5),('thud',20.475,.5),('pop',21.075,.5),('pop',21.675,.6),
      ('tap',23.075,1),('sparkle',23.075,.5)]
args = ['ffmpeg','-nostdin','-v','error','-y','-i','assets/music_track.mp3']
for n,_,_ in EV: args += ['-i', f'assets/sfx/{n}.wav']
f = ['[0:a]atrim=0:24.63,afade=t=out:st=24.03:d=0.6,aresample=48000[m]']
for i,(n,t,v) in enumerate(EV): f.append(f'[{i+1}:a]aresample=48000,volume={v},adelay={int(t*1000)}|{int(t*1000)}[s{i}]')
f.append('[m]' + ''.join(f'[s{i}]' for i in range(len(EV))) + f'amix=inputs={len(EV)+1}:normalize=0,atrim=0:24.63[out]')
subprocess.run(args + ['-filter_complex', ';'.join(f), '-map', '[out]', '-c:a', 'pcm_s16le', 'cache/mix.wav'], check=True)
print('mixed', len(EV), 'sfx')
