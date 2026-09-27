import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789737835411 implements MigrationInterface {
    name = 'InitialSchema1789737835411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(250) NOT NULL, "description" text, "images" text array NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" uuid, "category_id" uuid NOT NULL, CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "parent_id" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "region" character varying(255) NOT NULL, "sortOrder" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4eb6c245d8f0e421d04c8360b36" UNIQUE ("name", "region"), CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE', 'UNSPECIFIED')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "name" text, "about" text, "birthdate" date, "gender" "public"."users_gender_enum", "avatar" character varying(255), "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "refreshToken" text, "city_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."request_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'inProgress', 'done')`);
        await queryRunner.query(`CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."request_status_enum" NOT NULL DEFAULT 'pending', "isRead" boolean NOT NULL DEFAULT false, "sender_id" uuid, "receiver_id" uuid, "offered_skill_id" uuid, "requested_skill_id" uuid, CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_requests_receiver" ON "requests" ("receiver_id") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_sender" ON "requests" ("sender_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('NEW_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_type_enum" NOT NULL, "skillName" text NOT NULL, "skillId" uuid, "fromUser" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "recipient_id" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_recipient_created_at" ON "notifications" ("recipient_id", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_recipient" ON "notifications" ("recipient_id") `);
        await queryRunner.query(`CREATE TABLE "users_want_to_learn" ("usersId" uuid NOT NULL, "categoriesId" uuid NOT NULL, CONSTRAINT "PK_169e7523123732f834509800331" PRIMARY KEY ("usersId", "categoriesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c7493596b3894a59f806fd0966" ON "users_want_to_learn" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6f4849f1cabd9f08ec223b8c19" ON "users_want_to_learn" ("categoriesId") `);
        await queryRunner.query(`CREATE TABLE "user_favorite_skills" ("user_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_17b8886306b99feaf1a8e7cc4d1" PRIMARY KEY ("user_id", "skill_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_de3d937d00b6933e38788aa50e" ON "user_favorite_skills" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7729ebbfb24496e67528df573" ON "user_favorite_skills" ("skill_id") `);
        await queryRunner.query(`ALTER TABLE "skills" ADD CONSTRAINT "FK_7f2277da303cf72a0b941a84689" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skills" ADD CONSTRAINT "FK_47dd0ade7ed449a7aca9b9e6752" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_03934bca2709003c5f08fd436d2" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_7e58368e50d76813c1aca1eb234" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_25154653083c4716fe2d9a99624" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_afdc7b37b5580c9746bd031761c" FOREIGN KEY ("offered_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_4f54337fbc4db227eb8c094e544" FOREIGN KEY ("requested_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_want_to_learn" ADD CONSTRAINT "FK_c7493596b3894a59f806fd09662" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_want_to_learn" ADD CONSTRAINT "FK_6f4849f1cabd9f08ec223b8c193" FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorite_skills" ADD CONSTRAINT "FK_de3d937d00b6933e38788aa50e1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_favorite_skills" ADD CONSTRAINT "FK_b7729ebbfb24496e67528df5730" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_favorite_skills" DROP CONSTRAINT "FK_b7729ebbfb24496e67528df5730"`);
        await queryRunner.query(`ALTER TABLE "user_favorite_skills" DROP CONSTRAINT "FK_de3d937d00b6933e38788aa50e1"`);
        await queryRunner.query(`ALTER TABLE "users_want_to_learn" DROP CONSTRAINT "FK_6f4849f1cabd9f08ec223b8c193"`);
        await queryRunner.query(`ALTER TABLE "users_want_to_learn" DROP CONSTRAINT "FK_c7493596b3894a59f806fd09662"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_4f54337fbc4db227eb8c094e544"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_afdc7b37b5580c9746bd031761c"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_25154653083c4716fe2d9a99624"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_7e58368e50d76813c1aca1eb234"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_03934bca2709003c5f08fd436d2"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_47dd0ade7ed449a7aca9b9e6752"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_7f2277da303cf72a0b941a84689"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7729ebbfb24496e67528df573"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de3d937d00b6933e38788aa50e"`);
        await queryRunner.query(`DROP TABLE "user_favorite_skills"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f4849f1cabd9f08ec223b8c19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c7493596b3894a59f806fd0966"`);
        await queryRunner.query(`DROP TABLE "users_want_to_learn"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_recipient"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_recipient_created_at"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_sender"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_receiver"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TYPE "public"."request_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "cities"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "skills"`);
    }

}
