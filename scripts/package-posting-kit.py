import argparse, hashlib, json, posixpath, re, struct, zipfile
from pathlib import Path
parser = argparse.ArgumentParser()
parser.add_argument('--release', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
version = json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
kit = root/'docs/launch-kit'
recording = json.loads((root/'docs/demo/frames.json').read_text(encoding='utf-8'))
if args.release:
    assert recording['version'] == version, 'Recapture the demo for the current app version first'
source = kit if args.release else kit/f'draft-v{version}'
label = '' if args.release else '-draft'
archive = (kit if args.release else root/'.tmp')/f'sourcespool-v{version}{label}-posting-kit.zip'
entries = {}
for name in ['README.md','general.txt','reddit.txt','x.txt','linkedin.txt']:
    data = (source/name).read_bytes()
    if name == 'README.md' and not args.release:
        data = data.decode('utf-8').replace('](../../demo/','](../demo/').replace('](../sourcespool-v0.1.0-posting-kit.zip)','](https://github.com/JustinReyes28/sourcespool/raw/refs/heads/main/docs/launch-kit/sourcespool-v0.1.0-posting-kit.zip)').encode('utf-8')
    if name == 'README.md' and args.release:
        text = data.decode('utf-8')
        for archive_version in ['0.1.0', version]:
            filename = f'sourcespool-v{archive_version}-posting-kit.zip'
            text = text.replace(f']({filename})', f'](https://github.com/JustinReyes28/sourcespool/raw/refs/heads/main/docs/launch-kit/{filename})')
        data = text.encode('utf-8')
    entries[f'docs/launch-kit/{name}'] = data
for file in (root/'docs/demo').iterdir():
    if file.is_file() and file.suffix != '.zip': entries[file.relative_to(root).as_posix()] = file.read_bytes()
for name in ['LICENSE', 'CONTRIBUTING.md', 'docs/installation.md', 'docs/tool-provenance.md']:
    entries[name] = (root/name).read_bytes()
entries['README.txt'] = (f'SourceSpool v{version} posting kit'+(' — ARCHIVED CAPTION DRAFTS' if not args.release else '')+f"\nStart with docs/launch-kit/README.md. Workflow captures: v{recording['version']} development checkout, {recording['recordedAt']}. The owner publishes independently.\n").encode('utf-8')
assert len([name for name in entries if name.endswith('.png')]) == 7
for name, data in entries.items():
    if name.endswith('.png'):
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', data[16:24]) == (1280, 720), name
captions = {name:data.decode('utf-8') for name,data in entries.items() if name.startswith('docs/launch-kit/') and name.endswith('.txt')}
assert len(captions) == 4
for name, text in captions.items(): assert 'Yoinks' in text and version in text
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
