"""Gera favicon.svg, apple-touch-icon.png e og-image.jpg a partir do logo vetorial e da foto do hero."""
import os, re, io, pymupdf
from PIL import Image, ImageDraw
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(RAIZ, 'assets', 'img')
logo = open(os.path.join(IMG, 'logo-rcm-distribuidora.svg')).read()
paths = re.findall(r'<path [^>]+/>', logo)
letras = [p for p in paths if 'fill="#FFFFFF"' in p and 'M' in p]
# letras do RCM ficam entre y 7 e 64 no viewBox do logo; DISTRIBUIDORA fica abaixo de 75
letras = [p for p in letras if float(re.search(r'd="M[\d.]+ ([\d.]+)', p).group(1)) < 70]
furos = [p for p in paths if 'fill="#2E3092"' in p and 160 < len(p) < 600]  # furo do R
s = 56 / 191
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
       '<rect width="64" height="64" rx="12" fill="#2E3092"/>'
       '<path fill="#F37421" d="M0 48H64V52A12 12 0 0 1 52 64H12A12 12 0 0 1 0 52Z"/>'
       f'<g transform="translate({4 - 24 * s:.2f} {15.6 - 7.5 * s:.2f}) scale({s:.4f})">' + ''.join(letras + furos) + '</g></svg>')
open(os.path.join(RAIZ, 'favicon.svg'), 'w').write(fav)

def rasterizar(svg, largura):
    doc = pymupdf.open(stream=svg.encode(), filetype='svg')
    pg = doc[0]; z = largura / pg.rect.width
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=True)
    return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')

rasterizar(fav, 180).save(os.path.join(RAIZ, 'apple-touch-icon.png'))

hero = Image.open(os.path.join(IMG, 'hero-centro-automotivo-elevadores.webp')).convert('RGB')
w, h = 1200, 630
hero = hero.resize((w, round(hero.height * w / hero.width)))
top = (hero.height - h) // 2
og = hero.crop((0, top, w, top + h)).convert('RGBA')
grad = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(grad)
for x in range(w):
    a = int(235 * max(0, 1 - x / (w * 0.85)) + 60)
    d.line([(x, 0), (x, h)], fill=(14, 20, 64, min(a, 245)))
og = Image.alpha_composite(og, grad)
d = ImageDraw.Draw(og)
d.polygon([(0, h - 26), (w, h - 70), (w, h - 52), (0, h - 8)], fill=(243, 116, 33, 255))
lg = rasterizar(logo, 420)
og.alpha_composite(lg, (70, 200))
og.convert('RGB').save(os.path.join(IMG, 'og-image.jpg'), quality=82)
print('ok', len(fav))
