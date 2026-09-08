FROM php:8.3-apache

# Install system dependencies & PHP extensions required by Laravel 12 & PhpSpreadsheet
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    sqlite3 \
    libsqlite3-dev \
    dos2unix \
    && docker-php-ext-install pdo_sqlite mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite for Laravel routing
RUN a2enmod rewrite

# Change Apache document root to public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Convert line endings and grant execution permissions to entrypoint
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Install composer dependencies without dev packages
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for storage, cache, and database
RUN mkdir -p database storage bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache database

EXPOSE 80

ENTRYPOINT ["sh", "/var/www/html/docker-entrypoint.sh"]
