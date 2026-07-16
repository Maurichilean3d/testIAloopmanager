# Configuración segura en GitHub

## 1. Publicar el código

```bash
git init
git add .
git commit -m "Initial Cognitive Systems Canvas"
git branch -M main
git remote add origin <URL_DEL_REPOSITORIO>
git push -u origin main
```

Antes del primer commit ejecuta:

```bash
npm run security:check
```

## 2. Guardar la clave

No escribas la clave en el repositorio. Para un workflow de GitHub Actions:

1. Abre `Settings` del repositorio.
2. Entra a `Secrets and variables` → `Actions`.
3. Crea un secret llamado `OPENAI_API_KEY`.
4. Úsalo únicamente desde un workflow que lo necesite mediante `${{ secrets.OPENAI_API_KEY }}`.

El workflow de CI incluido no necesita la clave.

## 3. Desarrollo en Codespaces

Crea un Codespaces secret llamado `OPENAI_API_KEY` y autorízalo para este repositorio. El secreto se expone como variable de entorno dentro del Codespace, no como archivo versionado.

## 4. Alojamiento

GitHub puede alojar el repositorio, pero GitHub Pages no ejecuta el backend Express ni puede mantener privada una clave usada desde React. Para publicar la aplicación completa:

- despliega el contenedor definido por `Dockerfile` en un servicio con backend;
- configura `OPENAI_API_KEY` como secreto o variable protegida en ese servicio;
- no uses variables `VITE_*` para la clave, porque esas variables terminan en el bundle del navegador.

## 5. Clave previamente expuesta

Si una clave real apareció alguna vez en código, archivos, chat, logs o commits, revócala y genera una nueva antes de publicar.
