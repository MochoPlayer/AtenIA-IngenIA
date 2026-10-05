// Plantilla de documentos de Atenia Healthcare Robotics.
// Uso: #import "plantilla-atenia.typ": *  y  #show: documento.with(titulo: "…", …)
// Compilar con la fuente incluida:  typst compile --font-path fonts mi-documento.typ

// ---------- marca ----------
#let azul = rgb("#13294B")
#let teal = rgb("#12A39A")
#let gris = rgb("#5C6B7A")
#let fondo = rgb("#F7F9FB")
#let borde = rgb("#D5DCE3")

#let fuente = "Poppins"
#let fuente-codigo = "Consolas"

// Logotipo completo e icono (ruta relativa a este archivo)
#let logo(..args) = image("img/atenia-logo.svg", ..args)
#let icono(..args) = image("img/atenia-icono.svg", ..args)

// ---------- componentes ----------

/// Recuadro destacado. tipo: "info" (teal) o "aviso" (azul marino).
#let nota(tipo: "info", titulo: none, cuerpo) = {
  let color = if tipo == "aviso" { azul } else { teal }
  block(
    width: 100%, inset: (x: 14pt, y: 11pt), radius: 6pt,
    fill: color.lighten(90%), stroke: (left: 3pt + color),
    {
      set par(justify: false)
      if titulo != none { text(weight: "semibold", fill: color.darken(20%), titulo); parbreak() }
      cuerpo
    },
  )
}

/// Captura de pantalla con marco y pie de figura.
#let captura(ruta, pie, ancho: 100%) = figure(
  box(
    radius: 6pt, clip: true, stroke: 0.8pt + borde,
    image(ruta, width: ancho),
  ),
  caption: pie,
  kind: image,
)

/// Muestra de colores: lista de (nombre, color).
#let paleta(..colores) = grid(
  columns: colores.pos().len(), column-gutter: 10pt,
  ..colores.pos().map(((nombre, c)) => block(width: 100%, {
    block(width: 100%, height: 34pt, radius: 6pt, fill: c, stroke: if c == fondo { 0.8pt + borde } else { none })
    v(-4pt)
    text(size: 8.5pt, weight: "semibold", nombre)
    linebreak()
    text(size: 8pt, fill: gris, font: fuente-codigo, c.to-hex())
  })),
)

/// Etiqueta pequeña de color.
#let chip(cuerpo, color: teal) = box(
  inset: (x: 6pt, y: 2pt), radius: 10pt, fill: color.lighten(85%),
  text(size: 8.5pt, weight: "semibold", fill: color.darken(15%), cuerpo),
)

// ---------- documento ----------

/// Aplica el estilo de Atenia a todo el documento.
#let documento(
  titulo: "Documento",
  subtitulo: none,
  autor: none,
  fecha: datetime.today(),
  version: "1.0",
  portada: true,
  indice: true,
  cuerpo,
) = {
  let fecha-txt = if type(fecha) == datetime {
    let meses = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")
    str(fecha.day()) + " de " + meses.at(fecha.month() - 1) + " de " + str(fecha.year())
  } else { fecha }

  set document(title: titulo, author: if autor != none { autor } else { () })
  set text(font: fuente, size: 10pt, fill: azul, lang: "es")
  set smartquote(quotes: "“”")
  set par(justify: true, leading: 0.72em, spacing: 1.1em)

  set page(
    paper: "a4",
    margin: (top: 2.6cm, bottom: 2.2cm, x: 2.2cm),
    fill: white,
    header: context {
      if counter(page).get().first() > 1 or not portada {
        grid(
          columns: (1fr, auto), align: (left + horizon, right + horizon),
          text(size: 8.5pt, fill: gris, titulo),
          logo(height: 0.95cm),
        )
        v(-6pt)
        line(length: 100%, stroke: 0.6pt + borde)
      }
    },
    footer: context {
      if counter(page).get().first() > 1 or not portada {
        line(length: 100%, stroke: 0.6pt + borde)
        v(-4pt)
        grid(
          columns: (1fr, auto),
          text(size: 8pt, fill: gris, [Atenia Healthcare Robotics · v#version]),
          text(size: 8pt, fill: gris, [#counter(page).display() / #counter(page).final().first()]),
        )
      }
    },
  )

  // títulos
  set heading(numbering: "1.1")
  show heading: set text(fill: azul, weight: "semibold")
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    v(4pt)
    grid(
      columns: (auto, 1fr), column-gutter: 12pt, align: horizon,
      if it.numbering != none {
        box(inset: (x: 9pt, y: 5pt), radius: 6pt, fill: teal, text(fill: white, size: 15pt, counter(heading).display()))
      },
      text(size: 21pt, it.body),
    )
    v(2pt)
    line(length: 100%, stroke: 2pt + teal.lighten(55%))
    v(8pt)
  }
  show heading.where(level: 2): it => block(sticky: true, above: 18pt, below: 10pt, text(size: 13.5pt, {
    if it.numbering != none { text(fill: teal, counter(heading).display()); h(8pt) }
    it.body
  }))
  show heading.where(level: 3): it => block(sticky: true, above: 12pt, below: 8pt, text(size: 11pt, fill: teal, it.body))

  // texto, enlaces y código
  show link: set text(fill: teal)
  show strong: set text(weight: "semibold")
  set list(marker: text(fill: teal, "•"))
  set enum(numbering: n => text(fill: teal, weight: "semibold", str(n) + "."))
  show raw: set text(font: fuente-codigo, size: 9pt)
  show raw.where(block: false): it => box(fill: fondo, inset: (x: 3pt), outset: (y: 3pt), radius: 3pt, text(fill: azul, it))
  show raw.where(block: true): it => block(width: 100%, fill: fondo, stroke: 0.8pt + borde, inset: 11pt, radius: 6pt, it)

  // tablas
  set table(
    stroke: (x, y) => (bottom: 0.6pt + borde),
    fill: (x, y) => if y == 0 { azul } else if calc.even(y) { fondo },
    inset: (x: 8pt, y: 6.5pt),
    align: left + horizon,
  )
  show table.cell.where(y: 0): set text(fill: white, weight: "semibold", size: 9pt)
  show table: set text(size: 9pt, hyphenate: false)
  show table: set par(justify: false)
  show table: it => block(radius: 6pt, clip: true, stroke: 0.8pt + borde, breakable: false, it)

  // figuras
  set figure(gap: 8pt)
  show figure: set block(breakable: false)
  show figure.caption: it => text(size: 8.5pt, fill: gris, [#text(weight: "semibold", fill: teal, [#it.supplement #context it.counter.display(it.numbering)]) · #it.body])

  // portada
  if portada {
    page(header: none, footer: none, margin: 0pt, {
      place(top + left, rect(width: 100%, height: 0.55cm, fill: azul))
      place(top + left, dy: 0.55cm, rect(width: 100%, height: 0.14cm, fill: teal))
      place(top + left, dx: 2.4cm, dy: 4.2cm, logo(width: 9.5cm))
      place(top + left, dx: 2.4cm, dy: 11.4cm, block(width: 15.5cm, {
        set par(justify: false)
        set text(hyphenate: false)
        text(size: 32pt, weight: "semibold", fill: azul, titulo)
        if subtitulo != none { v(2pt); text(size: 14pt, fill: gris, subtitulo) }
        v(16pt)
        line(length: 4cm, stroke: 3pt + teal)
      }))
      place(bottom + left, dx: 2.4cm, dy: -2.6cm, grid(
        columns: (auto, auto), column-gutter: 14pt, row-gutter: 7pt,
        ..(
          if autor != none { (text(fill: gris, size: 9pt, "Autor"), text(size: 9pt, weight: "semibold", autor)) },
          (text(fill: gris, size: 9pt, "Fecha"), text(size: 9pt, weight: "semibold", fecha-txt)),
          (text(fill: gris, size: 9pt, "Versión"), text(size: 9pt, weight: "semibold", version)),
        ).filter(x => x != none).flatten()
      ))
      place(bottom + right, dx: -2.2cm, dy: -2.2cm, icono(width: 2.6cm))
    })
  }

  if indice {
    show outline.entry.where(level: 1): it => { v(6pt); strong(it) }
    outline(title: [Índice], indent: 1.2em, depth: 2)
    pagebreak()
  }

  cuerpo
}
