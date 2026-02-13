# GSAP Animation Panel para Grafana

Plugin personalizado que permite crear visualizaciones animadas con GSAP dentro de paneles de Grafana.

## Requisitos

- Grafana 9.0 o superior
- Para solo instalar: nada adicional
- Para desarrollo: Node.js 18+

## Instalacion rapida (sin compilar)

El zip `gsap-animation-panel.zip` ya trae el plugin compilado listo para usar.

1. Descomprimir el zip en la carpeta de plugins de Grafana:

   ```
   <grafana>/data/plugins/gsap-animation-panel/
   ```

   La estructura debe quedar asi:

   ```
   data/plugins/gsap-animation-panel/
     dist/
       module.js
       module.js.map
       plugin.json
   ```

2. Editar el archivo `conf/custom.ini` de Grafana (crearlo si no existe) y agregar:

   ```ini
   [plugins]
   allow_loading_unsigned_plugins = custom-gsap-animation-panel
   ```

   Si ya hay otros plugins unsigned, separarlos con coma:

   ```ini
   allow_loading_unsigned_plugins = otro-plugin,custom-gsap-animation-panel
   ```

3. Reiniciar Grafana:

   - **Windows (servicio):** `Restart-Service Grafana` en PowerShell como administrador
   - **Windows (manual):** cerrar y volver a abrir `grafana-server.exe`
   - **Linux:** `sudo systemctl restart grafana-server`

4. En Grafana, al crear o editar un panel, buscar "GSAP Animation Panel" en la lista de visualizaciones.

## Instalacion para desarrollo (compilar desde source)

El zip `gsap-animation-panel-source.zip` trae el codigo fuente completo.

1. Descomprimir en la carpeta de plugins de Grafana:

   ```
   <grafana>/data/plugins/gsap-animation-panel/
   ```

2. Instalar dependencias:

   ```bash
   cd <grafana>/data/plugins/gsap-animation-panel
   npm install
   ```

3. Compilar:

   ```bash
   npm run build
   ```

   Esto genera la carpeta `dist/` con el plugin compilado.

4. Para desarrollo con recompilacion automatica:

   ```bash
   npm run dev
   ```

5. Configurar `custom.ini` y reiniciar Grafana (igual que en la instalacion rapida, pasos 2 y 3).

## Uso del plugin

Al editar un panel con este plugin, se tiene un editor de codigo JavaScript. El codigo recibe un objeto `context` con todo lo necesario:

```javascript
const { gsap, timeline, svg, container, width, height, data, helpers, plugins, grafana } = context;
```

### Objetos disponibles en context

| Objeto | Descripcion |
|--------|-------------|
| `gsap` | Instancia de GSAP (el motor de animacion) |
| `timeline` | Timeline de GSAP pre-creado (se limpia automaticamente) |
| `svg` | Elemento SVG que ocupa todo el panel |
| `container` | Elemento HTML div para contenido DOM |
| `width` / `height` | Dimensiones del panel en pixeles |
| `data` | Datos parseados de las queries de Grafana |
| `helpers` | Funciones de utilidad para crear elementos SVG |
| `plugins` | Plugins de GSAP registrados |
| `grafana` | Acceso a replaceVariables, eventBus, timeRange, theme |

### Estructura de data

```javascript
data.fields     // [{name, values, type}] - todos los campos
data.rows       // [{campo: valor, ...}]  - filas como objetos
data.lastValues // {campo: ultimoValor}   - ultimo valor de cada campo
data.seriesCount // numero de series
data.rowCount    // numero de filas
```

### Helpers disponibles

```javascript
helpers.createBar(x, y, width, height, fill)     // Rectangulo SVG
helpers.createCircle(cx, cy, r, fill)             // Circulo SVG
helpers.createText(x, y, content, attrs)          // Texto SVG
helpers.createGauge(cx, cy, r, value, min, max)   // Gauge SVG
helpers.colorScale(value, min, max)               // Color verde->amarillo->rojo
helpers.createSVGElement(tag, attrs)              // Elemento SVG generico
helpers.createHTMLElement(tag, attrs)             // Elemento HTML generico
```

### Ejemplo basico

```javascript
const { gsap, timeline, svg, width, height, data, helpers } = context;

// Crear barras desde los datos
const rows = data.rows;
const barW = width / rows.length - 4;

rows.forEach((row, i) => {
  const val = row.value || 50;
  const h = (val / 100) * height;
  const bar = helpers.createBar(i * (barW + 4), height - h, barW, h,
    helpers.colorScale(val, 0, 100));
  svg.appendChild(bar);

  timeline.from(bar, {
    scaleY: 0,
    transformOrigin: 'bottom',
    duration: 0.6,
    ease: 'back.out(1.7)',
  }, i * 0.1);
});
```

### Templates incluidos

El plugin incluye templates precargados accesibles desde el selector en las opciones del panel:

- **Bar Chart** - Grafico de barras animado
- **Gauge** - Medidor circular
- **Morphing Shapes** - Figuras SVG que se transforman
- **Text Scramble** - Texto con animacion
- **Dot Grid** - Cuadricula de puntos con efecto onda
- **Empty** - Lienzo en blanco con comentarios de referencia

## Modos de contenedor

En las opciones del panel se puede elegir:

- **SVG** - Solo capa SVG (para graficos vectoriales)
- **HTML** - Solo capa HTML (para elementos DOM)
- **Both** - Ambas capas superpuestas

## Notas sobre GSAP Club

Los siguientes plugins requieren licencia de GSAP Club para funcionalidad completa:

- MorphSVGPlugin
- DrawSVGPlugin
- ScrambleTextPlugin
- SplitText
- CustomEase
- EasePack

El paquete npm estandar de GSAP incluye versiones stub de estos plugins. Los plugins gratuitos (MotionPathPlugin, TextPlugin, ScrollToPlugin, Flip, Draggable) funcionan completos sin licencia.

## Solucion de problemas

**El panel no aparece en la lista de visualizaciones:**
- Verificar que `custom.ini` tiene `allow_loading_unsigned_plugins = custom-gsap-animation-panel`
- Verificar que la carpeta `dist/` existe con `module.js` y `plugin.json`
- Reiniciar Grafana

**El panel aparece pero no ejecuta el codigo:**
- Todo el codigo debe usar `context` para acceder a gsap, svg, etc.
- No usar variables globales (`gsap.to(...)` no funciona, usar `context.gsap.to(...)`)

**Error en la consola del navegador:**
- Abrir DevTools (F12) y revisar la consola
- Activar "Show Debug Info" en las opciones del panel para ver estadisticas de datos
