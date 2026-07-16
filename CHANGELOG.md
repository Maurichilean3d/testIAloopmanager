# Cambios de la versión 0.4.0

## Arquitectura

- Se reemplazó el estado fragmentado por un `ProjectModel` único y trazable.
- Se separaron Discovery, Scope, Context, Architecture, Loops, Harness y Delivery.
- Se incorporaron estados por campo: borrador, pendiente, aprobado, rechazado y congelado.
- Las propuestas del Arquitecto IA quedan pendientes hasta aprobación humana.

## Arquitecto IA

- El prompt ahora prioriza MVP, KISS y YAGNI.
- Se limita a una pregunta crítica y cuatro propuestas por respuesta.
- Se eliminó la obligación de “sorprender” con tecnologías complejas.
- Se evita sobrescribir información aprobada por el usuario.

## Compilador

- La generación del ZIP es determinista y no depende de una segunda alucinación del LLM.
- Se generan archivos operativos para Context Engineering, Loop Engineering y Harness Engineering.
- Se añadieron perfiles para Antigravity, Claude Code, Codex y Cursor.
- Se añadió vista previa antes de descargar.

## Seguridad y GitHub

- Se eliminó cualquier clave incrustada en el código.
- Se añadió `.env.example`, escaneo básico de secretos, CI, Dockerfile y documentación de seguridad.
- La clave solo se lee desde `OPENAI_API_KEY` en el entorno del servidor.
