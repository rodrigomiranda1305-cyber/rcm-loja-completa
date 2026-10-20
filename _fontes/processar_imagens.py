"""Gera as imagens otimizadas do site a partir de _fontes/fotos e do catalogo PDF.
Uso: python _fontes/processar_imagens.py"""
import os, pymupdf
from PIL import Image, ImageFilter, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, '_fontes', 'fotos')
OUT = os.path.join(RAIZ, 'assets', 'img')
os.makedirs(os.path.join(OUT, 'produtos'), exist_ok=True)

def blur(im, boxes):
    for b in boxes:
        reg = im.crop(b).filter(ImageFilter.GaussianBlur(14))
        im.paste(reg, b)
    return im

def salvar(src, nome, maxw=1000, boxes=(), crop=None, q=72):
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, src))).convert('RGB')
    im = blur(im, boxes)
    if crop: im = im.crop(crop)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    dst = os.path.join(OUT, nome + '.webp')
    im.save(dst, 'WEBP', quality=q, method=6)
    print(f'{nome}.webp {im.size} {os.path.getsize(dst)//1024}KB  <- {src}')

# (arquivo original, nome final, largura max, caixas para desfocar placas/telefones)
FOTOS = [
    ('PHOTO-2026-07-15-10-24-29.jpg', 'hero-centro-automotivo-elevadores', 1920, [(250, 608, 305, 655)]),
    ('PHOTO-2026-10-01-16-44-59.jpg', 'hero-rampa-alinhamento-saveiro', 1000, []),
    ('PHOTO-2026-09-11-17-52-42.jpg', 'tipo-centro-automotivo-rampa-alinhamento', 800, []),
    ('PHOTO-2026-02-11-14-27-47.jpg', 'tipo-borracharia-desmontadora-balanceadora', 800, []),
    ('PHOTO-2026-07-09-15-43-06.jpg', 'tipo-oficina-mecanica-elevador', 800, [(455, 605, 645, 685)]),
    ('PHOTO-2026-08-10-15-16-58.jpg', 'tipo-troca-de-oleo-rampa', 800, []),
    ('PHOTO-2025-11-18-08-29-38.jpg', 'entrega-caminhao-equipamentos', 1000, [(40, 690, 150, 800), (115, 760, 215, 830)]),
    ('PHOTO-2026-07-14-10-34-25.jpg', 'showroom-elevador-rcm', 1000, []),
    ('PHOTO-2026-10-13-16-14-07.jpg', 'cta-galpao-rampa-pneumatica', 1000, []),
    # galeria
    ('PHOTO-2026-06-19-14-03-01.jpg', 'loja-elevadores-pretos-galpao', 1000, [(675, 540, 760, 585)]),
    ('PHOTO-2026-08-04-15-46-07.jpg', 'loja-elevador-vermelho-fachada', 1000, [(465, 250, 670, 340)]),
    ('PHOTO-2026-10-14-13-17-31.jpg', 'loja-elevador-vermelho-parede-amarela', 1000, []),
    ('PHOTO-2026-06-19-18-07-20.jpg', 'loja-elevador-vermelho-loja-nova', 1000, []),
    ('PHOTO-2026-09-11-17-54-01.jpg', 'loja-elevadores-pretos-iluminacao', 1000, []),
    ('PHOTO-2026-02-28-15-58-04.jpg', 'loja-elevador-azul-tecnico', 1000, []),
    ('PHOTO-2026-09-11-17-52-40.jpg', 'loja-rampas-alinhamento-vermelhas', 1000, []),
    ('PHOTO-2026-07-09-15-43-07.jpg', 'loja-elevadores-pretos-oficina', 1000, []),
    ('PHOTO-2026-05-29-15-43-08.jpg', 'loja-elevador-azul-oficina', 1000, [(1470, 615, 1600, 725)]),
    ('PHOTO-2026-02-27-13-23-40.jpg', 'loja-alinhador-3d-tecnico', 1000, []),
    ('PHOTO-2026-03-03-09-03-00.jpg', 'loja-balanceadora-azul', 1000, []),
    ('PHOTO-2026-09-11-17-52-43.jpg', 'loja-desmontadora-vermelha', 1000, []),
    ('PHOTO-2025-11-14-18-08-54.jpg', 'loja-rampa-alinhamento-extra-longa', 1000, []),
]
for src, nome, w, boxes in FOTOS:
    salvar(src, nome, w, boxes)
    if nome != 'hero-rampa-alinhamento-saveiro':
        salvar(src, nome + '-480', 480, boxes, q=68)  # versão leve para celular (srcset)

# versão leve do hero para celular (LCP)
salvar('PHOTO-2026-10-01-16-44-59.jpg', 'hero-rampa-alinhamento-saveiro-720', 720, [], q=64)

# Produtos do catalogo (pagina 5): xref da imagem -> nome
PRODUTOS = {
    90: 'carrinho-para-ferramentas', 89: 'jogo-de-ferramentas-para-oficina', 59: 'kit-de-ferramentas-para-oficinas',
    63: 'macaco-jacare-3-toneladas', 73: 'par-de-cavaletes-3t', 76: 'chave-de-impacto',
    68: 'prensa-hidraulica-30-toneladas', 69: 'guincho-hidraulico-1-tonelada', 75: 'compressor-de-ar-20-pes',
    57: 'rede-de-ar-comprimido', 66: 'engraxadeira-pneumatica', 54: 'coletor-de-oleo',
    85: 'maquina-troca-oleo-cambio-automatico', 70: 'scanner-multimec', 72: 'calibrador-de-pneus',
    60: 'torno-de-bancada', 61: 'moto-esmeril', 91: 'desempenador-de-rodas',
}
pdf = pymupdf.open(os.path.join(RAIZ, 'RCM_CATALOGO DE PRODUTOS (1).pdf'))
for xref, nome in PRODUTOS.items():
    info = pdf.extract_image(xref)
    tmp = os.path.join(OUT, 'produtos', '_tmp.' + info['ext'])
    open(tmp, 'wb').write(info['image'])
    im = Image.open(tmp).convert('RGB')
    dst = os.path.join(OUT, 'produtos', nome + '.webp')
    im.save(dst, 'WEBP', quality=80, method=6)
    os.remove(tmp)
    print(f'produtos/{nome}.webp {im.size} {os.path.getsize(dst)//1024}KB')
