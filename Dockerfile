# =====================================================
# PHP service
# =====================================================
# PHP - ROOT
# -----------------------------------------------------
FROM neunerlei/php:8.4-fpm-debian AS php_root
ARG APP_ENV=prod
ENV APP_ENV=${APP_ENV}
ARG DOCKER_RUNTIME=docker
ARG DOCKER_GID=1000
ARG DOCKER_UID=1000

# -----------------------------------------------------
# PHP - DEV
# -----------------------------------------------------
FROM php_root AS php_dev
ENV DOCKER_RUNTIME=${DOCKER_RUNTIME:-docker}
ENV APP_ENV=dev

# Add sudo command
RUN --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,id=apt-lib,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get upgrade -y && apt-get install -y \
    sudo

# Add Composer
COPY --from=index.docker.io/library/composer:latest /usr/bin/composer /usr/bin/composer

# Because we inherit from the prod image, we don't actually want the prod settings
COPY docker/php/config/php.dev.ini /usr/local/etc/php/conf.d/zzz.app.dev.ini
RUN rm -rf /usr/local/etc/php/conf.d/zzz.app.prod.ini

# Recreate the www-data user and group with the current users id
RUN --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,id=apt-lib,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y usermod && \
    groupdel -f www-data || true && \
    userdel -r www-data || true && \
    groupadd -g ${DOCKER_GID} www-data && \
    useradd -u ${DOCKER_UID} -g www-data www-data

COPY docker/php/php.entrypoint.dev.sh /user/bin/app/entrypoint.local.sh
RUN chmod 755 /user/bin/app/entrypoint.sh && \
    chmod 755 /user/bin/app/entrypoint.local.sh
USER www-data
