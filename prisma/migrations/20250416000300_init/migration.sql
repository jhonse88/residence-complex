-- CreateTable
CREATE TABLE `provedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(256) NOT NULL,
    `telefono` VARCHAR(10) NOT NULL,
    `correo` VARCHAR(100) NOT NULL,
    `estado` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_servicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_solicitud` DATETIME(3) NOT NULL,
    `descripcion` VARCHAR(256) NOT NULL,
    `idprovedor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluacio_servicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idprovedor` INTEGER NOT NULL,
    `idsoliser` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NOT NULL,
    `monto` INTEGER NOT NULL,
    `descripcion` VARCHAR(256) NOT NULL,
    `idprovedor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_pago` DATETIME(3) NOT NULL,
    `monto` INTEGER NOT NULL,
    `metodo_pago` VARCHAR(256) NOT NULL,
    `idcontrato` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitudes_servicio` ADD CONSTRAINT `solicitudes_servicio_idprovedor_fkey` FOREIGN KEY (`idprovedor`) REFERENCES `provedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacio_servicio` ADD CONSTRAINT `evaluacio_servicio_idprovedor_fkey` FOREIGN KEY (`idprovedor`) REFERENCES `provedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluacio_servicio` ADD CONSTRAINT `evaluacio_servicio_idsoliser_fkey` FOREIGN KEY (`idsoliser`) REFERENCES `solicitudes_servicio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratos` ADD CONSTRAINT `contratos_idprovedor_fkey` FOREIGN KEY (`idprovedor`) REFERENCES `provedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pago` ADD CONSTRAINT `pago_idcontrato_fkey` FOREIGN KEY (`idcontrato`) REFERENCES `contratos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
