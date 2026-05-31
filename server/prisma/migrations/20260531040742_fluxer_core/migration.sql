-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_local` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logo_url` VARCHAR(191) NULL,
    `nombre` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `hora_apertura` TIME NULL,
    `hora_cierre` TIME NULL,
    `capacidad_max_hora` INTEGER NOT NULL DEFAULT 0,
    `margen_cancelacion_horas` INTEGER NOT NULL DEFAULT 0,
    `bloqueo_capacidad` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `etiqueta` VARCHAR(191) NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `frecuencia` VARCHAR(191) NOT NULL,
    `caracteristicas` TEXT NULL,
    `categoriaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_socio` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `dni_cuit` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `fecha_inicio` DATE NULL,
    `observaciones` TEXT NULL,
    `estado_pago` ENUM('ALDIA', 'MOROSO') NOT NULL DEFAULT 'ALDIA',
    `estado_cliente` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `planId` INTEGER NULL,

    UNIQUE INDEX `clientes_codigo_socio_key`(`codigo_socio`),
    UNIQUE INDEX `clientes_dni_cuit_key`(`dni_cuit`),
    UNIQUE INDEX `clientes_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesionales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `especialidad` VARCHAR(191) NULL,
    `matricula` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `profesionales_dni_key`(`dni`),
    UNIQUE INDEX `profesionales_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horarios_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dia_semana` INTEGER NOT NULL,
    `hora_inicio` TIME NOT NULL,
    `hora_fin` TIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnos_clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `horarioId` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,

    UNIQUE INDEX `turnos_clientes_fecha_horarioId_clienteId_key`(`fecha`, `horarioId`, `clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `rubro_sector` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `planes` ADD CONSTRAINT `planes_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `planes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turnos_clientes` ADD CONSTRAINT `turnos_clientes_horarioId_fkey` FOREIGN KEY (`horarioId`) REFERENCES `horarios_config`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turnos_clientes` ADD CONSTRAINT `turnos_clientes_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
