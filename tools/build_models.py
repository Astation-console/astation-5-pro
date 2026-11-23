"""Produce original, detailed glTF 2.0 assets for ASTATION PIX 6.2 without Blender.
PIX v2 adds geometry to an existing animated GLB, preserving original three clips.
"""
from __future__ import annotations
import json, struct, copy, math
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

BASE=Path(__file__).resolve().parents[1]
ASSETS=BASE/'public/models'
ASSETS.mkdir(parents=True,exist_ok=True)

PALETTE={
  'ceramic': ('#E9F8FF',.08,.23,None),
  'porcelain':('#C5E8F6',.12,.28,None),
  'titanium':('#2E607D',.72,.3,None),
  'dark':('#102D50',.62,.22,None),
  'midnight':('#0A1A37',.3,.16,None),
  'copper':('#F0B47E',.56,.28,None),
  'cyan':('#65F9FF',.14,.20,'#1BE1F0'),
  'aqua':('#90FFC6',.08,.17,'#55F5AD'),
  'amber':('#FFD77C',.15,.24,'#F0AF3A'),
  'pink':('#F4A7DE',.13,.19,'#D96AE3'),
  'violet':('#BDA6FF',.18,.28,'#875AF1'),
  'guardian':('#424C89',.6,.3,None),
}
def rgba(h):
 h=h.strip('#');return [int(h[i:i+2],16) for i in (0,2,4)]+[255]
def pbr(k):
 h,m,r,e=PALETTE[k];
 return PBRMaterial(name='PIX_Material_'+k, baseColorFactor=rgba(h),metallicFactor=m,roughnessFactor=r,emissiveFactor=[int(e[i:i+2],16)/255 for i in (1,3,5)] if e else [0,0,0])
def xform(v):
 mat=np.eye(4);mat[:3,3]=v;return mat

def uv_sphere(center,scale,detail=2):
 g=trimesh.creation.icosphere(subdivisions=detail,radius=1);g.apply_scale(scale);g.apply_translation(center);return g

def cylinder(center,radius,height,segments=16, direction=(0,1,0)):
 g=trimesh.creation.cylinder(radius=radius,height=height,sections=segments)
 # trimesh cylinders along Z: rotate to direction
 direct=np.array(direction,float);direct/=np.linalg.norm(direct)
 rot=trimesh.geometry.align_vectors([0,0,1],direct)
 g.apply_transform(rot);g.apply_translation(center);return g

def torus(center,R,r=0.03,n=36,t=8,plane='xy'):
 vv=[];faces=[]
 for i in range(n):
  a=2*math.pi*i/n
  for j in range(t):
   b=2*math.pi*j/t
   x=(R+r*math.cos(b))*math.cos(a); y=(R+r*math.cos(b))*math.sin(a);z=r*math.sin(b)
   if plane=='xz':x,y,z=x,z,y
   if plane=='yz':x,y,z=z,x,y
   vv.append([x+center[0],y+center[1],z+center[2]])
 for i in range(n):
  for j in range(t):
   a=i*t+j;b=((i+1)%n)*t+j;c=((i+1)%n)*t+(j+1)%t;d=i*t+(j+1)%t
   faces.append([a,b,c]);faces.append([a,c,d])
 return trimesh.Trimesh(vertices=vv,faces=faces,process=False)

def bar(a,b,r,segments=12):
 a=np.array(a,float);b=np.array(b,float);delta=b-a
 return cylinder((a+b)/2,r,float(np.linalg.norm(delta)),segments,direction=delta)

class Pack:
 def __init__(self):self.scene=trimesh.Scene();self.counter=0;self.pivots={}
 def add(self,mesh,material,name,parent='world'):
  mesh.visual=trimesh.visual.TextureVisuals(material=pbr(material))
  self.counter+=1
  self.scene.add_geometry(mesh,node_name=f'{name}_{self.counter}',geom_name=f'{name}_{self.counter}')
  self.pivots[f'{name}_{self.counter}']=parent
 def export(self):return trimesh.exchange.gltf.export_glb(self.scene)

pix=Pack()
# Finely segmented helmet hardware; eye and visor geometry remain from the original animated GLB.
for x in (-.495,.495):
 pix.add(uv_sphere((x,2.2,-.03),(.095,.27,.22),2),'titanium','ear_sensor','PIX_HeadPivot')
 pix.add(torus((x*1.02,2.21,-.09),.125,.018,28,7,'yz'),'cyan','ear_status','PIX_HeadPivot')
 pix.add(uv_sphere((x*1.01,2.21,-.153),(.058,.058,.038),2),'aqua','ear_beacon','PIX_HeadPivot')
for x in (-.36,.36):
 pix.add(bar((x,2.32,-.48),(x*.9,2.43,-.36),.022),'cyan','visor_rim','PIX_HeadPivot')
 pix.add(bar((x*.85,1.91,-.465),(x*.6,1.86,-.39),.02),'porcelain','chin_trim','PIX_HeadPivot')
pix.add(bar((-.37,2.4,-.38),(.37,2.4,-.38),.037),'titanium','brow','PIX_HeadPivot')
pix.add(bar((-.31,1.88,-.39),(.31,1.88,-.39),.023),'cyan','jaw_light','PIX_HeadPivot')
pix.add(uv_sphere((0,2.66,0),(.23,.068,.29),2),'porcelain','forehead_crest','PIX_HeadPivot')
for i in range(6):
 x=-.16+i*.064
 pix.add(bar((x,2.7,.10),(x,2.75,.23),.012),'dark','head_vent','PIX_HeadPivot')
# Chest composite layered core, sloping segmented armor ribs, 2 jet-pods in rear.
for side in (-1,1):
 pix.add(uv_sphere((side*.47,1.48,-.26),(.16,.21,.13),2),'porcelain','chest_plate','PIX_Rig')
 pix.add(uv_sphere((side*.31,1.36,-.36),(.16,.095,.05),2),'titanium','chest_vent','PIX_Rig')
 for j in range(3):
  y=1.16+j*.13
  pix.add(bar((side*.20,y,-.39),(side*.40,y+.07,-.29),.019),'cyan','chest_stripe','PIX_Rig')
 pix.add(uv_sphere((side*.30,1.3,.39),(.19,.40,.16),2),'titanium','thruster_pod','PIX_Rig')
 pix.add(torus((side*.30,1.08,.54),.11,.027,28,6,'xy'),'amber','thruster_nozzle','PIX_Rig')
 pix.add(uv_sphere((side*.30,1.07,.53),(.075,.07,.043),2),'cyan','thruster_flame','PIX_Rig')
pix.add(torus((0,1.43,-.41),.16,.027,36,9,'xy'),'cyan','core_ring','PIX_Rig')
pix.add(uv_sphere((0,1.43,-.46),(.085,.085,.03),2),'aqua','core_center','PIX_Rig')
pix.add(bar((-.31,.76,-.34),(.31,.76,-.34),.027),'titanium','waist_belt','PIX_Rig')
# Shoulder shells, ringed wrist armor and articulated gloved hands.
for side,arm,leg in ((-1,'PIX_ArmL','PIX_LegL'),(1,'PIX_ArmR','PIX_LegR')):
 pix.add(uv_sphere((side*.69,1.76,-.08),(.20,.13,.21),2),'porcelain','pauldron_cap',arm)
 pix.add(bar((side*.74,1.72,-.25),(side*.83,1.55,-.19),.035),'cyan','arm_glow',arm)
 for y in (1.08,1.13):pix.add(torus((side*.67,y,-.02),.17,.018,24,6,'xz'),'titanium','wrist_emblem',arm)
 pix.add(uv_sphere((side*.69,.94,-.15),(.105,.092,.11),2),'dark','knuckle_guard',arm)
 for j in range(3):
  xx=side*(.60+.055*j)
  pix.add(uv_sphere((xx,.84,-.23),(.025,.07,.045),1),'porcelain','finger',arm)
 # leg front detail and luminous knee caps
 pix.add(uv_sphere((side*.29,.48,-.22),(.15,.27,.06),2),'porcelain','shin_plate',leg)
 pix.add(uv_sphere((side*.29,.72,-.23),(.12,.11,.045),2),'titanium','knee_plate',leg)
 pix.add(uv_sphere((side*.29,.73,-.27),(.048,.05,.018),2),'cyan','knee_indicator',leg)
 pix.add(bar((side*.13,.05,-.47),(side*.42,.05,-.47),.028),'aqua','toe_strip',leg)
 pix.add(uv_sphere((side*.29,.13,.21),(.13,.17,.09),2),'titanium','heel_motor',leg)
 pix.add(torus((side*.29,.12,.27),.07,.016,20,6,'xz'),'amber','heel_light',leg)

# Separate fully modeled guardian — multi-part stylized crystal construct, unlike old icosahedron.
guard=Pack()
guard.add(uv_sphere((0,0,0),(0.81,.89,.68),3),'guardian','core')
guard.add(uv_sphere((0,.08,-.46),(.60,.42,.27),3),'midnight','visor')
guard.add(uv_sphere((-.23,.11,-.69),(.13,.12,.04),2),'pink','eye_left')
guard.add(uv_sphere((.23,.11,-.69),(.13,.12,.04),2),'pink','eye_right')
for side in (-1,1):
 guard.add(uv_sphere((side*.80,.18,.05),(.37,.25,.31),2),'titanium','shoulder_shell')
 guard.add(bar((side*.8,.1,.1),(side*1.12,-.44,-.1),.17),'guardian','forearm')
 guard.add(uv_sphere((side*1.14,-.46,-.14),(.24,.18,.21),2),'copper','claw')
 for j in range(3):
  guard.add(bar((side*(1.02+j*.11),-.51,-.27),(side*(1.02+j*.11),-.78,-.35),.055),'pink','fingertip')
 guard.add(uv_sphere((side*.43,-.65,.15),(.21,.25,.18),2),'titanium','lower_jet')
 guard.add(torus((side*.43,-.9,.15),.14,.03,32,7,'xz'),'amber','jet_halo')
for x in (-.33,.33):
 guard.add(bar((x,.68,-.08),(x*1.7,1.2,.26),.085),'violet','crown_horn')
 guard.add(uv_sphere((x*1.7,1.2,.26),(.11,.19,.11),2),'pink','horn_tip')
for i in range(6):
 a=math.tau*i/6
 guard.add(uv_sphere((math.cos(a)*.65,.01+math.sin(a)*.66,.25),(.1,.1,.20),2),'violet','back_rune')
guard.add(torus((0,0,.45),.55,.045,40,7,'xy'),'cyan','rear_ring')


def glb_unpack(blob):
 assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,4)[0]==2
 at=12;j=None;binary=b''
 while at<len(blob):
  length,typ=struct.unpack_from('<I4s',blob,at);start=at+8;part=blob[start:start+length]
  if typ==b'JSON':j=json.loads(part)
  elif typ==b'BIN\x00':binary=part
  at=start+length
 return j,binary

def glb_pack(j,bin_data):
 js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode('utf8')
 js+=b' ' * ((-len(js))%4)
 bb=bytes(bin_data);bb+=b'\x00' * ((-len(bb))%4)
 out=b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(bb))
 return out+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(bb),b'BIN\x00')+bb

def merge_pix(base,addon,parents):
 bj,bb=glb_unpack(base);aj,ab=glb_unpack(addon)
 # All addon geometry is non-textured PBR; no skins/images/animations in addon.
 assert not aj.get('images') and not aj.get('textures')
 offs=len(bb); meshOff=len(bj['meshes']);matOff=len(bj.get('materials',[]));accOff=len(bj.get('accessors',[]));bvOff=len(bj['bufferViews']); nodeOff=len(bj['nodes'])
 for v in aj['bufferViews']:
  q=copy.deepcopy(v);q['byteOffset']=q.get('byteOffset',0)+offs;bj['bufferViews'].append(q)
 for a in aj['accessors']:
  q=copy.deepcopy(a);q['bufferView']+=bvOff;bj['accessors'].append(q)
 bj.setdefault('materials',[]).extend(aj.get('materials',[]))
 for mesh in aj['meshes']:
  q=copy.deepcopy(mesh)
  for prim in q['primitives']:
   for attr,idx in prim['attributes'].items():prim['attributes'][attr]=idx+accOff
   if 'indices' in prim:prim['indices']+=accOff
   if 'material' in prim:prim['material']+=matOff
  bj['meshes'].append(q)
 baseParents={n.get('name'):i for i,n in enumerate(bj['nodes'])}
 for idx,node in enumerate(aj['nodes']):
  if 'mesh' not in node:continue
  q=copy.deepcopy(node);q['mesh']+=meshOff; q.pop('children',None)
  parent=parents.get(node.get('name',''),'PIX_Rig')
  if parent not in baseParents:raise RuntimeError(f'Unknown parent {parent}')
  # IMPORTANT: Add-on mesh vertices were authored in PIX_Rig/world coordinates.
  # Original Head/Arm/Leg pivots have nonzero resting translations, so parenting
  # without compensating their transform doubles the offset and creates broken,
  # stretched-looking characters. Convert authored world-space into parent-local.
  def node_matrix(n):
   if 'matrix' in n:return np.array(n['matrix'],float).reshape(4,4,order='F')
   matrix=np.eye(4);matrix[:3,3]=n.get('translation',[0,0,0]);return matrix
  baseParent=bj['nodes'][baseParents[parent]]
  worldParent=node_matrix(baseParent)
  localAddon=node_matrix(q)
  fixed=np.linalg.inv(worldParent) @ localAddon
  q.pop('translation',None);q.pop('rotation',None);q.pop('scale',None)
  q['matrix']=list(fixed.flatten(order='F'))
  bj['nodes'].append(q)
  bj['nodes'][baseParents[parent]].setdefault('children',[]).append(len(bj['nodes'])-1)
 bj['buffers'][0]['byteLength']=offs+len(ab)
 bj['asset']['generator']='ASTATION Studios — PIX MK II geometry enhancement / preserved animation rig'
 # asset.extras not required; annotations for build and visual appearance
 bj['asset'].setdefault('extras',{})['revision']='6.3.0'
 return glb_pack(bj,bb+ab)

# Two reusable scenery prefabs. Geometry is authored as glTF mesh data, not 2D cards.
tree=Pack()
tree.add(cylinder((0,.76,0),.18,1.52,12),'copper','trunk')
tree.add(cylinder((0,.76,0),.14,1.56,12),'titanium','bark_detail')
for i in range(5):
 a=i*math.tau/5
 p=(math.sin(a)*.74,1.66+(.18 if i%2 else 0),math.cos(a)*.75)
 tree.add(bar((0,1.30,0),p,.085,12),'copper','branch')
 tree.add(uv_sphere(p,(.72,.72,.74),2),'aqua' if i%3==0 else 'guardian','leaves')
 tree.add(uv_sphere((p[0]+.16,p[1]+.35,p[2]),(.53,.50,.53),2),'aqua','upper_leaves')
for i in range(4):
 a=math.tau*i/4;tree.add(bar((0,.2,0),(math.sin(a)*.45,.10,math.cos(a)*.45),.09,10),'copper','root')
tree.add(uv_sphere((0,2.35,0),(.74,.65,.74),2),'aqua','crown')
for i in range(8):
 a=math.tau*i/8
 tree.add(uv_sphere((math.sin(a)*.8,1.4+math.cos(a)*.36,math.cos(a)*.7),(.08,.08,.08),1),'pink' if i%2 else 'amber','sparkfruit')
(ASSETS/'dream_tree_mk2.glb').write_bytes(tree.export())
shrine=Pack()
for side in (-1,1):
 shrine.add(cylinder((side*1.55,.86,0),.20,1.72,12),'porcelain','column')
 shrine.add(cylinder((side*1.55,1.65,0),.28,.22,12),'titanium','column_cap')
 shrine.add(cylinder((side*1.55,.18,0),.36,.34,12),'titanium','column_base')
 shrine.add(uv_sphere((side*1.55,1.92,0),(.23,.22,.28),2),'cyan','column_gem')
 for y in (.35,.85,1.35):
  shrine.add(torus((side*1.55,y,0),.24,.035,24,6,'xz'),'copper','column_ring')
shrine.add(bar((-1.55,1.91,0),(1.55,1.91,0),.22,16),'porcelain','arch_lintel')
shrine.add(uv_sphere((0,2.04,0),(.42,.34,.31),2),'titanium','keystone')
shrine.add(uv_sphere((0,2.06,-.31),(.19,.18,.05),2),'cyan','arch_symbol')
for j in range(7):
 x=(j-3)*.43
 shrine.add(uv_sphere((x,2.13,0),(.18,.06,.26),1),'porcelain','arch_tiles')
(ASSETS/'dream_arch_mk2.glb').write_bytes(shrine.export())

pixaddon=pix.export(); original=(ASSETS/'pix.glb').read_bytes()
(ASSETS/'pix_mk2.glb').write_bytes(merge_pix(original,pixaddon,pix.pivots))
(ASSETS/'guardian_mk2.glb').write_bytes(guard.export())

for f in ('pix_mk2.glb','guardian_mk2.glb','dream_tree_mk2.glb','dream_arch_mk2.glb'):
 p=ASSETS/f;j,_=glb_unpack(p.read_bytes());s=trimesh.load(p,force='scene')
 print(f,p.stat().st_size,'bytes, meshes',len(j.get('meshes',[])),'nodes',len(j['nodes']),'clips',[a.get('name')for a in j.get('animations',[])],'materials',len(j.get('materials',[])))
