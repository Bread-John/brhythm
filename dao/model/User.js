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
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT
        },
        bio: {
            type: DataTypes.TEXT
        },
        profileImg: {
            type: DataTypes.TEXT
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
