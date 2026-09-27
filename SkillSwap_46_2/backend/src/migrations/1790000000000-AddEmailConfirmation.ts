import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailConfirmation1790000000000 implements MigrationInterface {
    name = 'AddEmailConfirmation1790000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isEmailConfirmed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isEmailConfirmed"`);
    }
}