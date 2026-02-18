import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1771447010335 implements MigrationInterface {
    name = 'AutoMigration1771447010335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'ZAR', "status" "public"."payment_status_enum" NOT NULL DEFAULT 'PENDING', "provider" character varying, "providerPaymentId" character varying, "checkoutId" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "billId" uuid, "restaurantId" uuid, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3af0086da18f32ac05a52e5639" ON "payment" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ae1a39e01661d5b476e87c7e5" ON "payment" ("restaurantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f8e64c2303f86d781d06bbd549" ON "payment" ("billId") `);
        await queryRunner.query(`CREATE TABLE "bill_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "isPaid" boolean NOT NULL DEFAULT false, "paidAt" TIMESTAMP, "selectedBy" character varying, "selectedAt" TIMESTAMP, "lightspeedItemId" character varying, "paymentId" uuid, "billId" uuid NOT NULL, CONSTRAINT "PK_34a040e2ceb4a3e52250fc4244c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_686fb2f2b0bbceda1f341b1714" ON "bill_item" ("selectedBy") `);
        await queryRunner.query(`CREATE TABLE "square_auth" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accessToken" character varying NOT NULL, "refreshToken" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "merchantId" character varying, "selectedLocationId" character varying, "selectedLocationName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" uuid, CONSTRAINT "PK_b41a405112a2457e45d30ef3c7c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "square_location" ("id" character varying NOT NULL, "name" character varying NOT NULL, "isSelected" boolean NOT NULL DEFAULT false, "restaurantId" uuid, CONSTRAINT "PK_419f3bf6857f213abc9c99b554c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_f8e64c2303f86d781d06bbd549c" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_2ae1a39e01661d5b476e87c7e5b" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bill_item" ADD CONSTRAINT "FK_23da7153d787c856ad741b24816" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bill_item" ADD CONSTRAINT "FK_572dc3d77fb394ff4b2af9fd40f" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "square_auth" ADD CONSTRAINT "FK_24f80b161089eba74d42c3bb02f" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "square_location" ADD CONSTRAINT "FK_9930ad34a9698e452920d3214b7" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "square_location" DROP CONSTRAINT "FK_9930ad34a9698e452920d3214b7"`);
        await queryRunner.query(`ALTER TABLE "square_auth" DROP CONSTRAINT "FK_24f80b161089eba74d42c3bb02f"`);
        await queryRunner.query(`ALTER TABLE "bill_item" DROP CONSTRAINT "FK_572dc3d77fb394ff4b2af9fd40f"`);
        await queryRunner.query(`ALTER TABLE "bill_item" DROP CONSTRAINT "FK_23da7153d787c856ad741b24816"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_2ae1a39e01661d5b476e87c7e5b"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_f8e64c2303f86d781d06bbd549c"`);
        await queryRunner.query(`DROP TABLE "square_location"`);
        await queryRunner.query(`DROP TABLE "square_auth"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_686fb2f2b0bbceda1f341b1714"`);
        await queryRunner.query(`DROP TABLE "bill_item"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f8e64c2303f86d781d06bbd549"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ae1a39e01661d5b476e87c7e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3af0086da18f32ac05a52e5639"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    }

}
