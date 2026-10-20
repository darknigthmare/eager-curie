#!/usr/bin/env python3
"""Verify or rebuild the pinned MIT Rocketbox human assets.

Default/--verify performs read-only local integrity and glTF structure checks.
--rebuild downloads hash-checked FBX/TGA sources to .tools/model-vendor, requires
Blender4.3.2 and Pillow, retargets three real clips and stages optimized GLBs.
--stage-only checks the rebuilt bytes without changing production assets.
The source FBX, TGA, .blend and intermediate GLBs never ship to the website.
"""
import argparse
import concurrent.futures
import hashlib
import io
import json
import math
import os
from pathlib import Path
import shutil
import struct
import subprocess
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/models/rocketbox'
WORK=ROOT/'.tools/model-vendor'
COMMIT='0943055db6ec570bcef9f2c8b41c9e5467c808f9'
BASE=f'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/{COMMIT}/'
SOURCES=[
  {
    "path": "Assets/Animations/all_animations_max_motextr_static/m_idle_breathe_01.max.fbx",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Animations/all_animations_max_motextr_static/m_idle_breathe_01.max.fbx",
    "bytes": 1397280,
    "sha256": "281735704260d96e882d13e3c77d0ede00ed5d2e40805cd305000b3e5cbb1090"
  },
  {
    "path": "Assets/Animations/all_animations_max_motextr_xy/m_run_neutral_01.max.fbx",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Animations/all_animations_max_motextr_xy/m_run_neutral_01.max.fbx",
    "bytes": 868752,
    "sha256": "5a22052ea750805ea7e097310f36cd448c838e7c88bc842a78632d9606869fa8"
  },
  {
    "path": "Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral_01.max.fbx",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral_01.max.fbx",
    "bytes": 994336,
    "sha256": "e6805ae6b6b49fe10f06c1b17b14ddde90d09b9fea689ac34793df252f44dcd0"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Export/Medical_Male_01.fbx",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Export/Medical_Male_01.fbx",
    "bytes": 552016,
    "sha256": "11df553be0a51691034be585ac402a933a530bb8e5529d6dba7a7462b87e5a3b"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_color.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_color.tga",
    "bytes": 12582956,
    "sha256": "717b4569cac7b96fc8eadc4de001156af9f86138f4cc80764d1642024e91c145"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_normal.tga",
    "bytes": 12582956,
    "sha256": "127c58dce77b212dc68fd4605ca666214438167cc76717fb791aabf46f974e04"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_body_specular.tga",
    "bytes": 12582956,
    "sha256": "0c285cf77dae89f5d9c6390418ea8837754a8b9b2e9a2dd59658d5da506cb41c"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_color.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_color.tga",
    "bytes": 12582956,
    "sha256": "2422f9dacdbbe78a3c5ac2f593a541ab324ec41c8c65993f120a6864ab50c8f8"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_normal.tga",
    "bytes": 12582956,
    "sha256": "15c30dc6fe690d4779157f5ba1b76c60929e1992a47998cafe9750289f76f014"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_head_specular.tga",
    "bytes": 12582956,
    "sha256": "e1b349311a612d1ce172cf254bcb69953de07827fd9778aeec6f200e6ce2d3fc"
  },
  {
    "path": "Assets/Avatars/Professions/Medical_Male_01/Textures/m152_opacity_color.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Textures/m152_opacity_color.tga",
    "bytes": 4194348,
    "sha256": "7793ea45a31c2153cf1ef7319ce67c60fd6c84d59767ceb3e9f7f88160a720d9"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Export/Military_Male_01.fbx",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Export/Military_Male_01.fbx",
    "bytes": 908640,
    "sha256": "b041e9a605a9bead434a9d1ec51fec42e4118f1a991f373de945d69c87de0c59"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_color_acu.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_color_acu.tga",
    "bytes": 12582956,
    "sha256": "40a1afc4dfac8bebf1c61c36819a17fbe3bda0a3132da0b3a1aca3792e79d32d"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_normal.tga",
    "bytes": 12582956,
    "sha256": "74aca26d86b22aad0c7caa2264e61739f3ec134a86113746a2cd6b7312ac2862"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_body_specular.tga",
    "bytes": 12582956,
    "sha256": "d8f75ba85061db0b8a8f59d165b5c90cb93445863a00e9a6083c8e7079178ed8"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_color.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_color.tga",
    "bytes": 3145772,
    "sha256": "d5c5859086d45d11e499716722378675b2e8d9af2171c891258e5db1f9e5abd6"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_normal.tga",
    "bytes": 3145772,
    "sha256": "8ec2e0cec48e0bef52dfd0107bdbbe2810ada80a81035d7ed8c6cfbbe79be64c"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_combat_knife_specular.tga",
    "bytes": 3145772,
    "sha256": "c58f6aa6fe16db5b7ac2b2c7953626bf2684ec1d6c8eafadbf788df8c07cd39a"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_color_acu.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_color_acu.tga",
    "bytes": 6291500,
    "sha256": "e90b760549eda17b25b79cbfc2a831212a2791dd738bcea08f3e8941f0b0cfe3"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_normal.tga",
    "bytes": 6291500,
    "sha256": "89b0eed4f6359e0710fb14ac1df923bce1e433436dbe4449a20d72f06b9b037e"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_equipment_specular.tga",
    "bytes": 6291500,
    "sha256": "9d4efb3b7432365f51879c362aeca6d248634b659b7a513e3d63bf336b807fce"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_color.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_color.tga",
    "bytes": 12582956,
    "sha256": "b936215716e3caeed3f6a1d2462bef885022e11593659f4ddf531a138ed5ddcd"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_normal.tga",
    "bytes": 12582956,
    "sha256": "df10a68a22b65681c75cd2cf127496a9f031380d098f652701bc2e0bc9be7669"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_head_specular.tga",
    "bytes": 12582956,
    "sha256": "ff329d98691c93be405ab319081c0292be2f993d8fc61040b6fe90540992066b"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_color_acu.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_color_acu.tga",
    "bytes": 12582956,
    "sha256": "a36cd586d57d01a6febfd3ade796437a4507196595b93e65285d73a1d3eeb414"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_normal.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_normal.tga",
    "bytes": 12582956,
    "sha256": "21cf5391c1c1c6278197d5d0f4610a3fc27e4f26972aadbe04f2ded9f42bf70d"
  },
  {
    "path": "Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_specular.tga",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Textures/sm002_helmet_specular.tga",
    "bytes": 12582956,
    "sha256": "716cc7ba1997c33b8c750149c73ff852c4202fa3c456bb218004ee9436f83d10"
  },
  {
    "path": "LICENSE.md",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/LICENSE.md",
    "bytes": 1066,
    "sha256": "17474e386e0b9e1a700cc3d06b2b0882a2c376d9c6b49c7f8274409b8f8d2352"
  },
  {
    "path": "README.md",
    "url": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/README.md",
    "bytes": 5345,
    "sha256": "bcf8013e3d5817a5dee5d1770b9943278189cd76b2d9b2abc243db99b703ecd6"
  }
]
MODELS=[
  {
    "assetId": "Medical_Male_01",
    "runtimeId": "scientist",
    "file": "medical-male-01.glb",
    "bytes": 5734080,
    "sha256": "354ee0d8ee57700ed779b1c36ab672ffbe922befdf020fa6dadffe9417b49559",
    "source": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Medical_Male_01/Export/Medical_Male_01.fbx",
    "triangles": 7581,
    "bones": 80,
    "drawPrimitives": 3,
    "images": 5,
    "clips": [
      "Idle",
      "Walk",
      "Run"
    ],
    "nativeHeight": 1.8064528703689575,
    "up": "+Y",
    "forward": "+Z"
  },
  {
    "assetId": "Military_Male_01",
    "runtimeId": "marine",
    "file": "military-male-01.glb",
    "bytes": 11677056,
    "sha256": "eeb6cb864d13e8abe39debe276a59dfce7c5e643e65d2ae9e7b46642e87f7b9d",
    "source": "https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/0943055db6ec570bcef9f2c8b41c9e5467c808f9/Assets/Avatars/Professions/Military_Male_01/Export/Military_Male_01.fbx",
    "triangles": 15387,
    "bones": 80,
    "drawPrimitives": 5,
    "images": 10,
    "clips": [
      "Idle",
      "Walk",
      "Run"
    ],
    "nativeHeight": 1.8441038131713867,
    "up": "+Y",
    "forward": "+Z"
  }
]

CONVERT_SCRIPT=r'''
import os
import bpy,json,os,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(os.environ['HIVE_MODEL_WORKSPACE'])
OUT=ROOT/'converted';OUT.mkdir(exist_ok=True)
reports=[]
for name in ['Medical_Male_01','Military_Male_01']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 folder=ROOT/'Assets'/'Avatars'/'Professions'/name
 bpy.ops.import_scene.fbx(filepath=str(folder/'Export'/f'{name}.fbx'),use_anim=False)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 # The FBX reference take contains no movement. Do not export it as an animation.
 for o in bpy.context.scene.objects:
  o.animation_data_clear()
  if o.type=='EMPTY':bpy.data.objects.remove(o,do_unlink=True)
 for m in set(m for o in meshes for m in o.data.materials):
  m.use_nodes=True;m.node_tree.nodes.clear();nodes=m.node_tree.nodes;links=m.node_tree.links
  bs=nodes.new('ShaderNodeBsdfPrincipled');out=nodes.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
  files=list((folder/'Textures').glob(m.name+'_color*.png'))
  if not files:raise RuntimeError('Missing color '+m.name)
  color=nodes.new('ShaderNodeTexImage');color.image=bpy.data.images.load(str(files[0]));links.new(color.outputs['Color'],bs.inputs['Base Color'])
  bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.56 if 'head'in m.name else .74
  bs.inputs['Specular IOR Level'].default_value=.35
  normalfile=folder/'Textures'/(m.name+'_normal.png')
  if normalfile.exists():
   tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(normalfile));tex.image.colorspace_settings.name='Non-Color'
   normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.65
   links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
  if 'opacity'in m.name:
   links.new(color.outputs['Alpha'],bs.inputs['Alpha']);m.surface_render_method='DITHERED'
   m.use_transparency_overlap=False;m.use_backface_culling=False
  else:m.use_backface_culling=True
  m.diffuse_color=(1,1,1,1)
 for o in meshes:
  for p in o.data.polygons:p.use_smooth=True
 provenance={'assetId':name,'author':'Microsoft / Rocketbox','license':'MIT','sourceUrl':'https://github.com/microsoft/Microsoft-Rocketbox/tree/master/Assets/Avatars/Professions/'+name}
 root=bpy.data.objects.new('rocketbox_'+name,None);bpy.context.scene.collection.objects.link(root)
 root['assetId']=name;root['assetSource']=provenance['sourceUrl'];root['assetLicense']='MIT'
 matrix=arm.matrix_world.copy();arm.parent=root;arm.matrix_world=matrix
 for mesh in meshes:
  matrix=mesh.matrix_world.copy();mesh.parent=root;mesh.matrix_world=matrix
  bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bpy.context.view_layer.update()
 bounds=[o.matrix_world@Vector(b)for o in meshes for b in o.bound_box]
 bmin=[min(v[i]for v in bounds)for i in range(3)];bmax=[max(v[i]for v in bounds)for i in range(3)]
 out=OUT/(name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_animations=False,export_skins=True,export_extras=True,export_image_format='AUTO',export_normals=True,export_tangents=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
 report={**provenance,'file':str(out),'bytes':out.stat().st_size,'height':bmax[2]-bmin[2],'groundOffset':-bmin[2],'forward':'+Z','up':'+Y','boundsZup':{'min':bmin,'max':bmax},'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in meshes),'bones':len(arm.data.bones),'materials':len(set(m.name for o in meshes for m in o.data.materials)),'boneNames':[b.name for b in arm.data.bones]}
 reports.append(report)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')))
 print('HIVE_CONVERTED',json.dumps(report))
(ROOT/'converted-report.json').write_text(json.dumps(reports,indent=2))

'''

ANIMATE_SCRIPT=r'''
import os
"""Bake matching Rocketbox skeleton world poses across different FBX bind poses."""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(os.environ['HIVE_MODEL_WORKSPACE']);OUT=ROOT/'converted'
reports=[]
clips=[('Idle','all_animations_max_motextr_static','m_idle_breathe_01.max.fbx'),('Walk','all_animations_max_motextr_xy','m_walk_neutral_01.max.fbx'),('Run','all_animations_max_motextr_xy','m_run_neutral_01.max.fbx')]
for name in ['Medical_Male_01','Military_Male_01']:
 bpy.ops.wm.open_mainfile(filepath=str(OUT/(name+'.blend')))
 target=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');target.animation_data_create();target.animation_data.action=None
 actions=[]
 for clip,folder,filename in clips:
  old=set(bpy.context.scene.objects);bpy.ops.import_scene.fbx(filepath=str(ROOT/'Assets'/'Animations'/folder/filename),use_anim=True)
  added=set(bpy.context.scene.objects)-old;src=next(o for o in added if o.type=='ARMATURE');sourceaction=src.animation_data.action
  start,end=map(int,sourceaction.frame_range);act=bpy.data.actions.new(clip);target.animation_data.action=act
  target.rotation_mode='QUATERNION'
  for frame in range(start,end+1):
   bpy.context.scene.frame_set(frame)
   loc,rot,scale=src.matrix_world.decompose();loc.x=0;loc.y=0
   target.location=loc;target.rotation_quaternion=rot;target.scale=scale
   target.keyframe_insert('location',frame=frame);target.keyframe_insert('rotation_quaternion',frame=frame)
   for pb in target.pose.bones:
    sp=src.pose.bones.get(pb.name)
    if not sp:continue
    kwargs={}
    if pb.parent:
     kwargs={'parent_matrix':src.pose.bones[pb.parent.name].matrix,'parent_matrix_local':pb.parent.bone.matrix_local}
    basis=pb.bone.convert_local_to_pose(sp.matrix,pb.bone.matrix_local,invert=True,**kwargs)
    pl,pr,ps=basis.decompose();pb.rotation_mode='QUATERNION';pb.location=pl;pb.rotation_quaternion=pr;pb.scale=ps
    pb.keyframe_insert('location',frame=frame);pb.keyframe_insert('rotation_quaternion',frame=frame);pb.keyframe_insert('scale',frame=frame)
  for f in act.fcurves:
   for p in f.keyframe_points:p.interpolation='LINEAR'
  actions.append((clip,start,act));target.animation_data.action=None
  for o in added:bpy.data.objects.remove(o,do_unlink=True)
  reports.append({'model':name,'clip':clip,'frames':[start,end],'fps':30,'source':str(ROOT/'Assets'/'Animations'/folder/filename),'curves':len(act.fcurves),'method':'absolute armature-space poses rebaked into target bind pose; horizontal root motion removed'})
 for clip,start,act in actions:
  track=target.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,start,act);strip.name=clip;strip.extrapolation='NOTHING';strip.blend_type='REPLACE'
 target.animation_data.action=None;bpy.context.scene.render.fps=30
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'-animated.glb')),export_format='GLB',export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=False,export_force_sampling=True,export_skins=True,export_extras=True,export_image_format='AUTO',export_normals=True,export_tangents=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
 print('ANIMATED',name)
(ROOT/'transferred-animation-report.json').write_text(json.dumps(reports,indent=2));print('HIVE_ANIMATED',json.dumps(reports))

'''

COMPACT_SCRIPT=r'''
import os
"""Retain 2048px image detail; compress RGB images and alpha-test hair cards."""
import json,struct,io
from pathlib import Path
from PIL import Image
for path in (Path(os.environ['HIVE_MODEL_WORKSPACE'])/'converted').glob('*-animated.glb'):
 b=path.read_bytes();jlen=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+jlen]);blob=b[20+jlen+8:];chunks=[];size=0
 images={im['bufferView']:im for im in d.get('images',[])}
 static_path=path.with_name(path.stem.replace('-animated','')+'.glb');sb=static_path.read_bytes();sjl=struct.unpack_from('<I',sb,12)[0];sd=json.loads(sb[20:20+sjl]);sbin=sb[20+sjl+8:]
 replacements={}
 for skin,sskin in zip(d['skins'],sd['skins']):
  av=d['accessors'][skin['inverseBindMatrices']];sv=sd['accessors'][sskin['inverseBindMatrices']];view=sd['bufferViews'][sv['bufferView']];start=view.get('byteOffset',0)+sv.get('byteOffset',0)
  replacements[av['bufferView']]=sbin[start:start+sv['count']*64]
 static_nodes={n.get('name'):n for n in sd['nodes']}
 for node in d['nodes']:
  if node.get('name')=='Bip01':
   for key in ['translation','rotation','scale']:
    if key in static_nodes['Bip01']:node[key]=static_nodes['Bip01'][key]
    else:node.pop(key,None)
 for i,v in enumerate(d['bufferViews']):
  data=replacements.get(i,blob[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
  if i in images:
   im=Image.open(io.BytesIO(data));alpha=im.mode=='RGBA'and im.getextrema()[3]!=(255,255);out=io.BytesIO()
   if alpha:im.save(out,format='PNG',compress_level=6);images[i]['mimeType']='image/png'
   else:im.convert('RGB').save(out,format='JPEG',quality=90,optimize=True,subsampling=0);images[i]['mimeType']='image/jpeg'
   data=out.getvalue()
  v['byteOffset']=size;v['byteLength']=len(data);chunk=data+b'\0'*((-len(data))%4);chunks.append(chunk);size+=len(chunk)
 binary=b''.join(chunks);d['buffers'][0]['byteLength']=len(binary)
 for m in d['materials']:
  if 'opacity'in m.get('name',''):m['alphaMode']='MASK';m['alphaCutoff']=.45
  if m.get('extensions',{}).get('KHR_materials_specular'):
   del m['extensions']['KHR_materials_specular']
   if not m['extensions']:del m['extensions']
 d['extensionsUsed']=[e for e in d.get('extensionsUsed',[])if e!='KHR_materials_specular']
 for m in d['materials']:
  if 'opacity' in m.get('name',''):
   m['extensions']={'KHR_materials_unlit':{}}
   d['extensionsUsed']=list(dict.fromkeys(d['extensionsUsed']+['KHR_materials_unlit']))
 j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 out=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(binary))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(binary),b'BIN\0')+binary
 target=path.with_name(path.stem.replace('-animated','-web')+'.glb');target.write_bytes(out)
 print(target.name,len(out),'animations',[(a['name'],len(a['channels']))for a in d.get('animations',[])])

'''


def digest(data):
    return hashlib.sha256(data).hexdigest()


def document(data):
    magic,version,length=struct.unpack_from('<4sII',data)
    assert magic==b'glTF' and version==2 and length==len(data),'Invalid GLB header'
    size,kind=struct.unpack_from('<I4s',data,12)
    assert kind==b'JSON','GLB JSON chunk is missing'
    doc=json.loads(data[20:20+size])
    binsize,binkind=struct.unpack_from('<I4s',data,20+size)
    assert binkind==b'BIN\0','GLB binary chunk is missing'
    blob=data[28+size:28+size+binsize]
    return doc,blob


def check_model(path,expected):
    data=path.read_bytes()
    assert len(data)==expected['bytes'] and digest(data)==expected['sha256'],f'Integrity mismatch: {path}'
    doc,blob=document(data)
    assert all('uri'not in image and image.get('mimeType')in['image/png','image/jpeg']for image in doc['images']),'Images must remain embedded PNG/JPEG'
    assert all('uri'not in buffer for buffer in doc['buffers']),'External buffer dependency'
    assert len(doc['skins'])==1 and len(doc['skins'][0]['joints'])==80,'Skin or joints missing'
    assert {a['name']for a in doc['animations']}=={'Idle','Walk','Run'},'Expected real animation clips'
    primitives=[p for mesh in doc['meshes']for p in mesh['primitives']]
    assert len(primitives)==expected['drawPrimitives']
    triangles=sum(doc['accessors'][p['indices']]['count']//3 for p in primitives)
    assert triangles==expected['triangles']
    assert any(n.get('name')=='Bip01 Head'for n in doc['nodes']),'Missing head bone'
    assert any(n.get('extras',{}).get('assetLicense')=='MIT'for n in doc['nodes']),'Missing license provenance'
    # Inspect actual numeric geometry/skin/animation buffers, excluding images.
    for accessor in doc['accessors']:
        if accessor.get('componentType')!=5126 or 'bufferView'not in accessor:
            continue
        view=doc['bufferViews'][accessor['bufferView']]
        count=accessor['count']*{'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[accessor['type']]
        start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
        assert view.get('byteStride')is None,'Unexpected interleaved float data'
        assert all(math.isfinite(n)for n in struct.unpack_from('<'+'f'*count,blob,start)),'Nonfinite float buffer'
    return f"{path.name}: SHA-256, embedded images, {triangles} triangles, 80 bones, 3 clips PASS"


def fetch_source(spec):
    path=WORK/spec['path']
    if path.exists()and digest(path.read_bytes())==spec['sha256']:
        return
    with urllib.request.urlopen(BASE+spec['path'],timeout=60)as response:
        data=response.read(64*1024*1024+1)
    assert len(data)==spec['bytes']and digest(data)==spec['sha256'],f"Source integrity mismatch: {spec['path']}"
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)


def rebuild(blender,stage_only):
    from PIL import Image
    WORK.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4)as executor:
        list(executor.map(fetch_source,SOURCES))
    assert 'MIT' in (WORK/'LICENSE.md').read_text()
    assert 'The library of avatars is now released under MIT License.'in(WORK/'README.md').read_text()
    for path in(WORK/'Assets/Avatars').rglob('*.tga'):
        Image.open(path).save(path.with_suffix('.png'),compress_level=6)
    env={**os.environ,'HIVE_MODEL_WORKSPACE':str(WORK)}
    for label,source in [('convert',CONVERT_SCRIPT),('animate',ANIMATE_SCRIPT)]:
        script=WORK/(label+'.py');script.write_text(source)
        result=subprocess.run([blender,'--background','--threads','2','--python',str(script)],env=env,capture_output=True,text=True)
        (WORK/(label+'.log')).write_text(result.stdout+result.stderr)
        if result.returncode:
            raise RuntimeError(f'Blender {label} failed; see {WORK/(label+".log")}')
    script=WORK/'compact.py';script.write_text(COMPACT_SCRIPT)
    result=subprocess.run([os.sys.executable,str(script)],env=env,capture_output=True,text=True)
    (WORK/'compact.log').write_text(result.stdout+result.stderr)
    if result.returncode:
        raise RuntimeError(f'Image packing failed; see {WORK/"compact.log"}')
    staged=[]
    for expected in MODELS:
        candidate=WORK/'converted'/(expected['assetId']+'-web.glb')
        print(check_model(candidate,expected));staged.append((candidate,OUT/expected['file']))
    if not stage_only:
        for candidate,target in staged:
            temporary=target.with_suffix('.glb.tmp');shutil.copyfile(candidate,temporary);temporary.replace(target)
    print('Staging verification complete.'if stage_only else'Rebuilt verified GLBs promoted.')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify',action='store_true',help='Read-only verification (default)')
    parser.add_argument('--rebuild',action='store_true',help='Download pinned sources and rebuild all GLBs')
    parser.add_argument('--stage-only',action='store_true',help='Keep rebuilt GLBs in ignored .tools directory')
    parser.add_argument('--blender',default=shutil.which('blender')or'blender')
    args=parser.parse_args()
    if args.rebuild:
        rebuild(args.blender,args.stage_only)
    else:
        for expected in MODELS:
            print(check_model(OUT/expected['file'],expected))
        manifest=json.loads((ROOT/'assets/models/manifest.json').read_text())
        for role in ['civilian','medical','synthetic','guard','security','soldier','corporate','smartgunner','incinerator','commando']:
            expected='scientist'if role in ['civilian','medical','synthetic']else'marine'
            assert manifest['models'][role]['alias']==expected,f'Missing role alias: {role}'
        print('Human role aliases PASS')
        license=(OUT/'LICENSE-Microsoft-Rocketbox.txt').read_text()
        assert 'MIT License'in license and 'Copyright (c) 2020 Microsoft'in license
        print('Official Microsoft MIT asset license PASS')


if __name__=='__main__':
    main()
