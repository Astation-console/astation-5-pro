"""Author cinematic, seamless transform animations for the existing articulated PIX GLB.

No Blender use is claimed: the original model stays intact; we author glTF 2.0
rotation/translation keyframes for its real articulated pivot hierarchy.
"""
from __future__ import annotations
import json, math, struct
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/models/pix_mk2.glb'
TARGET = ROOT / 'public/models/pix_cinematic_6_4.glb'


def unpack(blob):
    assert blob[:4] == b'glTF' and struct.unpack_from('<I', blob, 4)[0] == 2
    off=12; payload=None; binary=None
    while off < len(blob):
        length, kind = struct.unpack_from('<I4s', blob, off)
        chunk=blob[off+8:off+8+length]
        if kind == b'JSON': payload=json.loads(chunk)
        if kind == b'BIN\0': binary=bytearray(chunk)
        off += 8+length
    assert payload is not None and binary is not None
    return payload,binary


def pack(payload,binary):
    raw=json.dumps(payload,separators=(',',':'),ensure_ascii=False).encode('utf8')
    raw += b' ' * (-len(raw)%4)
    binary += b'\0' * (-len(binary)%4)
    return b'glTF'+struct.pack('<II',2,12+8+len(raw)+8+len(binary))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+bytes(binary)


def quaternion(rx=0,ry=0,rz=0):
    """XYZ local Euler in radians, glTF quaternion xyzw."""
    c1=math.cos(rx/2);c2=math.cos(ry/2);c3=math.cos(rz/2)
    s1=math.sin(rx/2);s2=math.sin(ry/2);s3=math.sin(rz/2)
    q=(s1*c2*c3+c1*s2*s3, c1*s2*c3-s1*c2*s3, c1*c2*s3+s1*s2*c3, c1*c2*c3-s1*s2*s3)
    return tuple(v/math.sqrt(sum(w*w for w in q)) for v in q)


def ease(t):return t*t*(3-2*t)

def sample(name,t,duration):
    """Return local X/Y/Z rotation plus rig Y bob for head/arms/legs/torso."""
    u=t/duration
    s=math.sin(math.tau*u);co=math.cos(math.tau*u)
    a={k:(0.,0.,0.) for k in ('head','armL','armR','legL','legR','rig')}
    y=0.0
    if name=='Idle':
        slow=math.sin(math.tau*u)
        a['head']=(.028*slow, .04*math.sin(math.tau*u+.3),.028*math.sin(math.tau*u+.8))
        a['armL']=(.055*slow,0,-.025-.012*co)
        a['armR']=(.055*slow,0,.025+.012*co)
        a['rig']=(.015*slow,0,0);y=.028*(1-co)*.5
    elif name in ('Walk','Run'):
        amp=.70 if name=='Walk' else 1.05
        phase=math.tau*u
        a['legL']=(amp*math.sin(phase),0,.055*math.cos(phase))
        a['legR']=(-amp*math.sin(phase),0,-.055*math.cos(phase))
        a['armL']=(-amp*.74*math.sin(phase)+.05,0,-.04)
        a['armR']=(amp*.74*math.sin(phase)+.05,0,.04)
        a['head']=(-.035+ .035*math.sin(2*phase),.024*math.sin(phase+.2),.025*math.sin(phase))
        a['rig']=(.055 if name=='Run' else .024,0,.025*math.sin(phase))
        y=.024 if name=='Walk' else .034
        y+= (.048 if name=='Walk' else .072)*(1-math.cos(phase*2))*.5
    elif name in ('Jump','DoubleJump'):
        e=ease(min(1,u/.30))
        settle=ease(max(0,(u-.7)/.3))
        if name=='Jump':
            a['armL']=(-1.25*e*(1-.35*settle),0,-.15*e)
            a['armR']=(-1.25*e*(1-.35*settle),0,.15*e)
            a['legL']=(.40*e,0,-.07*e)
            a['legR']=(.4*e,0,.07*e)
            a['rig']=(-.13*e,0,0)
            a['head']=(.08*e,0,0)
            y=.065*math.sin(math.pi*u)
        else:
            flip=math.tau*min(1,ease(u))
            a['armL']=(-.97*e,0,-.38*e)
            a['armR']=(-.97*e,0,.38*e)
            a['legL']=(.58*e,0,-.12*e)
            a['legR']=(.58*e,0,.12*e)
            a['rig']=(-.18*e,flip,0)
            a['head']=(-.08*e,0,0)
            y=.14*math.sin(math.pi*u)
    elif name=='Fall':
        a['armL']=(.30,-.09,-.62)
        a['armR']=(.30,.09,.62)
        a['legL']=(-.22+.13*s,0,-.12)
        a['legR']=(-.22-.13*s,0,.12)
        a['head']=(-.18,.04*s,0)
        a['rig']=(.11,0,.022*s)
    elif name=='Land':
        strength=math.sin(math.pi*u)**2
        a['rig']=(.16*strength,0,0)
        a['armL']=(.42*strength,0,-.22*strength)
        a['armR']=(.42*strength,0,.22*strength)
        a['legL']=(-.46*strength,0,-.08*strength)
        a['legR']=(-.46*strength,0,.08*strength)
        a['head']=(.10*strength,0,0)
        y=-.13*strength
    elif name=='Dash':
        e=min(1,ease(min(u/.15,1)))
        a['rig']=(.42*e,0,0)
        a['armL']=(.82*e,0,-.22*e)
        a['armR']=(.82*e,0,.22*e)
        a['legL']=(-.26*e,0,-.08)
        a['legR']=(.26*e,0,.08)
        a['head']=(-.12*e,0,0)
        y=.05*math.sin(math.pi*u)
    elif name=='Interact':
        e=ease(min(u/.36,1))*(1-ease(max(0,(u-.70)/.3)))
        a['armR']=(-1.18*e,.20*e,.22*e)
        a['armL']=(.13*e,0,-.09*e)
        a['head']=(-.12*e,.23*e,0)
        a['rig']=(.07*e,0,0)
        y=.01*e
    elif name=='Victory':
        up=ease(min(u/.25,1))
        a['armL']=(-1.50*up,0,-.28*up)
        a['armR']=(-1.50*up,0,.28*up)
        a['head']=(-.12*up,0,.075*s)
        a['legL']=(.20*math.sin(2*math.pi*u),0,0)
        a['legR']=(-.20*math.sin(2*math.pi*u),0,0)
        a['rig']=(-.07*up,0,.06*s)
        y=.13*max(0,math.sin(3*math.pi*u))
    elif name=='Stumble':
        e=math.sin(math.pi*u)
        a['rig']=(.26*e,0,.25*e)
        a['armL']=(-.7*e,0,-.4*e)
        a['armR']=(.5*e,0,.4*e)
        a['legL']=(-.4*e,0,0)
        a['legR']=(.25*e,0,0)
        a['head']=(-.15*e,0,0)
    return a,(0,y,0)


def main():
    payload,binary=unpack(SOURCE.read_bytes())
    nodes={n.get('name'):i for i,n in enumerate(payload['nodes'])}
    targets={
      'head':nodes['PIX_HeadPivot'],
      'armL':nodes['PIX_ArmL'],
      'armR':nodes['PIX_ArmR'],
      'legL':nodes['PIX_LegL'],
      'legR':nodes['PIX_LegR'],
      'rig':nodes['PIX_Rig'],
    }
    # glTF spec prohibits animating nodes with a matrix; transform the six animated
    # hierarchy nodes to equivalent TRS without changing their child geometry.
    for idx in targets.values():
        node=payload['nodes'][idx]
        matrix=node.pop('matrix',None)
        if matrix is not None:
            m=np.array(matrix).reshape((4,4),order='F')
            assert np.allclose(m[:3,:3],np.eye(3),atol=1e-5)
            node['translation']=[float(q) for q in m[:3,3]]
        node.setdefault('rotation',[0,0,0,1]);node.setdefault('scale',[1,1,1])
    # Keep the model and all meshes/materials; replace only the animation collection.
    payload['animations']=[]
    binary += b'\0'*(-len(binary)%4)
    def accessor(values,size,keyframes=False):
        nonlocal binary
        arr=np.asarray(values,dtype='<f4').reshape(-1,size)
        byteoffset=len(binary);binary += arr.tobytes(order='C')
        view=len(payload['bufferViews'])
        payload['bufferViews'].append({'buffer':0,'byteOffset':byteoffset,'byteLength':arr.nbytes})
        acc=len(payload['accessors'])
        d={'bufferView':view,'componentType':5126,'count':len(arr),'type':{1:'SCALAR',3:'VEC3',4:'VEC4'}[size]}
        if keyframes:d['min']=[float(arr[:,0].min())];d['max']=[float(arr[:,0].max())]
        payload['accessors'].append(d)
        return acc
    clips=[('Idle',2.8,64),('Walk',.9,48),('Run',.62,48),('Jump',.55,28),('DoubleJump',.77,44),('Fall',.6,24),('Land',.3,24),('Dash',.29,24),('Interact',.72,42),('Victory',1.9,64),('Stumble',.66,36)]
    for name,duration,frames in clips:
        times=np.linspace(0,duration,frames,dtype=np.float32)
        timeAcc=accessor(times,1,True)
        animation={'name':name,'samplers':[],'channels':[]}
        for key,node in targets.items():
            values=[]
            for t in times:
                pose,_=sample(name,float(t),duration)
                values.append(quaternion(*pose[key]))
            output=accessor(values,4)
            sampler=len(animation['samplers'])
            animation['samplers'].append({'input':timeAcc,'output':output,'interpolation':'LINEAR'})
            animation['channels'].append({'sampler':sampler,'target':{'node':node,'path':'rotation'}})
        # Rig translation is breathing, footfalls and impact squashes (very small).
        positions=[sample(name,float(t),duration)[1] for t in times]
        val=accessor(positions,3)
        sampler=len(animation['samplers'])
        animation['samplers'].append({'input':timeAcc,'output':val,'interpolation':'LINEAR'})
        animation['channels'].append({'sampler':sampler,'target':{'node':targets['rig'],'path':'translation'}})
        payload['animations'].append(animation)
    payload['buffers'][0]['byteLength']=len(binary)
    payload['asset'].setdefault('extras',{})['animationRevision']='6.4.0'
    payload['asset']['generator']='ASTATION Studios - PIX Cinematic Animation Rig / procedural glTF authored keyframes'
    TARGET.write_bytes(pack(payload,binary))
    print(f'{TARGET} {TARGET.stat().st_size} bytes; {len(clips)} animation clips; original geometry preserved')

if __name__ == '__main__':main()
