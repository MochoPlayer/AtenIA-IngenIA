// Punto de partida para un documento nuevo de Atenia.
// Copia este archivo, cambia los datos y compila con:
//   typst compile --font-path fonts plantilla-ejemplo.typ
#import "plantilla-atenia.typ": *

#show: documento.with(
  titulo: "Título del documento",
  subtitulo: "Subtítulo o contexto",
  autor: "Nombre Apellido",
  version: "0.1",
  // fecha: datetime(year: 2026, month: 10, day: 5),   // por defecto, hoy
  // portada: false,                                   // sin portada
  // indice: false,                                    // sin índice
)

= Introducción

Texto del documento. Los títulos de primer nivel empiezan página y llevan el número en una etiqueta teal.

== Un apartado

- Una lista con viñetas
- Otro punto con `código en línea`

#nota(titulo: "Nota")[Recuadro informativo en teal.]
#nota(tipo: "ok", titulo: "Hecho")[Recuadro en verde para resultados o confirmaciones.]
#nota(tipo: "aviso", titulo: "Atención")[Recuadro en azul marino para avisos.]

== Una tabla

#table(
  columns: (auto, 1fr),
  table.header[Columna][Descripción],
  [Fila 1], [La cabecera es azul marino y las filas alternan con el fondo claro.],
  [Fila 2], [#chip[etiqueta] #chip(color: verde)[otra]],
)

== Colores de la marca

#paleta(("Azul marino", azul), ("Teal", teal), ("Verde", verde), ("Gris", gris), ("Fondo", fondo))

// Para una figura con captura:
// #captura("capturas/mi-captura.png")[Pie de la figura.]
