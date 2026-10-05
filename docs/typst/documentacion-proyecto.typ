#import "plantilla-atenia.typ": *

#show: documento.with(
  titulo: "Documentación de proyecto",
  subtitulo: "Web de Atenia: animación del logo y Pong contra la IA",
  autor: "Mario Castro",
  fecha: datetime(year: 2026, month: 10, day: 5),
  version: "1.1",
)

= Resumen

*Atenia Healthcare Robotics* desarrolla un robot para hospitales con un sistema de seguimiento de calorías. Esta web es su carta de presentación: muestra el logo con una animación y después propone una partida de Pong contra la IA en la que las piezas del robot se convierten en el juego.

#grid(
  columns: (1fr, 1fr), column-gutter: 14pt,
  nota(titulo: "Dirección")[
    #link("https://atenia-ingenia.web.app")[atenia-ingenia.web.app]
  ],
  nota(tipo: "aviso", titulo: "Requisitos")[
    Un navegador actual, en ordenador o móvil. No hay que instalar nada ni crear cuenta.
  ],
)

#v(10pt)
#align(center, box(width: 55%, logo(width: 100%)))

= Manual de uso

== Entrar en la web

Abre #link("https://atenia-ingenia.web.app")[atenia-ingenia.web.app]. La animación del logo empieza sola: el robot se monta, aparece el nombre y el robot escanea el eslogan "Healthcare Robotics". Dura unos seis segundos y no hace falta tocar nada. Al terminar aparece el botón *Jugar*.

#captura("capturas/01-inicio.png")[Pantalla de inicio al terminar la animación.]

== Preparar la partida

Pulsa *Jugar*. El logo se transforma en el campo de juego: el cuerpo del robot pasa a ser tu pala, la base la pala de la IA y uno de los ojos la pelota. Después aparece la tarjeta de inicio.

#grid(
  columns: (1fr, 1.15fr), column-gutter: 16pt, align: horizon,
  captura("capturas/02-tarjeta.png")[Tarjeta de inicio.],
  [
    + Escribe tu nombre en *¿Cómo te llamas?* Es opcional: si lo dejas vacío, el marcador pone "Tú". Admite hasta 14 caracteres.
    + Revisa los controles que muestra la tarjeta.
    + Pulsa *Empezar* o la tecla *Intro*.

    El nombre se recuerda en este navegador, así que la próxima vez ya aparece escrito.
  ],
)

== Jugar

Controlas la pala azul marino de la izquierda. La IA controla la teal de la derecha. Devuelve la pelota para que no salga por tu lado: cada vez que sale por un lado, el otro jugador suma un punto. *Gana quien llegue antes a 5.*

#table(
  columns: (auto, 1fr),
  table.header[Dispositivo][Cómo mover la pala],
  [Ratón], [Mueve el ratón arriba y abajo en cualquier parte de la pantalla. La pala sigue al puntero.],
  [Teclado], [Flechas ↑ ↓ o teclas W y S.],
  [Pantalla táctil], [Desliza el dedo arriba y abajo en cualquier parte de la pantalla.],
)

#captura("capturas/03-partida.png")[Partida en curso, 2 – 0 a favor del jugador.]

*El marcador*, encima del campo, muestra a la izquierda tu inicial, tu nombre y tus puntos, y a la derecha los de la IA ("Atenia IA"). Los cinco puntos bajo cada nombre se van rellenando con cada tanto.

*Cómo se juega cada punto:*
- La pelota sale del centro tras una breve pausa, hacia un lado al azar en el primer saque y después hacia quien acaba de ganar el punto.
- Rebota en los bordes de arriba y de abajo.
- Si la golpeas con el centro de la pala sale recta. Con los extremos sale en diagonal, hasta unos 55°.
- Cada golpe la acelera un poco, así que los peloteos largos se vuelven más rápidos.

#nota(titulo: "Consejo para ganar")[
  La IA se mueve con velocidad limitada y no siempre apunta bien. Golpea con los extremos de la pala para mandar la pelota en diagonal hacia las esquinas: es donde más le cuesta llegar.
]

== Final de la partida

Cuando alguien llega a 5 puntos, el juego se detiene y aparece el resultado: "¡Has ganado, _tu nombre_!" o "Gana la IA".

#captura("capturas/04-final.png")[Resultado de una partida que ganó la IA por 1 – 5.]

- *Revancha:* empieza otra partida al momento, con el mismo nombre.
- *Ver el logo:* vuelve al principio, con la animación. Úsalo si quieres cambiar el nombre: al pulsar Jugar otra vez puedes editarlo en la tarjeta.

== En el móvil

La web se adapta a la pantalla. En vertical el campo es más alto que ancho, y la pala se mueve deslizando el dedo en cualquier parte de la pantalla. Al empezar, un aviso bajo el campo recuerda los controles.

#grid(
  columns: (1fr, 1fr), column-gutter: 30pt,
  captura("capturas/05-movil-inicio.png")[Inicio en un móvil.],
  captura("capturas/06-movil-partida.png")[Partida en un móvil.],
)

== Preguntas frecuentes

#table(
  columns: (auto, 1fr),
  table.header[Pregunta][Respuesta],
  [La partida se ha quedado quieta], [El navegador detiene el juego cuando la pestaña no está visible. Vuelve a la pestaña y sigue donde estaba.],
  [¿Cómo cambio mi nombre?], [Al terminar la partida pulsa *Ver el logo*, después *Jugar*, y edítalo en la tarjeta.],
  [¿Se puede pausar?], [No hay botón de pausa. Cambiar de pestaña detiene el juego hasta que vuelves.],
  [¿Se guarda algún dato?], [Solo tu nombre, y solo en tu navegador. No se envía nada a ningún servidor.],
  [¿Tiene sonido?], [No.],
)

= Documentación técnica

== Componentes

#table(
  columns: (auto, 1fr),
  table.header[Archivo][Contenido],
  [`public/index.html`], [Página: estilos, logo animado (SVG), tarjeta de inicio, marcador y diálogo final],
  [`public/game.js`], [Transformación del logo en el juego, Pong, IA y controles],
  [`firebase.json`], [Configuración de Firebase Hosting y del servidor local (puerto 5050)],
  [`.firebaserc`], [Proyecto de Firebase por defecto: `atenia-ingenia`],
)

Es HTML, CSS y JavaScript sin dependencias ni compilación: la carpeta `public/` es exactamente lo que se publica.

== Cómo funciona

- *Intro.* El logo es un SVG dentro de la página. Las piezas se mueven con animaciones CSS y el láser con animaciones SMIL. El botón Jugar aparece a los 5,6 s (`INTRO_MS`).
- *Transformación.* Al pulsar Jugar, `game.js` lee la posición en pantalla del cuerpo, la base y un ojo del robot, y los lleva en 1,1 s a su sitio en el juego mientras las letras salen volando.
- *Juego.* Se dibuja en un `<canvas>` con un bucle de `requestAnimationFrame`. La IA persigue la pelota con velocidad limitada y un error aleatorio en cada golpe.

== Ejecutar y publicar

```bash
firebase emulators:start --only hosting   # local, en http://localhost:5050
firebase deploy --only hosting            # publicar en atenia-ingenia.web.app
```

Hace falta Firebase CLI (`npm i -g firebase-tools`) y, para publicar, haber iniciado sesión (`firebase login`) con una cuenta que tenga acceso al proyecto. Las versiones anteriores se pueden restaurar desde la consola de Firebase, en *Hosting → Historial de versiones*. Los archivos se sirven con `Cache-Control: no-cache`, así que cada despliegue se ve al momento.

== Cambios habituales

#table(
  columns: (auto, 1fr),
  table.header[Qué cambiar][Dónde],
  [Textos de la interfaz], [`index.html` (botones, tarjeta, marcador) y `point()` en `game.js` (resultado)],
  [Colores], [Constantes al inicio de `game.js` y variables de `:root` en `index.html`],
  [Duración de la intro], [Animaciones del SVG en `index.html` y `INTRO_MS` en `game.js`],
  [Puntos para ganar], [`WIN_SCORE` en `game.js`, y los textos "5 puntos" de la tarjeta y del marcador],
  [Dificultad de la IA], [En `step()`, la velocidad (`field.h * 1.05`). En `hitPaddle()`, el error (`p.h * 0.9`) y la aceleración de la pelota (`* 1.06`)],
)

== Pruebas y limitaciones

Antes de publicar se comprueba a mano el recorrido completo de este manual en ordenador y móvil, y que la consola del navegador no muestre errores. Desde la consola, `__atenia.state()` devuelve el estado del juego.

- No hay tests automáticos.
- El juego se congela si la pestaña no está visible. Es el comportamiento normal de los navegadores.
- Los colores de la marca están repetidos en `game.js`, en `index.html` y en el SVG.
