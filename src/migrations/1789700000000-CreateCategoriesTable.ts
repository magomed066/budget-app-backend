import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateCategoriesTable1789700000000 implements MigrationInterface {
  name = 'CreateCategoriesTable1789700000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'categories',
      columns: [
        { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'userId', type: 'integer' },
        { name: 'name', type: 'varchar', length: '100' },
        { name: 'type', type: 'varchar', length: '10' },
        { name: 'created_at', type: 'timestamptz', default: 'now()' },
        { name: 'updated_at', type: 'timestamptz', default: 'now()' }
      ],
      foreignKeys: [{
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      }],
      indices: [{ name: 'IDX_categories_user_id', columnNames: ['userId'] }]
    }))
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('categories')
  }
}
