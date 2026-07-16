# Política de seguridad

## Claves API

- La clave de OpenAI se carga únicamente en el servidor mediante `OPENAI_API_KEY`.
- Nunca debe escribirse en `server.ts`, React, archivos del ZIP generado, commits, issues o capturas.
- Los archivos `.env` están ignorados por Git.
- `.env.example` contiene solo nombres de variables y valores ficticios.

## Si una clave fue expuesta

1. Revócala en el proveedor inmediatamente.
2. Crea una clave nueva.
3. Revisa el historial del repositorio y los logs de CI.
4. Configura la clave nueva como secreto del entorno de despliegue.

## GitHub

El repositorio puede almacenarse en GitHub. Para CI/CD, configura `OPENAI_API_KEY` como Repository Secret o Environment Secret. La aplicación necesita un backend en ejecución; GitHub Pages por sí solo no puede ocultar una clave utilizada desde el navegador.
