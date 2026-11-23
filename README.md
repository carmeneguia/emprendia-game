# Asalto a EmprendIA

Plataformas estilo Super Mario hecho con **Kaplay.js 3001.0.19** (incluido en `lib/`, no hace falta instalar nada).

## Cómo jugar

```bash
python3 servir.py
```

Abre http://localhost:8080 en el navegador.

| Tecla | Acción |
|---|---|
| ← → (o A / D) | Andar · con SHIFT, correr |
| ↑ (o W) | Saltar |
| ↓ (o S) | Agacharse (caja de choque más baja; andas despacio) |
| RATÓN | Apuntar el superpoder (disparo guiado hacia la mira) |
| ESPACIO o CLIC IZQUIERDO | Superpoder del personaje |
| R | Reiniciar nivel |
| ESC | Volver al menú |
| F2 | (equipo) Completar el nivel al instante |
| F1 | (equipo) Modo depuración de Kaplay |

En el menú, la opción **Elegir nivel (equipo)** permite saltar a cualquier nivel o a la batalla final.
Desde la consola del navegador también se puede usar `juego.go("nivel", 3)`.
En la batalla final: `depurarJefe.fase(3)`, `depurarJefe.ataque("lluvia")`, `depurarJefe.ganar()`. La tecla M silencia el sonido.

## Estructura

```
index.html
lib/kaplay.mjs            Kaplay.js
src/
  main.js                 Arranque y registro de escenas
  k.js                    Instancia de Kaplay (960x540, casilla de 40 px)
  datos.js                Personajes, colores provisionales, títulos de nivel
  estado.js               Progreso guardado (desbloqueados, monedas, objetos)
  sprites.js              ← AQUÍ se conectan los sprites de los personajes
  figura.js               Dibuja un personaje (sprite o bloque provisional)
  jugador.js              Motor común del jugador (mover, saltar, superpoder)
  poderes.js              usarSuperpoder(): el ataque especial de cada personaje
  nivel.js                Constructor común de niveles (mapa ASCII, HUD, cámara, vidas, meta)
  lienzo.js               Ayudante para dibujar mapas ASCII por coordenadas
  ui.js                   Textos con sombra, carteles y paneles de instrucciones (pausan el juego)
  pintor/                 Gráficos dibujados por código con el estilo de los sprites
    base.js               Herramientas de dibujo (contorno, brillos, degradados)
    objetos.js            Monedas, enemigos, proyectiles y objetos de cada minijuego
    terreno.js            Materiales del suelo (madera, roca, mármol, metal, circuito...)
    fondos.js             Fondos ilustrados de cada nivel en dos capas
    munecos.js            Personajes provisionales para los que aún no tienen sprite
  escenas/menus.js        Prólogo de Amparo, menú, selector de niveles, cartel de desbloqueo
  escenas/final.js        Choose Your Fighter y pantalla de victoria
  escenas/jefe.js         Batalla final contra Mucientes y Chema
  sonido.js               Efectos de sonido sintetizados (Web Audio)
  niveles/n01..n10_*.js   Un archivo por nivel con su mapa y su minijuego
```

## Leyenda de los mapas ASCII

| Letra | Significado |
|---|---|
| `=` | Suelo |
| `#` | Plataforma |
| `o` | Moneda |
| `B` | Bicho enemigo (se pisa o se elimina con el superpoder) |
| `^` | Pinchos |
| `\|` | Puerta que se abre al superar el reto |
| `K` | Punto de control |
| `M` | Meta (bandera) |
| `P` | Inicio del jugador |

Cada nivel añade sus propias letras: `k` bolos, `V` voladores, `R`/`G` velas, `D` DataNodes, `S` bases, `X` muros corruptos, `A` altar o bots, `h` percheros, `c`/`v` prendas, `n` maniquíes, `?` cajas, `C` contenedores, `~` lava o agua, `J` trampolín.

## Los niveles

| # | Personaje | Superpoder | Reto |
|---|---|---|---|
| 1 | Catalá | Bola pesada (rueda con parábola) | Puntería: mantener ESPACIO para la fuerza, ↑/↓ ángulo; 10 bolos con 12 bolas |
| 2 | Mujer Fósil | Onda fosilizadora (corto alcance) | Usar voladores y rocas petrificadas (4 s) como plataformas |
| 3 | Bianca | Monedas de liquidez | Escalada vertical contra la inflación: volver verdes las velas rojas para que suban |
| 4 | El Hadoopeno | Réplica `hdfs dfs -put` | Mantener vivos los DataNodes durante 30 s |
| 5 | Guardián de las Bases | Martillo COMMIT | Hacer COMMIT al aterrizar en cada base; golpear el Altar |
| 6 | Paiboll Cheese (con Julián Patillas) | `sudo rm -rf` | Romper muros: chmod abajo, grep en medio, kill arriba |
| 7 | Bugarín | Escáner heurístico | Corriendo sin parar, seguir el camino de menor coste (energía 20) |
| 8 | PET | Depurador de punteros | Vestir a la plantilla; defenderla: 10 Bugs antes de que 3 la infecten |
| 9 | Ferrín | Ancla de mínimo global | Clavar el ancla en el valle más profundo |
| 10 | Alberto | Ping de red | Encontrar la Ballena de Docker en las cajas `?` antes de que te acorralen |
| 11 | Elegido | Disparo en diagonal (↑ = recto arriba) | Mucientes (55 golpes, 3 fases: cañón, Visión Artificial, embestida con aturdido x2, lluvia de misiles). Chema refleja disparos con su escudo |

Al derrotar a Mucientes, Chaves se puede elegir en la batalla final.

## Sprites

Cada personaje es un PNG en cuadrícula de 4 x 4: fila 1 andar, fila 2 correr, fila 3 saltar, fila 4 superpoder.

1. Copiar el PNG original en `assets/sprites/originales/`.
2. Ejecutar `python3 herramientas/procesar_sprites.py` (reduce las hojas y alinea los pies abajo).
3. Añadir el personaje en `ARCHIVOS` dentro de `src/sprites.js` (id del juego → nombre del archivo).

Conectados ahora: alberto, alvaro (El Hadoopeno), bugarin, catala, chaves, chema, ferrin, fosil, julian,
loreto (Bianca), mucientes, pabloquesada (Paiboll Cheese), pet, viqueira (Guardián de las Bases).
Las hojas pueden tener cualquier tamaño: el procesador las deja todas con celdas de 256 px.

Faltan sprites de: Amparo y los dos bots de autómatas.
Mientras tanto se usan personajes provisionales dibujados por código (`src/pintor/munecos.js`).
