---
name: save-context
description: Usar con /save-context para guardar en .claude/memory/ los cambios técnicos relevantes del repo (Git, archivos, tests) como contexto actual y changelog histórico.
---

# save-context: memoria técnica de evolución del código

Objetivo: que una sesión futura de Claude Code retome el desarrollo exactamente donde se dejó, sin reinvestigar lo ya hecho. Es un **Engineering Changelog**, no una memoria de conversaciones ni un gestor de proyectos.

La memoria vive dentro del repositorio, en `.claude/memory/`, para que viaje con Git entre sesiones y máquinas:

- `.claude/memory/current.md`: contexto técnico **actual**. Se reescribe entera en cada guardado.
- `.claude/memory/changelog.md`: historial **acumulativo**. Cada guardado añade una entrada nueva al principio (la más reciente arriba).

## Qué guardar (solo esto)

1. **Archivos modificados**: creados, modificados, eliminados (y renombrados), con una frase de propósito por archivo o grupo.
2. **Cambios importantes**: funcionalidades o comportamientos que han cambiado.
3. **Decisiones técnicas**: arquitectura, librerías, tecnologías y el *motivo* de la elección.
4. **Errores solucionados**: problema relevante, causa raíz y cómo se resolvió.
5. **Estado del desarrollo**: qué funciona ahora y qué queda incompleto o roto.
6. **Próximo paso**: qué debe hacer Claude al continuar (concreto y accionable).

## Qué NO guardar

- Conversaciones ni explicaciones generales.
- Código completo (como mucho un nombre de función, símbolo o ruta; nunca bloques de código).
- Cambios cosméticos menores (formato, renombrados triviales, comentarios, reorden de imports).
- Información que ya está documentada en el propio código, README o configuración.
- Ideas aún no implementadas, salvo decisiones pendientes importantes (van en "Decisiones pendientes").
- Secretos: nunca valores de `.env`, tokens, claves ni credenciales. Si un archivo de configuración con secretos cambió, anota solo que cambió.

## Reglas de honestidad (obligatorias)

- **Nunca afirmes que un test pasó si no lo ejecutaste en esta sesión.** Cada resultado de test debe llevar comando, fecha y resultado real observado.
- Si no ejecutaste los tests, escribe `no ejecutado` (con el motivo si lo hay). No arrastres un "pasó" de un guardado anterior como si fuera actual: si lo citas, márcalo como `último resultado conocido (commit <sha>, <fecha>)`.
- Si no puedes verificar algo (qué funciona, qué falla), anótalo como `sin verificar`. No lo deduzcas ni lo adornes.
- No inventes motivos de decisiones. Si el motivo no consta en el código, los commits o lo hablado en la sesión, escribe `motivo no registrado`.

## Procedimiento

### 1. Preparar

- Comprueba que estás en un repo Git: `git rev-parse --show-toplevel`. Trabaja desde la raíz del repo. Si no es un repo Git, avisa al usuario y usa como fallback el listado de archivos recientes, indicándolo en la entrada (`sin Git: cambios inferidos por fecha de modificación`).
- Crea `.claude/memory/` si no existe.
- Si existe `current.md`, léelo y extrae `head_commit` (el commit del último guardado) y el "Próximo paso" previo.

### 2. Analizar Git

Ejecuta lo que aplique y quédate con lo esencial:

- `git branch --show-current` y `git rev-parse --short HEAD`
- `git status --porcelain` (cambios sin commit y archivos nuevos sin seguimiento)
- `git diff --stat HEAD` y, si hace falta entender un cambio, `git diff HEAD -- <archivo>` solo de los archivos relevantes
- Si hay `head_commit` previo y existe en el historial: `git log --oneline --name-status <head_commit>..HEAD`
- Si no hay guardado previo: `git log --oneline -n 20` como punto de partida razonable.

Ignora para el análisis detallado: lockfiles, artefactos generados, `dist/`, `build/`, `node_modules/`, `.venv/`, binarios. Menciona un lockfile solo si implica un cambio real de dependencias (qué dependencia se añadió, quitó o cambió de versión mayor).

Lee el contenido de los archivos modificados solo cuando el diff no baste para entender el *porqué*. No resumas archivos que no cambiaron.

### 3. Analizar tests

- Detecta cómo se ejecutan los tests mirando `package.json` (scripts), `pyproject.toml`/`pytest.ini`, `Makefile`, `Cargo.toml`, `go.mod`, CI (`.github/workflows`), etc.
- Si el comando es claro y razonablemente rápido, **ejecútalo** y registra: comando, resultado real (pasaron/fallaron/cuántos), y los fallos relevantes en una línea cada uno.
- Si es lento, requiere servicios externos, credenciales o no está claro, **no lo ejecutes**: registra `no ejecutado` y el comando que habría que usar.
- Si el usuario ya ejecutó tests en esta sesión, usa esa salida real; no la reconstruyas de memoria.
- Anota también si se añadieron, modificaron o eliminaron tests (qué cubren, en una línea).

### 4. Filtrar y redactar

Aplica las listas de "Qué guardar" y "Qué NO guardar". Pregúntate por cada línea: *¿un Claude futuro perdería tiempo sin esto, y no está ya en el código o en el README?* Si no, no la escribas. Prefiere frases cortas y verificables con rutas de archivo reales.

### 5. Escribir `current.md` (reescritura completa)

Plantilla (máximo ~150 líneas; si crece, condensa):

```markdown
---
updated: <fecha ISO>
branch: <rama>
head_commit: <sha corto>
working_tree: clean | dirty (<n> archivos sin commit)
---
# Contexto técnico actual

## Proyecto
<1-3 líneas: qué es y stack, solo si no está claro en el README>

## Estado del desarrollo
### Funciona
- <funcionalidad> (`ruta/archivo`) — verificado | sin verificar
### Incompleto o roto
- <qué falta o falla> (`ruta/archivo`)

## Decisiones técnicas vigentes
- <decisión>: <motivo>

## Decisiones pendientes
- <decisión importante aún sin tomar>

## Tests
- Comando: `<cmd>`
- Última ejecución: <fecha> — <resultado real> | no ejecutado
- Fallos conocidos: <lista o ninguno conocido>

## Próximo paso
<instrucción concreta para retomar: qué archivo, qué hacer, cómo comprobarlo>
```

Conserva de la versión anterior las decisiones y el estado que sigan vigentes; elimina lo que ya no aplique. `current.md` refleja el presente, no la historia.

### 6. Añadir entrada a `changelog.md`

Si el archivo no existe, créalo con el encabezado `# Engineering Changelog`. Inserta la nueva entrada justo debajo, nunca borres ni edites entradas anteriores:

```markdown
## <fecha ISO> · <rama> · <sha_anterior>..<sha_actual>
**Archivos**
- creados: `a`, `b`
- modificados: `c` (<propósito en pocas palabras>)
- eliminados: `d`
**Cambios**
- <cambio de funcionalidad o comportamiento>
**Decisiones**
- <decisión> — <motivo>
**Errores solucionados**
- <problema> → causa: <causa> → solución: <solución>
**Tests**
- `<cmd>`: <resultado real> | no ejecutado
**Estado y próximo paso**
- <una o dos líneas>
```

Omite las secciones vacías. Si no hay nada relevante que registrar (solo cambios cosméticos), no añadas entrada: díselo al usuario.

Mantenimiento: si `changelog.md` supera ~400 líneas, condensa las entradas más antiguas en bloques por mes (una línea por cambio importante) bajo `## Archivo`, en un solo lote, conservando las decisiones y los errores relevantes.

### 7. Cerrar

Responde al usuario en pocas líneas: qué se guardó (nº de archivos y cambios clave), estado de los tests (real o `no ejecutado`) y el próximo paso registrado. Recuerda que `.claude/memory/` está pensada para versionarse: **no hagas commit por tu cuenta**; sugiérelo si el usuario quiere conservarlo en Git.
