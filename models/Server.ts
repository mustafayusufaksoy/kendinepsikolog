'use server';
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../src/lib/database';

class Server extends Model {
    declare id: number;
    declare url: string;
    declare name: string;
    declare createdAt: Date;
    declare updatedAt: Date;
}

Server.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'Servers',
    modelName: 'Server'
});

export default Server; 