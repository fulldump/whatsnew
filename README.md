# What's New

This will craft a summary for you with all relevant slack activity in your abscence.

## Cómo se empieza

El código que hay es sólo un ejemplo pero al meterlo en una máquina compartida hay algunas reglas:

* Puerto en el que escuchar `8080`
* El punto de entrada es un archivo `run.sh` en el que se escribe el comando que debe arrancar el servicio
* El código del repo se monta como un volumen en `/repo` (que es el directorio de trabajo)
* Para almacenar datos también se monta un volumen en `/data`

Esto para cambiar:
* Se puede elegir cualquier lenguaje (he usado un ejemplo en go para tener algo con lo que probar)
* La imagen actual es `golang:1.20` pero se puede cambiar a cualquier otra (de momento a mano)
* He apuntado este dominio: `whatsnew.dataless.io`
* Los logs del api gw se pueden ver en https://instantlogs.io/ filtrando por `whatsnew`
