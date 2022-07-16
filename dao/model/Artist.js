const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('Artist', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            defaultValue: 'Unnamed Artist'
        },
        introduction: {
            type: DataTypes.TEXT
        },
        avatar: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'b_artist',
        timestamps: false
    });
};
