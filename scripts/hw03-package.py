#!/usr/bin/env python3
"""Package the source and static build without private files or generated submission recursion."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'output/submission';out.mkdir(parents=True,exist_ok=True)
allowed_roots={'src','public','scripts','tests','docs'};allowed_files={'.gitignore','README.md','package.json','package-lock.json','astro.config.mjs','tsconfig.json'}
paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
source=[]
for name in sorted(set(paths)):
 if not name:continue
 p=Path(name)
 if (p.parts[0] in allowed_roots or name in allowed_files) and name!='public/hw03/replay-engine.js' and (root/p).is_file():source.append(p)
with zipfile.ZipFile(out/'hw03-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for p in source:archive.write(root/p,'hw03-source/'+p.as_posix())
if not (root/'dist/hw03/index.html').is_file() or not (root/'dist/hw03/replay-engine.js').is_file():raise SystemExit('Run npm run build before packaging.')
with zipfile.ZipFile(out/'hw03-static.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for p in sorted((root/'dist').rglob('*')):
  if p.is_file():archive.write(p,p.relative_to(root/'dist').as_posix())
for name in ['hw03-source.zip','hw03-static.zip']:
 with zipfile.ZipFile(out/name) as archive:
  if archive.testzip():raise SystemExit('Archive integrity check failed: '+name)
metadata={name:{'bytes':(out/name).stat().st_size,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()} for name in ['hw03-source.zip','hw03-static.zip','hw03-demo.mp4','hw03-highlights.pdf'] if (out/name).exists()}
(out/'checksums.json').write_text(json.dumps({'sourceFiles':len(source),'artifacts':metadata},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sourceFiles':len(source),'artifacts':metadata},indent=2))
