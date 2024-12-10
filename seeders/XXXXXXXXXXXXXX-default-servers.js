'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Servers', null, {
      truncate: true,
      cascade: true,
      restartIdentity: true
    });

    return queryInterface.bulkInsert('Servers', [
      {
        url: 'http://213.210.20.204:3010/login',
        name: 'Server 3010',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        url: 'http://213.210.20.204:4000',
        name: 'Server 4000',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        url: 'https://dashboard.giteks.com.tr/login',
        name: 'Dashboard',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {
      ignoreDuplicates: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Servers', null, {});
  }
}; 