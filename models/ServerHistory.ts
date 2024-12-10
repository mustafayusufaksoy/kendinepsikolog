import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../src/lib/database';

interface ServerHistoryAttributes {
  id?: number;
  status: string;
  responseTime: number;
  error: string | null;
  checkDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  ServerId: number;
  statusCode: number;
}

class ServerHistory extends Model<ServerHistoryAttributes> implements ServerHistoryAttributes {
  public id!: number;
  public status!: string;
  public responseTime!: number;
  public error!: string | null;
  public checkDate!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
  public ServerId!: number;
  public statusCode!: number;
}

ServerHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checkDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ServerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Servers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ServerLogs',
    modelName: 'ServerHistory',
  }
);

export default ServerHistory;
