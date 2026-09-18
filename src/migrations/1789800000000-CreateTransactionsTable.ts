import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTransactionsTable1789800000000 implements MigrationInterface {
  name = 'CreateTransactionsTable1789800000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE accounts ADD CONSTRAINT "UQ_accounts_id_user" UNIQUE (id, "userId")`)
    await queryRunner.query(`ALTER TABLE categories ADD CONSTRAINT "UQ_categories_id_user_type" UNIQUE (id, "userId", type)`)
    await queryRunner.query(`CREATE TABLE transactions (
      id SERIAL PRIMARY KEY,
      "userId" integer NOT NULL,
      "accountId" integer NOT NULL,
      "categoryId" integer NOT NULL,
      type varchar(10) NOT NULL,
      "amountMinor" integer NOT NULL,
      date date NOT NULL,
      note varchar(1000),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "CHK_transactions_amount" CHECK ("amountMinor" > 0),
      CONSTRAINT "CHK_transactions_type" CHECK (type IN ('income', 'expense')),
      CONSTRAINT "FK_transactions_account_owner" FOREIGN KEY ("accountId", "userId")
        REFERENCES accounts (id, "userId") ON DELETE RESTRICT ON UPDATE RESTRICT,
      CONSTRAINT "FK_transactions_category_owner_type" FOREIGN KEY ("categoryId", "userId", type)
        REFERENCES categories (id, "userId", type) ON DELETE RESTRICT ON UPDATE RESTRICT
    )`)
    await queryRunner.query(`CREATE INDEX "IDX_transactions_user_date" ON transactions ("userId", date, id)`)
    await queryRunner.query(`CREATE INDEX "IDX_transactions_account_owner" ON transactions ("accountId", "userId")`)
    await queryRunner.query(`CREATE INDEX "IDX_transactions_category_owner_type" ON transactions ("categoryId", "userId", type)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE transactions`)
    await queryRunner.query(`ALTER TABLE categories DROP CONSTRAINT "UQ_categories_id_user_type"`)
    await queryRunner.query(`ALTER TABLE accounts DROP CONSTRAINT "UQ_accounts_id_user"`)
  }
}
