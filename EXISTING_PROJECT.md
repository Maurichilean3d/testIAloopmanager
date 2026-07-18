# Proyecto existente

## Repositorio o carpeta base

agent-engineering-canvas-local-v0.5.9-portable

## Estado actual

Snapshot local preparado desde la carpeta "agent-engineering-canvas-local-v0.5.9-portable". La IA debe inferir proposito, stack, estructura, areas de mejora y foco del loop desde la muestra enviada.

## Tipo de intervencion

se desea corregir bug, deteminar si es factible incluso modificar la experiencia UX-UI con la posibilidad de ampliar la comprensión humana, facilitar su uso, y hacer agregar mas precisión al proceso de optimizacion y uso de token. se sugiere implementar en el proceso de desarrollo de prompt por parte del llm, lo relatado en el presente repo.  https://github.com/DietrichGebert/ponytail

## Condicion futura deseada

se desea una interfaz grafica y funcionamiento integral del canvas, actualmente la ia no considera todos los casilleros en la version creacion de cero, o lis y llamanamente no los considera en la version con apllicacion externa. tambien se desea una version que se centre a nivel de interfaz en los tres pilares, context, harness, y loop pero de manera altamente intuitiva. y que la IA de copiloto tome un rol activo y de experti en sugerir entorno de herramientas provadas y open ource a partir por ejemplo de lo que el usuario suguiere en tipo de intervención. ademas de otros aspectos tecnicos propios es capaz de explicar que sucedera con el loop y la IA segun lo que uno escriba en cada casillero,

## Partes protegidas

1. Interfaz de usuario actual: La interfaz gráfica existente debe mantenerse funcional mientras se realizan las mejoras, para no interrumpir la experiencia del usuario actual. 2. Integración con OpenAI: La conexión con la API de OpenAI es crítica para el funcionamiento del copiloto y debe permanecer intacta. 3. Estructura de carpetas y scripts: La organización del código y los scripts de construcción deben ser preservados para evitar problemas en el flujo de trabajo de desarrollo.

## Regla de trabajo

Antes de proponer cambios, inspeccionar estructura, dependencias, pruebas, scripts y convenciones del repo. Preferir cambios incrementales, reversibles y acompanados de evidencia anti-regresion.
