# Cognitive Systems Canvas

Entorno conversacional y visual para convertir una necesidad en un **Project Model** aprobado y compilarlo como un paquete operativo para Antigravity, Claude Code, Codex o Cursor.

## Qué cambió en esta versión

- Canvas claro con estructura inspirada en Business Model Canvas.
- Una única fuente de verdad: `ProjectModel`.
- Trazabilidad de campos: usuario, inferido, pendiente, aprobado y rechazado.
- Separación explícita entre MVP, fuera de alcance y visión futura.
- Context Engineering, Loop Engineering y Harness Engineering editables.
- Compilador determinista: el ZIP se construye desde el modelo aprobado, no desde una generación final improvisada.
- Vista previa de todos los archivos antes de descargar.
- Perfiles para Antigravity, Claude Code, Codex y Cursor.
- Claves API solo en variables de entorno del servidor.

## Desarrollo local

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local
# Edita .env.local y añade OPENAI_API_KEY
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Verificación

```bash
npm run verify
```

Ejecuta análisis de secretos, TypeScript, pruebas del compilador y build de producción.

## Publicación en GitHub

Puedes subir todo el repositorio excepto los archivos `.env`. La clave no se “encripta dentro del código”: se guarda fuera del repositorio como secreto del entorno.

### Para GitHub Actions

En el repositorio:

1. Settings.
2. Secrets and variables.
3. Actions.
4. New repository secret.
5. Nombre: `OPENAI_API_KEY`.

Solo agrega ese secreto a un workflow si el workflow realmente necesita llamar a OpenAI. El workflow de CI incluido no necesita la clave.

### Para alojar la aplicación

El código puede vivir en GitHub, pero la aplicación completa necesita un servidor Node que mantenga la clave fuera del navegador. Puedes desplegar el `Dockerfile` en un servicio compatible y configurar allí:

```text
OPENAI_API_KEY
OPENAI_MODEL
PORT
```

GitHub Pages sirve archivos estáticos y no debe utilizarse para exponer una clave privada desde React.

## Arquitectura

```text
Conversación
    ↓
Project Model trazable
    ↓
Aprobación humana
    ↓
Compilador determinista
    ↓
Context + Loops + Harness + reglas del agente
    ↓
ZIP para el entorno seleccionado
```

## Seguridad

Lee [SECURITY.md](SECURITY.md). Si una clave real apareció en una versión anterior, revócala antes de usar este proyecto.
