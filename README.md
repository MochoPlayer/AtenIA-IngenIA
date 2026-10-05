# Atenia — web con animación del logo y Pong

Web de presentación de **Atenia Healthcare Robotics**, un robot para hospitales con seguimiento de calorías.

Al entrar se reproduce la animación del logo. El robot se monta, el nombre sale de detrás de él y sus ojos escanean con un láser verde que escribe "Healthcare Robotics". Al terminar aparece el botón **Jugar**. Al pulsarlo, el logo se transforma en un Pong contra la IA:

- "Aten" se convierte en tu pala.
- La "a" se convierte en la pala de la IA.
- Las piezas del robot se encajan en la pelota.

**En producción:** <https://atenia-ingenia.web.app> (Firebase Hosting, proyecto `atenia-ingenia`)

## Puesta en marcha

Requisitos: [Node.js](https://nodejs.org) y Firebase CLI (`npm i -g firebase-tools`).

```bash
# servidor local (emulador de Firebase Hosting) → http://localhost:5050
firebase emulators:start --only hosting

# publicar en producción (requiere `firebase login` con una cuenta con acceso al proyecto)
firebase deploy --only hosting
```

No hay dependencias que instalar ni ningún paso de compilación. Es HTML, CSS y JavaScript sin frameworks, y lo que hay en `public/` es exactamente lo que se publica.

## Estructura

```
atenia-web/
├── public/
│   ├── index.html     # página: estilos, SVG animado del logo, botón, canvas y diálogos
│   └── game.js        # transformación logo → Pong, juego, IA y controles
├── docs/
│   ├── MANUAL.md      # manual de uso del código: cómo cambiar cada cosa
│   └── ARQUITECTURA.md# cómo está construido y por qué
├── firebase.json      # configuración de Hosting y del emulador (puerto 5050)
└── .firebaserc        # proyecto de Firebase por defecto: atenia-ingenia
```

## Documentación

- **[Manual de uso](docs/MANUAL.md):** cómo ejecutar, probar, cambiar textos, colores, tiempos y dificultad, y publicar.
- **[Arquitectura](docs/ARQUITECTURA.md):** línea de tiempo de la animación, cómo funciona la transformación, el bucle del juego y las decisiones técnicas.

## Controles del juego

| Dispositivo | Control |
|---|---|
| Ratón | mover el ratón arriba y abajo |
| Táctil | deslizar el dedo |
| Teclado | ↑ ↓ o W S |

Gana quien llegue antes a **5** puntos. Al terminar puedes pedir **Revancha** o volver al logo con **Ver el logo**.
