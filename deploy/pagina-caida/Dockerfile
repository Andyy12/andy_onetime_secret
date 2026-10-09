# Página de "servicio caído" de GoDatalize, servida por Traefik (middleware
# errors) cuando un servicio de Easypanel responde 502/503/504.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
