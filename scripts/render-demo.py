"""Render captured production Ink frames into annotated screenshots and video inputs."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

project = Path(__file__).resolve().parent.parent
source = project / 'docs' / 'demo'
recording = json.loads((source / 'frames.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 19)
heading = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 27)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)

def render(frame, theme='dark'):
    bg, fg, muted, stroke = ('#10151b', '#f2f4f7', '#b8c0cb', '#39414b') if theme == 'dark' else ('#ffffff', '#161b22', '#495361', '#c3cad2')
    image = Image.new('RGB', (1280, 720), bg)
    draw = ImageDraw.Draw(image)
    draw.text((40, 24), 'SourceSpool 0.1.0', fill=fg, font=heading)
    draw.text((40, 66), frame['caption'], fill=muted, font=small)
    draw.line((40, 104, 1240, 104), fill=stroke, width=1)
    lines = frame['text'].strip().splitlines()
    wrapped = []
    for line in lines:
        # Captured 96-column terminal; wrap only a very long public URL/path if necessary.
        while len(line) > 102:
            wrapped.append(line[:102]); line = line[102:]
        wrapped.append(line)
    if len(wrapped) > 21:
        raise RuntimeError(f"Frame {frame['name']} does not fit: {len(wrapped)} lines")
    for index, line in enumerate(wrapped):
        draw.text((40, 124 + 23 * index), line, fill=fg, font=font)
    draw.line((40, 650, 1240, 650), fill=stroke, width=1)
    draw.text((40, 670), 'Captured production Ink text • original generated media • local HTTP • paths redacted', fill=muted, font=small)
    return image

for frame in recording['frames']:
    render(frame).save(source / (frame['name'] + '.png'))
saved = next(frame for frame in recording['frames'] if frame['name'] == '03-saved')
render(saved, 'light').save(source / '03-saved-light.png')
concat = []
for frame in recording['frames']:
    concat.extend([f"file '{frame['name']}.png'", 'duration 5'])
concat.append(f"file '{recording['frames'][-1]['name']}.png'")
(source / 'video-inputs.txt').write_text('\n'.join(concat) + '\n', encoding='utf-8')
print('Rendered six production captures and a light-theme comparison.')
