import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAccountsTable1789600000000 implements MigrationInterface {
  name = 'CreateAccountsTable1789600000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'accounts',
      columns: [
        { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'userId', type: 'integer' },
        { name: 'name', type: 'varchar', length: '100' },
        { name: 'type', type: 'varchar', length: '10' },
        { name: 'currency', type: 'varchar', length: '3' },
        { name: 'openingBalanceMinor', type: 'integer', default: 0 },
        { name: 'created_at', type: 'timestamptz', default: 'now()' },
        { name: 'updated_at', type: 'timestamptz', default: 'now()' }
      ],
      foreignKeys: [{
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      }],
      indices: [{ name: 'IDX_accounts_user_id', columnNames: ['userId'] }]
    }))
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('accounts')
  }
}
