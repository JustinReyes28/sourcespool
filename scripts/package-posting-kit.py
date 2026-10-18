import argparse, hashlib, json, posixpath, re, zipfile
from pathlib import Path
parser = argparse.ArgumentParser()
parser.add_argument('--release', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
version = json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
kit = root/'docs/launch-kit'
source = kit if args.release else kit/f'draft-v{version}'
label = '' if args.release else '-draft'
archive = (kit if args.release else root/'.tmp')/f'sourcespool-v{version}{label}-posting-kit.zip'
entries = {}
for name in ['README.md','general.txt','reddit.txt','x.txt','linkedin.txt']:
    data = (source/name).read_bytes()
    if name == 'README.md' and not args.release:
        data = data.decode('utf-8').replace('](../../demo/','](../demo/').replace('](../sourcespool-v0.1.0-posting-kit.zip)','](https://github.com/JustinReyes28/ClipShelf/raw/refs/heads/main/docs/launch-kit/sourcespool-v0.1.0-posting-kit.zip)').encode('utf-8')
    if name == 'README.md' and args.release:
        data = data.decode('utf-8').replace('](sourcespool-v0.1.0-posting-kit.zip)','](https://github.com/JustinReyes28/ClipShelf/raw/refs/heads/main/docs/launch-kit/sourcespool-v0.1.0-posting-kit.zip)').encode('utf-8')
    entries[f'docs/launch-kit/{name}'] = data
for file in (root/'docs/demo').iterdir():
    if file.is_file() and file.suffix != '.zip': entries[file.relative_to(root).as_posix()] = file.read_bytes()
entries['LICENSE'] = (root/'LICENSE').read_bytes()
entries['README.txt'] = (f'SourceSpool v{version} posting kit'+(' — UNPUBLISHED DRAFT' if not args.release else '')+'\nStart with docs/launch-kit/README.md. The owner publishes independently. Historical v0.1.0 visuals illustrate the library workflow.\n').encode('utf-8')
assert len([name for name in entries if name.endswith('.png')]) == 7
captions = {name:data.decode('utf-8') for name,data in entries.items() if name.startswith('docs/launch-kit/') and name.endswith('.txt')}
assert len(captions) == 4
for name, text in captions.items(): assert 'Yoinks' in text and '0.2.0' in text
x = entries['docs/launch-kit/x.txt'].decode('utf-8').strip()
x_weighted = len(re.sub(r'https?://\S+', 'x'*23, x))
assert x_weighted <= 280
for name,data in entries.items():
    if not name.endswith('.md'): continue
    for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', data.decode('utf-8')):
        target=target.split('#')[0]
        if not target or re.match(r'^[a-zA-Z]+:',target): continue
        assert posixpath.normpath(posixpath.join(posixpath.dirname(name),target)) in entries,(name,target)
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as output:
    for name,data in sorted(entries.items()): output.writestr(name,data)
with zipfile.ZipFile(archive) as output:
    assert output.testzip() is None
    for name,data in entries.items(): assert hashlib.sha256(output.read(name)).digest() == hashlib.sha256(data).digest()
print(json.dumps({'archive':str(archive.relative_to(root)),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'entries':len(entries),'captions':4,'pngs':7,'xWeightedCharacters':x_weighted,'status':'release' if args.release else 'unpublished draft','downloads':0},indent=2))
