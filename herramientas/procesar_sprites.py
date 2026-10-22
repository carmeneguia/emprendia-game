"""Prepara las hojas de sprites para el juego.

Entrada: assets/sprites/originales/<nombre>.png
  - Cuadrícula de 4 columnas x 4 filas (celdas cuadradas).
  - Fila 1 andar, fila 2 correr, fila 3 saltar, fila 4 superpoder.
Salida:  assets/sprites/<nombre>.png  (más pequeña, con los pies alineados abajo)
         assets/sprites/medidas.json (tamaño de celda de cada hoja)

Uso:  python3 herramientas/procesar_sprites.py
"""
import json
import os
import sys

from PIL import Image

CELDA_FINAL = 256  # todas las hojas acaban con celdas de 256 px, sea cual sea su tamaño original
COLUMNAS = 4
FILAS = 4
UMBRAL = 40        # alfa mínimo para considerar un píxel "visible"
# Personajes que flotan: se usa la celda entera (sin alinear los pies abajo)
SIN_RECORTE = {"chema", "mucientes"}

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
origen = os.path.join(raiz, "assets", "sprites", "originales")
destino = os.path.join(raiz, "assets", "sprites")


def filas_visibles(alfa):
    """Lista de booleanos: si cada fila de píxeles de la celda tiene algo visible."""
    ancho, alto = alfa.size
    return [alfa.crop((0, y, ancho, y + 1)).getbbox() is not None for y in range(alto)]


def limpiar_restos_arriba(celda):
    """Borra trocitos de la fila de arriba (pies del fotograma anterior) que asoman en el borde superior."""
    alfa = celda.split()[3].point(lambda v: 255 if v > UMBRAL else 0)
    vis = filas_visibles(alfa)
    if not vis[0]:
        return celda
    # buscar un hueco vacío de al menos 3 filas en los primeros 60 px
    y = 0
    while y < 60 and vis[y]:
        y += 1
    hueco = 0
    while y + hueco < len(vis) and not vis[y + hueco]:
        hueco += 1
    if y < 60 and hueco >= 3:
        limpia = celda.copy()
        limpia.paste((0, 0, 0, 0), (0, 0, celda.size[0], y))
        return limpia
    return celda


def procesar(nombre):
    hoja = Image.open(os.path.join(origen, nombre)).convert("RGBA")
    lado = hoja.size[0] // COLUMNAS
    celdas = [[limpiar_restos_arriba(hoja.crop((c * lado, f * lado, (c + 1) * lado, (f + 1) * lado)))
               for c in range(COLUMNAS)] for f in range(FILAS)]

    # Línea de los pies: la parte más baja de los fotogramas de andar
    pies = 0
    for celda in celdas[0]:
        bb = celda.split()[3].point(lambda v: 255 if v > UMBRAL else 0).getbbox()
        if bb:
            pies = max(pies, bb[3])
    alto_celda = lado if os.path.splitext(nombre)[0] in SIN_RECORTE else min(lado, pies + 2)

    escala = CELDA_FINAL / lado
    ancho_final = CELDA_FINAL
    alto_final = round(alto_celda * escala)
    salida = Image.new("RGBA", (ancho_final * COLUMNAS, alto_final * FILAS), (0, 0, 0, 0))
    for f in range(FILAS):
        for c in range(COLUMNAS):
            recorte = celdas[f][c].crop((0, 0, lado, alto_celda))
            peque = recorte.resize((ancho_final, alto_final), Image.LANCZOS)
            salida.paste(peque, (c * ancho_final, f * alto_final))
    salida.save(os.path.join(destino, nombre), optimize=True)
    return {"ancho": ancho_final, "alto": alto_final, "quieto": fotograma_quieto(celdas[0], pies)}


def fotograma_quieto(fila_andar, pies):
    """Fotograma de andar con los pies más juntos (sirve como postura de estar parado)."""
    mejor, ancho_min = 0, None
    for i, celda in enumerate(fila_andar):
        lado = celda.size[0]
        franja = celda.crop((0, int(pies * 0.82), lado, pies)).split()[3].point(lambda v: 255 if v > UMBRAL else 0)
        bb = franja.getbbox()
        if bb and (ancho_min is None or bb[2] - bb[0] < ancho_min):
            mejor, ancho_min = i, bb[2] - bb[0]
    return mejor


def main():
    medidas = {}
    for nombre in sorted(os.listdir(origen)):
        if nombre.lower().endswith(".png"):
            medidas[os.path.splitext(nombre)[0]] = procesar(nombre)
            print("ok", nombre, medidas[os.path.splitext(nombre)[0]])
    with open(os.path.join(destino, "medidas.json"), "w") as f:
        json.dump(medidas, f, indent=2)
    # el juego lee qué fotograma usar para estar quieto
    quietos = {n: m["quieto"] for n, m in medidas.items()}
    with open(os.path.join(raiz, "src", "sprites_quieto.js"), "w") as f:
        f.write("// Generado por herramientas/procesar_sprites.py: fotograma de \"quieto\" de cada hoja (no editar a mano)\n")
        f.write("export const QUIETO = " + json.dumps(quietos, indent=2) + ";\n")


if __name__ == "__main__":
    sys.exit(main())
