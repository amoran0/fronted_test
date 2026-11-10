---
name: load-context
description: Usar con /load-context al empezar sesión en un repo para recuperar desde .claude/memory/ el estado técnico y el próximo paso, y retomar el desarrollo sin reinvestigar.
---

# load-context: retomar el desarrollo donde se dejó

Objetivo: recuperar de `.claude/memory/` lo estrictamente necesario para seguir programando, y comprobar si el repo ha cambiado desde el último `/save-context`. Es de **solo lectura**: no modifiques archivos de memoria ni del proyecto.

## Procedimiento

### 1. Localizar la memoria

- Ve a la raíz del repo (`git rev-parse --show-toplevel`) y busca `.claude/memory/current.md` y `.claude/memory/changelog.md`.
- Si no existen, dilo en una línea y sugiere ejecutar `/save-context` para crear la memoria. No explores todo el proyecto por tu cuenta salvo que el usuario lo pida.

### 2. Leer

- Lee `current.md` completo.
- Lee solo las **3 entradas más recientes** de `changelog.md` (las primeras del archivo). Lee más únicamente si el usuario pregunta por el historial o si `current.md` hace referencia a algo que necesitas entender.

### 3. Detectar desfase con el repo real

Compara lo guardado con el estado actual:

- `git rev-parse --short HEAD` frente a `head_commit` de `current.md`.
- Si difieren y el commit guardado existe: `git log --oneline --name-status <head_commit>..HEAD` para ver qué cambió fuera del flujo de `/save-context`.
- `git status --porcelain` para ver cambios sin commit.
- `git branch --show-current` frente a la rama guardada.
- Comprueba que los archivos clave citados en "Próximo paso" y "Estado del desarrollo" siguen existiendo (`ls` o `git ls-files`). Marca los que no.

Si hay desfase, el contexto guardado puede estar desactualizado: dilo claramente y trata los apartados afectados como `por verificar`.

### 4. Presentar un resumen breve

Responde con esta estructura, sin pegar los archivos enteros:

- **Estado**: rama y commit actual; si coincide con el último guardado o hay desfase (cuántos commits o archivos).
- **Funciona / incompleto**: lo esencial de `current.md`.
- **Decisiones vigentes** relevantes para lo que viene, y decisiones pendientes.
- **Tests**: tal como están registrados, indicando fecha y si fue `no ejecutado`. No los presentes como "pasan" a menos que el registro diga que se ejecutaron, y recuerda que es un resultado histórico, no uno de esta sesión.
- **Próximo paso**: el registrado, adaptado si el desfase lo invalida.

### 5. Continuar

Pregunta al usuario si quiere empezar por el próximo paso registrado, o actúa directamente si ya lo pidió. Lee solo los archivos que necesites para ese paso; no releas el proyecto entero.

## Reglas

- Nunca afirmes que un test pasa basándote en la memoria: es un dato histórico. Para saber el estado real, hay que ejecutar los tests.
- No cites código que no hayas leído en esta sesión; la memoria no guarda código.
- Si la memoria contradice lo que ves en el repo, el repo manda: señálalo y sugiere `/save-context` tras resolverlo.
- No guardes nada ni hagas commits desde esta skill.
