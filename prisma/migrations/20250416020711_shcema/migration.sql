/*
  Warnings:

  - Added the required column `calificacion` to the `evaluacio_servicio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comentarios` to the `evaluacio_servicio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_Evaluacion` to the `evaluacio_servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `evaluacio_servicio` ADD COLUMN `calificacion` INTEGER NOT NULL,
    ADD COLUMN `comentarios` VARCHAR(256) NOT NULL,
    ADD COLUMN `fecha_Evaluacion` DATETIME(3) NOT NULL;
