# Manual de uso del código

Guía práctica para ejecutar, modificar y publicar la web. Para entender *cómo* funciona por dentro, lee [ARQUITECTURA.md](ARQUITECTURA.md).

## 1. Ejecutar en local

```bash
cd atenia-web
firebase emulators:start --only hosting
```

Abre <http://localhost:5050>. El emulador sirve la carpeta `public/` igual que Firebase en producción. Para pararlo, pulsa `Ctrl+C`.

- **Caché:** `firebase.json` envía `Cache-Control: no-cache` en todos los archivos, así que el navegador comprueba siempre si hay versión nueva y cada cambio se ve al recargar.
- **Otra forma sin Firebase:** cualquier servidor estático vale, por ejemplo `npx serve public` o `python -m http.server -d public 5050`. No abras `index.html` con doble clic: en `file://` algunos navegadores bloquean partes de la página.

## 2. Probar

No hay tests automáticos en el repositorio. Antes de publicar, repasa a mano:

1. **Intro:** la animación completa dura unos 5,7 s, y el botón **Jugar** aparece al terminar.
2. **Transformación:** al pulsar Jugar, las letras van a las palas y las piezas del robot a la pelota.
3. **Partida:** juega hasta el final y comprueba el marcador, la pantalla final, **Revancha** y **Ver el logo**.
4. **Móvil:** usa las herramientas de desarrollo del navegador (`F12` → icono de móvil) en vertical. El campo debe ser más alto y la pala debe responder al deslizar el dedo.
5. **Consola** (`F12`): no debe haber errores.

Para inspeccionar el juego desde la consola del navegador:

```js
__atenia.state()   // { running, score, ball, P, AI, field }
```

> **Ojo:** si la pestaña está en segundo plano, el navegador pausa `requestAnimationFrame` y el juego se congela. Es normal y no es un fallo.

## 3. Cambios habituales

### Textos

Todos los textos de la interfaz están en español, en `public/index.html`:

| Qué | Dónde |
|---|---|
| Título y descripción de la pestaña | `<title>` y `<meta name="description">` |
| Botón "Jugar" | `<button id="play">` |
| Tarjeta de inicio (reglas, nombre, controles) | `<form id="start">` |
| Marcador ("A 5 PUNTOS", "Atenia IA") | `<div id="hud">` |
| Texto de ayuda de los controles | `<p id="hint">` |
| Botones finales | `<button id="again">` (Revancha) y `<button id="home">` (Ver el logo) |

Los textos que dependen del resultado están en `public/game.js`:

- "¡Has ganado, _nombre_!" / "Gana la IA": en la función `point()`.
- El nombre del marcador ("Tú" si no escribes ninguno): en `renderHud()`.

### Colores

Los colores de marca están definidos en dos sitios, y hay que cambiarlos en ambos:

- `public/game.js`, línea 4: `NAVY`, `TEAL`, `GREEN`, `BG`, `GREY`. Los usa el juego.
- `public/index.html`, en `:root` (`--navy`, `--teal`, `--green`, `--bg`, `--grey`). Los usan los botones y la página.

El SVG del logo lleva sus colores escritos directamente en cada pieza:

| Color | Valor |
|---|---|
| Azul marino | `#13294B` |
| Teal | `#12A39A` |
| Verde de ojos y láser | `#22C55E` |
| Gris del eslogan | `#5C6B7A` |

Para cambiar el verde del láser, busca y reemplaza `#22C55E` en `index.html`. El verde tiene además dos tonos claros: `#C9F7DA` (brillo de los ojos) y `#E3FCEC` (línea de escaneo).

### Tiempos de la animación

La animación del logo usa dos sistemas a la vez:

- **Animaciones CSS** (`<style>` dentro del `<svg>`): montaje del robot, letras, latido de la cruz, parpadeo y saludo con la cabeza. Cada regla tiene la forma `animation: nombre duración retardo …`. Por ejemplo, `#LA{… slide .75s 1.7s …}` hace que la "A" salga a los 1,7 s.
- **Animaciones SMIL** (`<animate begin="…">`): el láser, el brillo de los ojos y el texto que se va revelando. Usan los atributos `begin` y `dur`.

Si cambias la duración total, ajusta también `INTRO_MS` en `game.js`, que marca cuándo aparece el botón Jugar (ahora 5600 ms). La [tabla de tiempos](ARQUITECTURA.md#línea-de-tiempo-de-la-intro) recoge todos los valores.

### Dificultad del juego

Todo está en `public/game.js`:

| Ajuste | Dónde | Valor actual |
|---|---|---|
| Puntos para ganar | `WIN_SCORE` | 5 |
| Velocidad de saque | `serve()`: `field.w * 0.55` | 0,55 anchos de campo/s |
| Aceleración por golpe | `hitPaddle()`: `* 1.06` | +6 % por golpe |
| Velocidad máxima de la pelota | `hitPaddle()`: `field.w * 1.4` | 1,4 anchos/s |
| Velocidad de la IA | `step()`: `field.h * 1.05` | 1,05 altos de campo/s |
| Error de puntería de la IA | `hitPaddle()`: `p.h * 0.9` | hasta ±45 % de la pala |
| Tamaño de las palas | `layout()`: `ph = fh * 0.2` | 20 % del alto del campo |
| Tamaño de la pelota | `layout()`: `ball.r` | 2,8 % del ancho del campo |

Para que la IA sea **más difícil**, sube su velocidad o baja su error. Para que sea **más fácil**, haz lo contrario. Si cambias `WIN_SCORE`, cambia también los textos "5 puntos" de la tarjeta de inicio y del marcador.

### Sustituir el logo

El SVG del logo va escrito dentro de `index.html`, y el juego encuentra las piezas por su `id`. Si cambias el logo, conserva estos identificadores (o actualízalos también en `game.js`):

| `id` | Pieza |
|---|---|
| `LA`, `Lt`, `Le`, `Ln`, `La` | letras A, t, e, n, a |
| `tagline` | grupo con "Healthcare Robotics" |
| `head` | grupo de la cabeza, que contiene `eyeL` y `eyeR` |
| `body` | cuerpo del robot |
| `cross` | grupo de la cruz, con `cv` (barra vertical) y `ch` (barra horizontal) |
| `base` | barra teal |
| `shine` | brillo que recorre la base |

La pelota no lee el SVG. Dibuja el robot a partir de la constante `ROBOT` de `game.js`, con las coordenadas del icono en una placa de 140×140. Si cambia la forma del robot, actualiza también esa constante.

## 4. Publicar en Firebase

El proyecto está vinculado a `atenia-ingenia` (archivo `.firebaserc`).

```bash
firebase login                      # solo la primera vez en cada ordenador
firebase deploy --only hosting
```

Al terminar, la web queda en <https://atenia-ingenia.web.app> y en <https://atenia-ingenia.firebaseapp.com>.

- **Publicar en otro proyecto:** `firebase deploy --only hosting --project <id-del-proyecto>`.
- **Volver a una versión anterior:** en la consola de Firebase, entra en **Hosting → Historial de versiones → Restaurar**.
- **Usar un dominio propio:** en la consola de Firebase, entra en **Hosting → Agregar dominio personalizado** y sigue los pasos de DNS.

## 5. Convenciones

- Los textos de la interfaz van en español.
- Sin dependencias ni compilación: lo que hay en `public/` es lo que se publica.
- Haz un commit por cada cambio, con mensajes en español en imperativo ("Añade…", "Corrige…").
