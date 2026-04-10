FROM php:8.2-cli-alpine

# System dependencies
RUN apk add --no-cache bash git nodejs npm sqlite-dev

# PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Install Node deps + build frontend
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN composer dump-autoload --optimize

EXPOSE 8080

CMD ["bash", "render-start.sh"]
