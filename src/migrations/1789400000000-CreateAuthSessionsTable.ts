import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAuthSessionsTable1789400000000
  implements MigrationInterface
{
  name = 'CreateAuthSessionsTable1789400000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'user_id',
            type: 'integer'
          },
          {
            name: 'expires_at',
            type: 'timestamptz'
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()'
          }
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ],
        indices: [
          {
            name: 'IDX_auth_sessions_user_id',
            columnNames: ['user_id']
          }
        ]
      })
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_sessions')
  }
}
