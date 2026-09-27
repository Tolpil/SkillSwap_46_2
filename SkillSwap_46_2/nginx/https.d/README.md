# Включение HTTPS

Nginx в production запускается на портах `80` и `443`. Базовый конфиг
(`nginx.conf`) обслуживает HTTP и автоматически подключает все файлы
`*.conf` из этого каталога — поэтому HTTPS можно добавить без пересборки
образа: достаточно положить сюда server-блок и перезапустить контейнер.

## Шаг 1. Получить сертификаты Let's Encrypt

На хосте, где запущен Docker, выполните (пример для домена `example.com`):

```bash
docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone -d example.com -d api.example.com
```

> Перед запуском остановите контейнер nginx, чтобы certbot мог занять порт 80,
> затем запустите стек обратно.

## Шаг 2. Добавить server-блок

Создайте файл `nginx/https.d/example.com.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location /socket.io/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location ~ ^/(api|public)/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## Шаг 3. Прокинуть сертификаты в контейнер

Добавьте в `docker-compose.server.yml` (сервис `nginx`) том:

```yaml
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

и перезапустите стек:

```bash
docker compose -f docker-compose.server.yml up -d nginx
```

## Автообновление сертификатов

Добавьте в cron на хосте:

```bash
0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet