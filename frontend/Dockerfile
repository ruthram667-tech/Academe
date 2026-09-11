# Dockerfile.frontend — Nginx serving Academe static files
FROM nginx:1.27-alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy all static frontend assets
COPY *.html   /usr/share/nginx/html/
COPY *.css    /usr/share/nginx/html/
COPY *.js     /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
