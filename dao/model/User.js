const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    sequelize.define('User', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        email: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        bio: {
            type: DataTypes.TEXT
        },
        profileImg: {
            type: DataTypes.BLOB('medium')
        },
        isSuspended: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        lastLogin: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'b_user'
    });
};
