# Arquitectura

Cómo está construida la web y por qué. Para tareas concretas (cambiar colores, tiempos, publicar), consulta el [manual de uso](MANUAL.md).

## Visión general

La web es una sola página estática sin frameworks ni compilación, alojada en Firebase Hosting. Tiene dos estados:

1. **Intro.** Un `<svg id="logo">` escrito dentro de `index.html` reproduce la animación del logo. Al terminar aparece el botón **Jugar**.
2. **Juego.** Un `<canvas id="game">` a pantalla completa. Dibuja la transformación del logo y luego el Pong.

```
index.html
├── <main id="intro">
│   ├── <svg id="logo">     ← animación del logo (CSS + SMIL)
│   └── <button id="play">
├── <canvas id="game">      ← transformación + Pong (game.js)
├── <p id="hint">           ← ayuda de controles
└── <div id="end">          ← resultado, Revancha, Ver el logo
```

El SVG va escrito dentro del HTML, en lugar de cargarse con `<img>`, porque `game.js` necesita leer la posición en pantalla de cada pieza (`getBoundingClientRect`) y animar las letras para la transformación.

## Origen del logo

El logo sale de `atenia-robotics-logo.svg`, una hoja con tres variantes: el logotipo claro, el oscuro y el icono de app. Se usan dos de ellas:

- **Logotipo horizontal:** el robot hace de "i" de *Atenia*, con el eslogan "Healthcare Robotics" debajo. Es la intro.
- **Icono de app:** el robot en una placa blanca redondeada. Es la pelota.

Las piezas son vectores del archivo original, sin redibujar: cabeza, ojos, cuerpo, barras de la cruz y base. Los ojos eran naranjas (`#FF7A1A`) en el original. En la web son verdes (`#22C55E`), a juego con el láser.

**Qué representa:** el robot es la "i". La cruz médica remite al hospital. El láser de los ojos escanea, como el robot escanearía una bandeja de comida para contar calorías, y ese escaneo "escribe" el eslogan.

## Línea de tiempo de la intro

| Tiempo | Qué pasa | Mecanismo |
|---|---|---|
| 0,00 s | la base teal entra desde la izquierda | CSS `#base` |
| 0,15 s | el cuerpo sube desde abajo girando | CSS `#body` |
| 0,35 s | la cabeza cae desde arriba | CSS `#head` |
| 0,65–0,75 s | las barras de la cruz se cruzan | CSS `#cv`, `#ch` |
| 1,00–1,08 s | los ojos se encienden | CSS `#eyeL`, `#eyeR` |
| 1,40–1,70 s | n, e, t, A salen hacia la izquierda; la "a" hacia la derecha | CSS `#Ln`…`#LA`, `#La` (`slide`) |
| 2,45 s | los ojos se cargan con un brillo verde | SMIL en `#glowL`, `#glowR` |
| 2,75 s | aparecen los haces láser | SMIL en `#lasers` (opacidad) |
| 2,85–3,85 s | el escaneo recorre el eslogan y lo va revelando | SMIL en `#scanClip` (ancho del recorte) + haces |
| 4,10 s | la cruz late dos veces y un brillo recorre la base | CSS `#cross`, `#shine` |
| 4,60 s | el robot parpadea | CSS `blink` |
| 4,90 s | el robot saluda con la cabeza | CSS `nod` |
| 5,60 s | aparece el botón Jugar | `INTRO_MS` en `game.js` |

**Por qué hay dos sistemas.** Las animaciones CSS mueven piezas enteras (`transform`). El láser necesita animar atributos geométricos: los puntos del polígono del haz, las coordenadas de las líneas y el ancho del recorte. Eso solo se puede hacer con SMIL (`<animate>`). Los efectos que tienen que ir sincronizados con el láser (opacidad de los haces, brillo de los ojos) también usan SMIL, para que dependan del mismo reloj que el escaneo.

**Detalles de CSS:**

- Las reglas usan `transform-box: fill-box` para que cada pieza gire y escale sobre su propio centro.
- Las animaciones de cada pieza tienen `fill-mode: both`, de modo que antes de empezar ya están en su posición inicial, fuera de la pantalla.
- Las animaciones secundarias (`nod`, `blink`, `beat`) usan `forwards` y no `both`. Con `both` pisarían la animación de entrada desde el primer instante.

Con `prefers-reduced-motion`, todas las animaciones del logo se reducen a casi cero.

## Transformación logo → Pong

Al pulsar **Jugar** (`playBtn` en `game.js`):

1. **`layout()`** calcula el campo y las posiciones finales de las palas y la pelota.
2. **Se leen los orígenes.** Para cada pieza del robot (`head`, `eyeL`, `eyeR`, `body`, `cv`, `ch`, `base`), `getBoundingClientRect()` da su rectángulo en pantalla.
3. **Se ocultan las piezas originales del SVG.** Desde ese momento las dibuja el canvas, que está encima.
4. **Se calculan los destinos.** Cada pieza tiene su sitio dentro de la pelota según la constante `ROBOT`: coordenadas del icono en una placa de 140×140, escaladas al radio de la pelota.
5. **Las letras se animan con la Web Animations API** (`el.animate`). "A", "t", "e" y "n" viajan al centro de tu pala y la "a" al de la IA, mientras se encogen y se desvanecen. Las animaciones creadas con WAAPI tienen prioridad sobre las de CSS, así que no hace falta quitar estas últimas.
6. **`morph()`** (1,2 s) interpola cada pieza, con un pequeño escalonado entre ellas. Mientras tanto:
   - las palas crecen desde su centro;
   - el campo y el marcador aparecen poco a poco;
   - la placa blanca de la pelota aparece detrás de las piezas.
7. Al terminar, se oculta la intro (`#intro.gone`) y se llama a `startGame()`.

## Juego

Todo el estado vive en `game.js`, dentro de una función que se ejecuta al cargar (IIFE), sin variables globales salvo `window.__atenia`.

| Elemento | Qué contiene |
|---|---|
| `field` | rectángulo del campo, en píxeles CSS |
| `P`, `AI` | palas: `{x, y, w, h}` |
| `ball` | `{x, y, vx, vy, r, spin}` |
| `score` | `{p, ai}` |

**Bucle.** `loop()` se ejecuta con `requestAnimationFrame` y llama a `step(dt)` y luego a `draw()`. El tiempo sale de `performance.now()` y `dt` se limita a 33 ms, para que la pelota no atraviese las palas tras una pausa.

**Física:**

- **Saque:** desde el centro, con un ángulo aleatorio de ±17° y 0,8 s de espera.
- **Rebote en la pala:** el ángulo de salida depende de dónde golpee la pelota, hasta unos 55° en los extremos. La velocidad sube un 6 % por golpe, hasta un máximo de 1,4 anchos de campo por segundo.
- **Bordes:** rebote simple arriba y abajo. Si la pelota sale por un lateral, es punto para el otro jugador.
- **Choque:** la pelota se trata como un círculo de radio `r`, aunque se dibuje como una placa redondeada que gira.

**IA.** Cuando la pelota va hacia ella, persigue `ball.y + aiErr`. Si no, vuelve al centro. Tiene la velocidad limitada (`field.h * 1.05` por segundo), y `aiErr` cambia al azar en cada golpe. Esas dos limitaciones hacen que se le pueda ganar.

**Controles:**

- **Ratón y táctil:** fijan `pointerY`. La pala lo sigue con un suavizado.
- **Teclado:** mueve la pala a velocidad fija y anula el puntero.

**Dibujo.** Todo usa `roundRect` del canvas.

- **Tu pala:** azul marino con la cruz blanca, porque es el cuerpo del robot.
- **Pala de la IA:** teal, porque es la base.
- **Pelota:** el icono completo (`drawBall`). Gira según su dirección (`spin`) y brilla en verde unos fotogramas tras cada golpe (`flash`).

**Tamaño adaptable.** El campo mide como máximo 1000 px de ancho. En horizontal tiene proporción 0,62. En vertical (móvil) es más alto, con proporción 1,25. Al cambiar el tamaño de la ventana, `layout()` reescala las posiciones para que la partida siga donde estaba. El canvas usa `devicePixelRatio` para verse nítido en pantallas de alta densidad.

## Alojamiento

`firebase.json`:

- **`public`:** la carpeta publicada, sin paso de compilación.
- **`headers`:** caché de 1 h para `.js` y `.css`.
- **`emulators.hosting.port`:** 5050 para desarrollo local. La interfaz web del emulador está desactivada.

`.firebaserc` fija el proyecto por defecto, `atenia-ingenia`. La web publicada está en <https://atenia-ingenia.web.app>.

## Limitaciones conocidas

- **Pestaña en segundo plano:** el navegador pausa `requestAnimationFrame` y la partida se congela hasta que vuelves. Es el comportamiento estándar de los navegadores.
- **Choque de la pelota:** es circular, así que al girar, las esquinas de la placa pueden solaparse un poco con la pala.
- **Colores duplicados:** los colores de marca están repetidos en el CSS, en `game.js` y en el SVG. Ver el [manual](MANUAL.md#colores).
- **Tests:** no hay tests automáticos. La verificación es manual, con la lista del manual.
