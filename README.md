# Baby Reveal

Demo estático para una revelación de género. La experiencia activa está en `/demo/`.

## Desarrollo local

```sh
python3 -m http.server 4173
```

Luego abre `http://localhost:4173/demo/`.

La lógica compartida de contador y revelación está en `assets/reveal.js`. La configuración específica de cada ruta se declara en su HTML mediante `window.REVEAL_CONFIG`.

## Publicación prevista

GitHub Pages desde la rama `main`, raíz del repositorio. Cuando se configure un dominio, se añadirá el archivo `CNAME` y los registros DNS indicados por GitHub.
