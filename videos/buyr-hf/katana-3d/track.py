import cv2,numpy as np,json,os
SEEDS=json.load(open('seeds.json')); out={}
for clip in sorted(os.listdir('seg')):
    fs=sorted(os.listdir(f'seg/{clip}')); imgs=[cv2.imread(f'seg/{clip}/{f}',0) for f in fs]
    H,W=imgs[0].shape; sx,sy,bw,bh=SEEDS[clip]; cx,cy=sx*W,sy*H
    def det(img):
        m=np.zeros_like(img); m[int(max(0,cy-bh*H/2)):int(min(H,cy+bh*H/2)),int(max(0,cx-bw*W/2)):int(min(W,cx+bw*W/2))]=255
        return cv2.goodFeaturesToTrack(img,80,0.01,6,mask=m)
    pts=det(imgs[0]); tr=[[cx/W,cy/H]]
    for i in range(1,len(imgs)):
        if pts is None or len(pts)<8: pts=det(imgs[i-1])
        if pts is None: tr.append([cx/W,cy/H]); continue
        nx,st,_=cv2.calcOpticalFlowPyrLK(imgs[i-1],imgs[i],pts,None,winSize=(31,31),maxLevel=3); g=st.ravel()==1
        if g.sum()<4: tr.append([cx/W,cy/H]); pts=None; continue
        dx,dy=np.median((nx[g]-pts[g]).reshape(-1,2),axis=0)
        cx=float(np.clip(cx+dx,.08*W,.92*W)); cy=float(np.clip(cy+dy,.08*H,.92*H)); pts=nx[g].reshape(-1,1,2); tr.append([cx/W,cy/H])
    a=np.array(tr)
    if len(a)>4:
        k=np.ones(3)/3; a[1:-1,0]=np.convolve(a[:,0],k,'valid'); a[1:-1,1]=np.convolve(a[:,1],k,'valid')
    out[clip]=[[round(x,4),round(y,4)] for x,y in a]
json.dump(out,open('tracks.json','w')); print(len(out))
